import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Button, Card, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRamadanPlan, listRamadanChecklist, saveRamadanChecklist, saveRamadanPlan } from "@/lib/ramadan.functions";
import { todayISO } from "@/lib/hijri";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ramadan")({
  head: () => ({ meta: [
    { title: "Ramadan Plan — Muslim HQ" },
    { name: "description", content: "Set your Ramadan goals and tick off a gentle daily checklist." },
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

  const [date, setDate] = useState(todayISO());
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
            <p className="text-xs text-muted-foreground">{done} of {CHECKLIST.length} done — every tick counts.</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl bg-background ring-1 ring-border px-3 py-2 text-sm" />
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

      {!!days.data?.length && (
        <Card>
          <h2 className="font-serif text-xl mb-3">Recent days</h2>
          <ul className="text-sm divide-y divide-border">
            {days.data.slice(0, 30).map((d) => {
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
