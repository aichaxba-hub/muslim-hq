import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Button, Card, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRamadanPlan, listRamadanChecklist, saveRamadanChecklist, saveRamadanPlan } from "@/lib/ramadan.functions";
import { ramadanRange, todayISO } from "@/lib/hijri";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ramadan")({
  head: () => ({ meta: [
    { title: "Ramadan Plan — Muslim HQ" },
    { name: "description", content: "Set your Ramadan goals and tick off a gentle daily checklist." },
    { property: "og:title", content: "Ramadan Plan — Muslim HQ" },
    { property: "og:description", content: "Daily salah, Quran, fasting and dua goals with a gentle Ramadan checklist." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RamadanPage,
});

const CHECKLIST = [
  { id: "suhoor", label: "Ate suhoor" },
  { id: "fast", label: "Kept my fast" },
  { id: "fajr", label: "Fajr" }, { id: "dhuhr", label: "Dhuhr" }, { id: "asr", label: "Asr" },
  { id: "maghrib", label: "Maghrib" }, { id: "isha", label: "Isha" },
  { id: "taraweeh", label: "Taraweeh" },
  { id: "quran", label: "Read my Quran portion" },
  { id: "dua_iftar", label: "Made dua before iftar" },
  { id: "dhikr", label: "Morning / evening adhkar" },
  { id: "sadaqah", label: "Gave something in charity" },
];

const GOALS = [
  { key: "salah_goal", label: "Salah goal", placeholder: "e.g. All 5 on time + taraweeh most nights" },
  { key: "quran_goal", label: "Quran goal", placeholder: "e.g. Finish one khatm — 1 juz a day" },
  { key: "fasting_goal", label: "Fasting goal", placeholder: "e.g. All 30 fasts, gentle on myself if excused" },
  { key: "dua_goal", label: "Dua goal", placeholder: "e.g. A personal dua list for the last 10 nights" },
] as const;

function RamadanPage() {
  const qc = useQueryClient();
  const planFn = useServerFn(getRamadanPlan);
  const savePlanFn = useServerFn(saveRamadanPlan);
  const listFn = useServerFn(listRamadanChecklist);
  const saveDayFn = useServerFn(saveRamadanChecklist);

  const plan = useQuery({ queryKey: ["ramadan-plan"], queryFn: () => planFn() });
  const days = useQuery({ queryKey: ["ramadan-checklist"], queryFn: () => listFn() });

  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { if (plan.data) setForm(plan.data); }, [plan.data]);

  const savePlan = useMutation({
    mutationFn: () => savePlanFn({ data: {
      salah_goal: form.salah_goal || null, quran_goal: form.quran_goal || null,
      fasting_goal: form.fasting_goal || null, dua_goal: form.dua_goal || null, intention: form.intention || null,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ramadan-plan"] }); toast.success("Ramadan plan saved"); },
    onError: () => toast.error("Could not save — please try again"),
  });

  const range = ramadanRange();
  const today = todayISO();
  const clamp = (d: string) => !range ? d : d < range.start ? range.start : d > range.end ? range.end : d;
  const [date, setDate] = useState(clamp(today));
  const dayNum = range ? Math.round((new Date(date).getTime() - new Date(range.start).getTime()) / 86400000) + 1 : null;
  const phase = !range ? "" : today < range.start ? "upcoming" : today > range.end ? "past" : "now";
  const fmt = (iso: string) => new Date(iso + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const inRange = (days.data ?? []).filter((d) => !range || (d.log_date >= range.start && d.log_date <= range.end));
  const current = days.data?.find((d) => d.log_date === date)?.items ?? {};
  const saveDay = useMutation({
    mutationFn: (items: Record<string, boolean>) => saveDayFn({ data: { log_date: date, items } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ramadan-checklist"] }),
    onError: () => toast.error("Could not save — please try again"),
  });
  const done = CHECKLIST.filter((c) => current[c.id]).length;
  const input = "w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]";

  return (
    <AppShell>
      <PageHeader eyebrow="Ramadan" title="Your Ramadan plan" subtitle="Small, sincere, consistent. One day at a time." />

      {range && (
        <Card className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Ramadan {range.hijriYear} AH</p>
          <p className="font-serif text-2xl">{fmt(range.start)} – {fmt(range.end)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {phase === "upcoming" && `Begins in ${Math.ceil((new Date(range.start).getTime() - new Date(today).getTime()) / 86400000)} days — time to prepare gently.`}
            {phase === "now" && "Ramadan Mubarak — you are in the blessed month."}
            {phase === "past" && "This year's Ramadan has passed. May Allah accept it from you."}
            {" "}Dates are estimated (Umm al-Qura) and may differ by a day with local moon sighting.
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="font-serif text-xl mb-4">Goals for this Ramadan</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {GOALS.map((g) => (
            <div key={g.key}>
              <label className="block text-sm text-muted-foreground mb-1.5">{g.label}</label>
              <textarea rows={2} value={form[g.key] ?? ""} placeholder={g.placeholder} onChange={(e) => setForm({ ...form, [g.key]: e.target.value })} className={input} />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1.5">My intention</label>
            <textarea rows={2} value={form.intention ?? ""} placeholder="Why this Ramadan matters to me…" onChange={(e) => setForm({ ...form, intention: e.target.value })} className={input} />
          </div>
        </div>
        <Button className="mt-4" onClick={() => savePlan.mutate()} disabled={savePlan.isPending}>{savePlan.isPending ? "Saving…" : "Save plan"}</Button>
      </Card>

      <Card className="mb-6">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl">Daily checklist</h2>
            <p className="text-xs text-muted-foreground">{dayNum ? `Day ${dayNum} of ${range!.days} · ` : ""}{done} of {CHECKLIST.length} done — every tick counts.</p>
          </div>
          <input type="date" value={date} min={range?.start} max={range?.end} onChange={(e) => setDate(clamp(e.target.value))} className="rounded-xl bg-background ring-1 ring-border px-3 py-2 text-sm" />
        </div>
        <div className="h-1.5 rounded-full bg-muted mb-5 overflow-hidden">
          <div className="h-full bg-[color:var(--sage)] transition-all" style={{ width: `${(done / CHECKLIST.length) * 100}%` }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {CHECKLIST.map((c) => {
            const on = !!current[c.id];
            return (
              <button key={c.id} onClick={() => saveDay.mutate({ ...current, [c.id]: !on })}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-border text-left text-sm ${on ? "bg-secondary" : "bg-background"}`}>
                <span className={`size-5 rounded-md grid place-items-center ring-1 ring-border ${on ? "bg-primary text-primary-foreground" : ""}`}>{on && <Check className="size-3.5" />}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </Card>

      {!!inRange.length && (
        <Card>
          <h2 className="font-serif text-xl mb-3">Recent days</h2>
          <ul className="text-sm divide-y divide-border">
            {inRange.slice(0, 30).map((d) => {
              const n = CHECKLIST.filter((c) => d.items?.[c.id]).length;
              return (
                <li key={d.log_date} className="py-2 flex justify-between">
                  <button onClick={() => setDate(d.log_date)} className="hover:underline">{d.log_date}</button>
                  <span className="text-muted-foreground">{n}/{CHECKLIST.length}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
