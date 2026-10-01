import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getProfile, listDhikr, listQada, listQuranLogs, listWorshipLogs } from "@/lib/data.functions";
import { computeTimes, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { hawlProgress } from "@/lib/hawl";
import { HIJRI_OFFSET_KEY } from "@/lib/hijri";
import { daysSinceActivity, isWhiteDayTomorrow, localISO, morningAdhkarStreak, pagesLeftToday, qadaLeftToday } from "@/lib/smart-reminders";
import { loadReminders, notify, onceToday, type ReminderSettings } from "@/lib/reminders";

function alert(key: string, title: string, body: string) {
  if (!onceToday(key)) return;
  void notify(title, body).then(sent => { if (!sent) toast(title, { description: body, duration: 10000 }); });
}

/** Activity-aware reminders while the app is open; no background delivery. */
export function ReminderCenter() {
  const profileFn = useServerFn(getProfile);
  const quranFn = useServerFn(listQuranLogs);
  const qadaFn = useServerFn(listQada);
  const dhikrFn = useServerFn(listDhikr);
  const worshipFn = useServerFn(listWorshipLogs);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
  const quran = useQuery({ queryKey: ["quran"], queryFn: () => quranFn({ data: undefined as any }) });
  const qada = useQuery({ queryKey: ["qada"], queryFn: () => qadaFn({ data: undefined as any }) });
  const dhikr = useQuery({ queryKey: ["dhikr"], queryFn: () => dhikrFn({ data: undefined as any }) });
  const worship = useQuery({ queryKey: ["worship-history-all"], queryFn: () => worshipFn({ data: { limit: 90 } }) });
  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    const sync = () => setSettings(loadReminders());
    sync();
    window.addEventListener("mhq-reminders", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("mhq-reminders", sync); window.removeEventListener("storage", sync); };
  }, []);

  // Cache location for the offline page.
  useEffect(() => {
    const p = profile.data;
    if (p?.latitude && p?.longitude) localStorage.setItem("mhq-coords", JSON.stringify({ latitude: p.latitude, longitude: p.longitude, label: p.location_label, method: p.calc_method, madhab: p.madhab }));
  }, [profile.data]);

  useEffect(() => {
    const p = profile.data;
    if (!settings || !p) return;
    const check = () => {
      const now = new Date();
      const userKey = `${p.id}-`;
      const send = (key: string, title: string, body: string) => alert(`${userKey}${key}`, title, body);
      if (p.latitude && p.longitude && (settings.adhan || settings.iqamah || settings.prayerSoon)) {
        const times = computeTimes({ latitude: p.latitude, longitude: p.longitude, method: p.calc_method, madhab: p.madhab }, now);
        for (const name of PRAYERS) {
          const at = times[name].getTime();
          const diff = now.getTime() - at;
          if (settings.prayerSoon && diff >= -15 * 60_000 && diff < -10 * 60_000) send(`soon-${name}`, `${PRAYER_LABEL[name]} begins in ${Math.ceil(-diff / 60_000)} minutes`, "A quiet moment to prepare, if you can.");
          if (settings.adhan && diff >= 0 && diff < 5 * 60_000) send(`adhan-${name}`, `Time for ${PRAYER_LABEL[name]}`, "Hayya 'ala as-salah — come to prayer.");
          const iq = at + settings.iqamahOffset * 60_000;
          const d2 = now.getTime() - iq;
          if (settings.iqamah && d2 >= 0 && d2 < 5 * 60_000) send(`iqamah-${name}`, `${PRAYER_LABEL[name]} iqamah`, "A moment to pause for salah.");
        }
      }
      if (settings.evening) {
        const [h, m] = settings.eveningTime.split(":").map(Number);
        const t = new Date(now); t.setHours(h, m, 0, 0);
        if (now >= t && now.getTime() - t.getTime() < 10 * 60_000) send("evening", "Evening check-in", "Take 60 seconds to review your day & log your prayers.");
      }
      if (settings.hawl && p.zakat_anniversary) {
        const hp = hawlProgress(p.zakat_anniversary, now);
        if (hp && (hp.daysRemaining === 30 || hp.daysRemaining === 7)) send(`hawl-${hp.daysRemaining}`, `Zakat anniversary in ${hp.daysRemaining} days`, "Review your wealth and prepare to give your Zakat.");
      }
      const today = localISO(now);
      const atHour = (hour: number) => now.getHours() === hour && now.getMinutes() < 10;
      if (settings.whiteDays && atHour(17)) {
        const offset = Math.max(-2, Math.min(2, Number(localStorage.getItem(HIJRI_OFFSET_KEY)) || 0));
        if (isWhiteDayTomorrow(now, offset)) send("white-days", "The first White Day begins tomorrow", "If you wish to fast, this is a gentle heads-up.");
      }
      if (settings.quranPace && atHour(18) && quran.isSuccess) {
        const left = pagesLeftToday(quran.data, p.khatm_target, p.khatm_start, now);
        if (left > 0) send("quran-pace", "Your Quran reading", `You have ${left} page${left === 1 ? "" : "s"} left to reach today's Khatm pace.`);
      }
      if (settings.qadaPlan && atHour(19) && qada.isSuccess) {
        const saved = Number(localStorage.getItem("mhq-qada-plan"));
        if (saved >= 1 && saved <= 10) {
          const left = qadaLeftToday(qada.data, saved, today);
          if (left > 0) send("qada-plan", "Your Qada plan", `You planned ${left === 1 ? "one Qada prayer" : `${left} Qada prayers`} today. One at a time is enough.`);
        }
      }
      if (settings.adhkarStreak && atHour(9) && dhikr.isSuccess) {
        const streak = morningAdhkarStreak(dhikr.data, now);
        if ([3, 7, 14, 30].includes(streak) || (streak > 30 && streak % 30 === 0)) send("adhkar-streak", "Morning Adhkar", `You've completed Morning Adhkar ${streak} days in a row. May it bring you peace.`);
      }
      if (settings.gentleReset && atHour(20) && worship.isSuccess && quran.isSuccess && dhikr.isSuccess) {
        const days = daysSinceActivity([
          ...worship.data.filter(row => PRAYERS.some(name => Boolean(row[`${name}_status`])) || (row.dhikr_count ?? 0) > 0 || (row.quran_pages ?? 0) > 0).map(row => row.log_date),
          ...quran.data.map(row => row.log_date),
          ...dhikr.data.map(row => row.log_date),
        ], now);
        if (days !== null && days >= 3 && days <= 7) send("fresh-start", "A gentle fresh start", "You haven't logged worship for a few days. Start again today, at your own pace.");
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings, profile.data, quran.data, quran.isSuccess, qada.data, qada.isSuccess, dhikr.data, dhikr.isSuccess, worship.data, worship.isSuccess]);

  return null;
}
