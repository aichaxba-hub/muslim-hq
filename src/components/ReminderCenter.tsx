import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getProfile, listDhikr, listQada, listQuranLogs, listWorshipLogs } from "@/lib/data.functions";
import { computeTimes, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { hawlProgress } from "@/lib/hawl";
import { HIJRI_OFFSET_KEY, nextIslamicEventGroup, todayISO } from "@/lib/hijri";
import { loadReminders, notify, onceToday, type ReminderSettings } from "@/lib/reminders";
import { buildSmartReminders, consecutiveDayStreak, daysBetween } from "@/lib/smart-reminders";

function alert(key: string, title: string, body: string) {
  if (!onceToday(key)) return;
  void notify(title, body).then(sent => { if (!sent) toast(title, { description: body, duration: 10000 }); });
}

function countAyat(verses: string | null | undefined): number {
  const m = /^(\d+):(\d+)(?:[–-](\d+))?$/.exec(String(verses ?? "").trim());
  if (!m) return 0;
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  return Math.max(0, to - from + 1);
}

/** Runs while the app is open: prayer-time alerts plus gentle, data-aware nudges. */
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
  const worship = useQuery({ queryKey: ["worship-history-all"], queryFn: () => worshipFn({ data: {} }) });
  const [settings, setSettings] = useState<ReminderSettings | null>(null);

  useEffect(() => {
    const sync = () => setSettings(loadReminders());
    sync();
    window.addEventListener("mhq-reminders", sync);
    return () => window.removeEventListener("mhq-reminders", sync);
  }, []);

  // Cache location for the offline page.
  useEffect(() => {
    const p = profile.data;
    if (p?.latitude && p?.longitude) localStorage.setItem("mhq-coords", JSON.stringify({ latitude: p.latitude, longitude: p.longitude, label: p.location_label, method: p.calc_method, madhab: p.madhab }));
  }, [profile.data]);

  const smartInput = useMemo(() => {
    const today = todayISO();
    const quranRows = (quran.data ?? []) as any[];
    const qadaRows = (qada.data ?? []) as any[];
    const dhikrRows = (dhikr.data ?? []) as any[];
    const worshipRows = (worship.data ?? []) as any[];

    const ayatToday = quranRows.filter(r => r.log_date === today).reduce((s, r) => s + countAyat(r.verses_completed), 0);
    const goal = Number((profile.data as any)?.quran_daily_goal ?? 0);

    const plannedPerDay = (() => {
      const saved = Number(localStorage.getItem("mhq-qada-plan"));
      return Number.isFinite(saved) && saved > 0 ? Math.min(10, saved) : 1;
    })();
    const doneToday = qadaRows.filter(r => r.completed && r.made_up_date === today).length;
    const remaining = qadaRows.filter(r => !r.completed).length;

    const offset = (() => {
      const raw = Number(localStorage.getItem(HIJRI_OFFSET_KEY));
      return Number.isFinite(raw) ? Math.max(-2, Math.min(2, raw)) : 0;
    })();
    const events = nextIslamicEventGroup(new Date(), offset);

    const dhikrStreak = consecutiveDayStreak(dhikrRows.map(r => String(r.log_date)), today);
    const lastWorship = worshipRows.map(r => String(r.log_date)).sort().at(-1);
    const daysSinceWorship = lastWorship ? daysBetween(lastWorship, today) : null;

    return { quran: { ayatToday, goal }, qada: { plannedPerDay, doneToday, remaining }, events, dhikrStreak, daysSinceWorship };
  }, [profile.data, quran.data, qada.data, dhikr.data, worship.data]);

  useEffect(() => {
    const p = profile.data;
    if (!settings || !p) return;
    const check = () => {
      const now = new Date();
      if (p.latitude && p.longitude && (settings.adhan || settings.preAdhan || settings.iqamah)) {
        const times = computeTimes({ latitude: p.latitude, longitude: p.longitude, method: p.calc_method, madhab: p.madhab }, now);
        for (const name of PRAYERS) {
          const at = times[name].getTime();
          const diff = now.getTime() - at;
          if (settings.preAdhan) {
            const pre = at - settings.preAdhanOffset * 60_000;
            const dp = now.getTime() - pre;
            if (dp >= 0 && dp < 5 * 60_000) alert(`pre-${name}`, `${PRAYER_LABEL[name]} begins in ${settings.preAdhanOffset} minutes`, "A good moment to make wudu and settle your heart.");
          }
          if (settings.adhan && diff >= 0 && diff < 5 * 60_000) alert(`adhan-${name}`, `Time for ${PRAYER_LABEL[name]}`, "Hayya 'ala as-salah — come to prayer.");
          const iq = at + settings.iqamahOffset * 60_000;
          const d2 = now.getTime() - iq;
          if (settings.iqamah && d2 >= 0 && d2 < 5 * 60_000) alert(`iqamah-${name}`, `${PRAYER_LABEL[name]} iqamah`, "The prayer is being established. Stand for salah.");
        }
      }
      const [h, m] = settings.eveningTime.split(":").map(Number);
      const digestAt = new Date(now); digestAt.setHours(h, m, 0, 0);
      const digestOpen = now >= digestAt && now.getTime() - digestAt.getTime() < 3 * 3600_000;
      if (settings.evening && digestOpen) alert("evening", "Evening check-in", "Take 60 seconds to review your day & log your prayers.");
      if (settings.hawl && p.zakat_anniversary) {
        const hp = hawlProgress(p.zakat_anniversary, now);
        if (hp && (hp.daysRemaining === 30 || hp.daysRemaining === 7)) alert(`hawl-${hp.daysRemaining}`, `Zakat anniversary in ${hp.daysRemaining} days`, "Review your wealth and prepare to give your Zakat.");
      }
      for (const r of buildSmartReminders({ settings, digestOpen, ...smartInput })) alert(r.key, r.title, r.body);
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings, profile.data, smartInput]);

  return null;
}
