import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createQada, listQada, updateQada } from "@/lib/data.functions";
import { useState } from "react";
import { PRAYER_LABEL, PRAYERS } from "@/lib/prayer-times";
import { todayISO } from "@/lib/hijri";

export const Route = createFileRoute("/_authenticated/qada")({
head: () => ({ meta: [
    { title: "Qada Salah Tracker — Muslim HQ" },
    { name: "description", content: "Gently track and complete missed prayers, one makeup at a time." },
    { property: "og:title", content: "Qada Salah Tracker — Muslim HQ" },
    { property: "og:description", content: "Gently track and complete missed prayers, one makeup at a time." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: QadaPage,
});

function QadaPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQada);
  const createFn = useServerFn(createQada);
  const updateFn = useServerFn(updateQada);
  const { data = [] } = useQuery({ queryKey: ["qada"], queryFn: () => listFn({ data: undefined as any }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["qada"] });
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (p: any) => updateFn({ data: p }), onSuccess: invalidate });

  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [prayer, setPrayer] = useState<string>("Fajr");
  const [missed, setMissed] = useState(todayISO());

  const filtered = data.filter((q: any) => filter === "all" ? true : filter === "pending" ? !q.completed : q.completed);

  const pending = data.filter((q: any) => !q.completed);
  const pendingByPrayer = Object.fromEntries(
    PRAYERS.map(p => [PRAYER_LABEL[p], pending.filter((q: any) => q.prayer === PRAYER_LABEL[p]).length]),
  ) as Record<string, number>;
  const completedCount = data.length - pending.length;

  return (
    <AppShell>
      <PageHeader eyebrow="Qada Salah" title="Make-up prayers" subtitle="Track missed prayers gently. Every one you make up is a return." />

      <Card className="mb-6">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Prayer</label>
            <select value={prayer} onChange={e => setPrayer(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {PRAYERS.map(p => <option key={p} value={PRAYER_LABEL[p]}>{PRAYER_LABEL[p]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Original date</label>
            <input type="date" value={missed} onChange={e => setMissed(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          </div>
          <Button onClick={() => create.mutate({ prayer, missed_date: missed })}>Add qada entry</Button>
        </div>
      </Card>

      <div className="flex gap-2 mb-4 text-sm">
        {(["pending", "completed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full ring-1 ring-border ${filter === f ? "bg-primary text-primary-foreground" : ""}`}>{f}</button>
        ))}
      </div>

      <div className="grid gap-2">
        {filtered.map((q: any) => (
          <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl ring-1 ring-border">
            <div>
              <p className="font-medium">{q.prayer}</p>
              <p className="text-xs text-muted-foreground">Missed {q.missed_date ?? "—"} {q.made_up_date && `· made up ${q.made_up_date}`}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={q.completed} onChange={e => update.mutate({ id: q.id, completed: e.target.checked, made_up_date: e.target.checked ? todayISO() : null })} />
              {q.completed ? "Completed" : "Mark done"}
            </label>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nothing here. Alhamdulillah.</p>}
      </div>
    </AppShell>
  );
}
