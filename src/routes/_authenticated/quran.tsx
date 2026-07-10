import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createQuranLog, listQuranLogs } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/quran")({
  head: () => ({ meta: [{ title: "Quran Tracker — Muslim HQ" }] }),
  component: QuranPage,
});

function QuranPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQuranLogs);
  const createFn = useServerFn(createQuranLog);
  const { data = [] } = useQuery({ queryKey: ["quran"], queryFn: () => listFn({ data: undefined as any }) });
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["quran"] }) });

  const [form, setForm] = useState({ log_date: todayISO(), surah: "", juz: 0, pages: 0, minutes: 0, tafsir: false, reflection: "" });

  const totalPages = data.reduce((s: number, r: any) => s + (r.pages ?? 0), 0);
  const totalMinutes = data.reduce((s: number, r: any) => s + (r.minutes ?? 0), 0);
  const totalJuz = data.reduce((s: number, r: any) => s + (Number(r.juz) || 0), 0);

  return (
    <AppShell>
      <PageHeader eyebrow="Quran" title="Reading & reflection" subtitle="Even a single page turns into light on Yawm al-Qiyamah." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Total pages</p><p className="text-3xl font-serif">{totalPages}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Juz progressed</p><p className="text-3xl font-serif">{totalJuz.toFixed(1)}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Minutes</p><p className="text-3xl font-serif">{totalMinutes}</p></Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-serif text-2xl mb-4">Log a session</h3>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <input placeholder="Surah" value={form.surah} onChange={e => setForm({ ...form, surah: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <input type="number" step={0.5} placeholder="Juz" value={form.juz} onChange={e => setForm({ ...form, juz: +e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <input type="number" placeholder="Pages" value={form.pages} onChange={e => setForm({ ...form, pages: +e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <input type="number" placeholder="Minutes" value={form.minutes} onChange={e => setForm({ ...form, minutes: +e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tafsir} onChange={e => setForm({ ...form, tafsir: e.target.checked })} /> Tafsir studied</label>
        </div>
        <textarea placeholder="Reflection..." rows={3} value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border mb-3" />
        <Button onClick={() => { create.mutate(form); setForm({ ...form, surah: "", pages: 0, minutes: 0, reflection: "" }); }}>Add session</Button>
      </Card>

      <div className="grid gap-2">
        {data.map((r: any) => (
          <div key={r.id} className="p-4 rounded-2xl ring-1 ring-border">
            <div className="flex justify-between items-baseline">
              <p className="font-medium">{r.surah || "Session"} <span className="text-muted-foreground text-sm">· {r.log_date}</span></p>
              <p className="text-xs text-muted-foreground">{r.pages}pp · {r.minutes}m {r.tafsir && "· tafsir"}</p>
            </div>
            {r.reflection && <p className="text-sm text-muted-foreground mt-2 italic">"{r.reflection}"</p>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
