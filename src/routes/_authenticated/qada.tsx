import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createQada, listQada, updateQada } from "@/lib/data.functions";
import { useEffect, useState } from "react";
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

function finishDate(pending: number, perDay: number): string {
  const days = Math.ceil(pending / perDay);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function QadaPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQada);
  const createFn = useServerFn(createQada);
  const updateFn = useServerFn(updateQada);
  const { data = [] } = useQuery({ queryKey: ["qada"], queryFn: () => listFn({ data: undefined as any }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["qada"] });
  const notifyChange = () => {
    invalidate();
    window.localStorage.setItem("muslim-hq-worship-changed", String(Date.now()));
  };
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: notifyChange });
  const update = useMutation({
    mutationFn: (p: { id: string; completed: boolean; made_up_date: string | null }) => updateFn({ data: p }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["qada"] });
      const previous = qc.getQueryData<typeof data>(["qada"]);
      qc.setQueryData<typeof data>(["qada"], current => current?.map(entry => entry.id === patch.id ? { ...entry, ...patch } : entry));
      return { previous };
    },
    onError: (_error, _patch, context) => { if (context?.previous) qc.setQueryData(["qada"], context.previous); },
    onSuccess: notifyChange,
    onSettled: invalidate,
  });

  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [prayer, setPrayer] = useState<string>("Fajr");
  const [missed, setMissed] = useState(todayISO());
  const [perDay, setPerDay] = useState(1);
  useEffect(() => {
    const saved = Number(window.localStorage.getItem("mhq-qada-plan"));
    if (saved >= 1 && saved <= 10) setPerDay(saved);
  }, []);
  const savePerDay = (n: number) => {
    setPerDay(n);
    window.localStorage.setItem("mhq-qada-plan", String(n));
  };

  const [sort, setSort] = useState<"oldest" | "newest">("oldest");
  const [prayerFilter, setPrayerFilter] = useState<string>("All");
  const byDate = (a: any, b: any) => {
    const d = String(a.missed_date ?? "").localeCompare(String(b.missed_date ?? ""));
    if (d !== 0) return d;
    return PRAYERS.findIndex(p => PRAYER_LABEL[p] === a.prayer) - PRAYERS.findIndex(p => PRAYER_LABEL[p] === b.prayer);
  };
  const filtered = data
    .filter((q: any) => filter === "all" ? true : filter === "pending" ? !q.completed : q.completed)
    .filter((q: any) => prayerFilter === "All" || q.prayer === prayerFilter)
    .slice()
    .sort((a: any, b: any) => sort === "oldest" ? byDate(a, b) : byDate(b, a));

  const pending = data.filter((q: any) => !q.completed);
  const pendingByPrayer = Object.fromEntries(
    PRAYERS.map(p => [PRAYER_LABEL[p], pending.filter((q: any) => q.prayer === PRAYER_LABEL[p]).length]),
  ) as Record<string, number>;
  const completedCount = data.length - pending.length;
  const oldestPending = pending.slice().sort(byDate);
  const nextUp = oldestPending[0];
  const complete = (q: any) => update.mutate({ id: q.id, completed: true, made_up_date: todayISO() });
  const oldestOf = (label: string) => oldestPending.find((q: any) => q.prayer === label);

  return (
    <AppShell>
      <PageHeader eyebrow="Qada Salah" title="Make-up prayers" subtitle="Track missed prayers gently. Every one you make up is a return." />

      {nextUp && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Next to make up · oldest first</p>
              <p className="font-serif text-2xl mt-1">{nextUp.prayer}</p>
              <p className="text-xs text-muted-foreground">Missed {nextUp.missed_date ?? "—"}</p>
            </div>
            <Button onClick={() => complete(nextUp)}>Mark made up</Button>
          </div>
        </Card>
      )}

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

      <div className="grid gap-3 md:grid-cols-6 mb-2">
        <div className="rounded-2xl ring-1 ring-border p-4 md:col-span-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-semibold mt-1">{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{completedCount} completed all-time</p>
        </div>
        {PRAYERS.map(p => {
          const label = PRAYER_LABEL[p];
          const oldest = oldestOf(label);
          return (
            <div key={p} className="rounded-2xl ring-1 ring-border p-4 flex flex-col">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold mt-1">{pendingByPrayer[label]}</p>
              <button
                disabled={!oldest}
                onClick={() => oldest && complete(oldest)}
                className="mt-2 text-xs px-2 py-1 rounded-full ring-1 ring-border hover:bg-muted disabled:opacity-40"
              >
                +1 made up
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mb-6">Tip: pray one Qada alongside each Fard, then tap "+1 made up" on that prayer — it clears the oldest one.</p>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="shrink-0">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">My Qada plan</label>
            <select value={perDay} onChange={e => savePerDay(Number(e.target.value))} className="mt-1 w-full md:w-40 px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} prayer{n > 1 ? "s" : ""} / day</option>
              ))}
            </select>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding prayers right now — your plan is clear, masha'Allah.</p>
          ) : (
            <div className="text-sm leading-relaxed">
              <p>
                At <span className="font-semibold">{perDay}</span> prayer{perDay > 1 ? "s" : ""} a day, you'll clear your{" "}
                <span className="font-semibold">{pending.length}</span> outstanding prayer{pending.length > 1 ? "s" : ""} in about{" "}
                <span className="font-semibold">{Math.ceil(pending.length / perDay)}</span> day{Math.ceil(pending.length / perDay) > 1 ? "s" : ""}.
              </p>
              <p className="text-muted-foreground mt-1">
                Around {finishDate(pending.length, perDay)}, insha'Allah. Small and steady — make it up when you can.
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        {(["pending", "completed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full ring-1 ring-border ${filter === f ? "bg-primary text-primary-foreground" : ""}`}>{f}</button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value as any)} className="ml-auto px-3 py-1.5 rounded-full bg-background ring-1 ring-border">
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {["All", ...PRAYERS.map(p => PRAYER_LABEL[p])].map(p => (
          <button key={p} onClick={() => setPrayerFilter(p)} className={`px-3 py-1 rounded-full ring-1 ring-border ${prayerFilter === p ? "bg-primary text-primary-foreground" : ""}`}>{p}</button>
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
