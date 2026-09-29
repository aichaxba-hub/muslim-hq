import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFasting, upsertFasting } from "@/lib/data.functions";
import { FAST_TYPES } from "@/lib/fasting";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/fasting")({
  head: () => ({ meta: [{ title: "Fasting — Muslim HQ" }] }),
  component: FastingPage,
});

function FastingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFasting);
  const upsertFn = useServerFn(upsertFasting);
  const { data = [] } = useQuery({ queryKey: ["fasting"], queryFn: () => listFn({ data: undefined as any }) });
  const upsert = useMutation({ mutationFn: (p: any) => upsertFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["fasting"] }) });
  const [form, setForm] = useState({ log_date: todayISO(), fast_type: "Shawwal", completed: true, notes: "" });

  const done = (t: string) => data.filter((f: any) => f.fast_type === t && f.completed).length;
  const sunnahCount = data.filter((f: any) => (f.fast_type === "Monday Sunnah" || f.fast_type === "Thursday Sunnah") && f.completed).length;

  return (
    <AppShell>
      <PageHeader eyebrow="Fasting" title="Sawm journal" subtitle="Every fast is a shield." />

      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Ramadan</p><p className="text-3xl font-serif">{done("Ramadan")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Shawwal</p><p className="text-3xl font-serif">{done("Shawwal")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Day of Arafah</p><p className="text-3xl font-serif">{done("Day of Arafah")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Sunnah</p><p className="text-3xl font-serif">{sunnahCount}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Qada</p><p className="text-3xl font-serif">{done("Qada (Makeup)")}</p></Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-serif text-2xl mb-4">Log a fast</h3>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <select value={form.fast_type} onChange={e => setForm({ ...form, fast_type: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
            {FAST_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.completed} onChange={e => setForm({ ...form, completed: e.target.checked })} /> Completed</label>
          <Button onClick={() => upsert.mutate(form)}>Save</Button>
        </div>
        <input placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-3 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
      </Card>

      <div className="grid gap-2">
        {data.map((f: any) => (
          <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl ring-1 ring-border">
            <div>
              <p className="font-medium">{f.log_date} <span className="text-xs text-muted-foreground">· {f.fast_type}</span></p>
              {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${f.completed ? "bg-[color:var(--sage-deep)] text-[color:var(--sand)]" : "ring-1 ring-border"}`}>{f.completed ? "Completed" : "Missed"}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
