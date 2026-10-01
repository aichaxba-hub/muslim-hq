import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, Button } from "@/components/AppShell";
import { DEFAULT_REMINDERS, loadReminders, notify, saveReminders, type ReminderSettings } from "@/lib/reminders";

export function ReminderSettingsCard() {
  const [s, setS] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { setS(loadReminders()); setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission); }, []);
  const update = (patch: Partial<ReminderSettings>) => { const next = { ...s, ...patch }; setS(next); saveReminders(next); };

  async function enable() {
    if (typeof Notification === "undefined") return toast.error("This browser does not support notifications");
    const r = await Notification.requestPermission();
    setPerm(r);
    if (r === "granted") { await notify("Reminders on", "You will be gently reminded while Muslim HQ is open."); }
    else toast("Notifications blocked — reminders will show inside the app instead.");
  }

  const row = (label: string, checked: boolean, onChange: (v: boolean) => void, extra?: React.ReactNode) => (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border last:border-0">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> {label}</label>
      {extra}
    </div>
  );

  return (
    <Card className="mb-6">
      <h2 className="font-serif text-2xl mb-1">Reminders</h2>
      <p className="text-sm text-muted-foreground mb-4">Alerts appear while Muslim HQ is open (or installed and running on your device).</p>
      {perm !== "granted" && perm !== "unsupported" && <Button onClick={enable} className="mb-3">Allow notifications</Button>}
      {row("Prayer approaching — 15 minutes before", s.prayerSoon, v => update({ prayerSoon: v }))}
      {row("Adhan — at each prayer time", s.adhan, v => update({ adhan: v }))}
      {row("Iqamah reminder", s.iqamah, v => update({ iqamah: v }),
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <input aria-label="Minutes after adhan" type="number" min={1} max={60} value={s.iqamahOffset} onChange={e => update({ iqamahOffset: Math.min(60, Math.max(1, +e.target.value || 15)) })} className="w-14 rounded-md bg-background px-2 py-1 ring-1 ring-border" /> min after adhan
        </label>)}
      {row("Evening check-in: “Take 60 seconds to review your day”", s.evening, v => update({ evening: v }),
        <input aria-label="Evening reminder time" type="time" value={s.eveningTime} onChange={e => update({ eveningTime: e.target.value })} className="rounded-md bg-background px-2 py-1 text-xs ring-1 ring-border" />)}
      {row("Hawl anniversary — 30 and 7 days before", s.hawl, v => update({ hawl: v }))}
      {row("Quran reading pace", s.quranPace, v => update({ quranPace: v }))}
      {row("Qada daily plan", s.qadaPlan, v => update({ qadaPlan: v }))}
      {row("White Days — the day before", s.whiteDays, v => update({ whiteDays: v }))}
      {row("Morning Adhkar milestones", s.adhkarStreak, v => update({ adhkarStreak: v }))}
      {row("Gentle fresh start", s.gentleReset, v => update({ gentleReset: v }))}
    </Card>
  );
}
