import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getProfile } from "@/lib/data.functions";
import { computeTimes, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { hawlProgress } from "@/lib/hawl";
import { loadReminders, notify, onceToday, type ReminderSettings } from "@/lib/reminders";

function alert(key: string, title: string, body: string) {
  if (!onceToday(key)) return;
  void notify(title, body).then(sent => { if (!sent) toast(title, { description: body, duration: 10000 }); });
}

/** Runs while the app is open: Adhan/Iqamah, evening check-in, and 30/7-day Hawl alerts. */
export function ReminderCenter() {
  const profileFn = useServerFn(getProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
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

  useEffect(() => {
    const p = profile.data;
    if (!settings || !p) return;
    const check = () => {
      const now = new Date();
      if (p.latitude && p.longitude && (settings.adhan || settings.iqamah)) {
        const times = computeTimes({ latitude: p.latitude, longitude: p.longitude, method: p.calc_method, madhab: p.madhab }, now);
        for (const name of PRAYERS) {
          const at = times[name].getTime();
          const diff = now.getTime() - at;
          if (settings.adhan && diff >= 0 && diff < 5 * 60_000) alert(`adhan-${name}`, `Time for ${PRAYER_LABEL[name]}`, "Hayya 'ala as-salah — come to prayer.");
          const iq = at + settings.iqamahOffset * 60_000;
          const d2 = now.getTime() - iq;
          if (settings.iqamah && d2 >= 0 && d2 < 5 * 60_000) alert(`iqamah-${name}`, `${PRAYER_LABEL[name]} iqamah`, "The prayer is being established. Stand for salah.");
        }
      }
      if (settings.evening) {
        const [h, m] = settings.eveningTime.split(":").map(Number);
        const t = new Date(now); t.setHours(h, m, 0, 0);
        if (now >= t && now.getTime() - t.getTime() < 3 * 3600_000) alert("evening", "Evening check-in", "Take 60 seconds to review your day & log your prayers.");
      }
      if (settings.hawl && p.zakat_anniversary) {
        const hp = hawlProgress(p.zakat_anniversary, now);
        if (hp && (hp.daysRemaining === 30 || hp.daysRemaining === 7)) alert(`hawl-${hp.daysRemaining}`, `Zakat anniversary in ${hp.daysRemaining} days`, "Review your wealth and prepare to give your Zakat.");
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [settings, profile.data]);

  return null;
}
