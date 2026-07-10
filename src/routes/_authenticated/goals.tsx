import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listGoals, upsertGoal } from "@/lib/data.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Muslim HQ" }] }),
  component: GoalsPage,
});
const CATS = ["Deen", "Dunya", "Habit", "Memorization", "Learning", "Character/Tazkiyah", "Jannah/Akhirah"];
const STATUSES = ["Not Started", "In Progress", "Completed"];

function GoalsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listGoals);
  const upsertFn = useServerFn(upsertGoal);
  const { data = [] } = useQuery({ queryKey: ["goals"], queryFn: () => listFn({ data: undefined as any }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["goals"] });
  const upsert = useMutation({ mutationFn: (p: any) => upsertFn({ data: p }), onSuccess: () => { invalidate(); setForm(empty); setShow(false); } });

  const empty = { title: "", category: "Deen", why: "", quarter: "Q1", target_date: "", status: "Not Started" };
  const [form, setForm] = useState<any>(empty);
  const [show, setShow] = useState(false);

  return (
    <AppShell>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <PageHeader eyebrow="Goals & Growth" title="What you are building toward" />
        <Button onClick={() => setShow(v => !v)} variant="gold">+ New goal</Button>
      </div>

      {show && (
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border md:col-span-2" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {["Q1", "Q2", "Q3", "Q4"].map(q => <option key={q}>{q}</option>)}
            </select>
            <textarea placeholder="Why this matters" value={form.why} onChange={e => setForm({ ...form, why: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border md:col-span-2" rows={2} />
            <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="mt-4"><Button onClick={() => upsert.mutate(form)}>Save</Button></div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {data.map((g: any) => (
          <Card key={g.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{g.category} · {g.quarter}</p>
                <h3 className="font-serif text-2xl">{g.title}</h3>
              </div>
              <select value={g.status} onChange={e => upsert.mutate({ id: g.id, status: e.target.value, title: g.title })} className="text-xs bg-transparent">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {g.why && <p className="text-sm text-muted-foreground mt-2">{g.why}</p>}
            {g.target_date && <p className="text-xs text-muted-foreground mt-3">Target: {g.target_date}</p>}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
