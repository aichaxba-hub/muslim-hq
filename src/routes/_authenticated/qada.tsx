import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-app-server-fn";
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
  const sortedPending = pending.slice().sort(byDate);
  const nextUp = sort === "oldest" ? sortedPending[0] : sortedPending[sortedPending.length - 1];
  const complete = (q: any) => update.mutate({ id: q.id, completed: true, made_up_date: todayISO() });
  const oldestOf = (label: string) => sortedPending.find((q: any) => q.prayer === label);

  return (
    <AppShell>
      <PageHeader eyebrow="Qada Salah" title="Make-up prayers" subtitle="Track missed prayers gently. Every one you make up is a return." />

      {/* Zone 1 — At a glance: next action + per-prayer progress */}
      <section className="mb-12">
        {nextUp && (
          <div className="rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-60">Next to make up · {sort === "oldest" ? "oldest first" : "newest first"}</p>
              <p className="font-serif text-3xl mt-1">{nextUp.prayer}</p>
              <p className="text-sm opacity-70 mt-0.5">Missed {nextUp.missed_date ?? "—"}</p>
            </div>
            <button
              onClick={() => complete(nextUp)}
              className="shrink-0 px-7 py-3 rounded-full bg-card text-primary text-sm font-semibold hover:bg-muted transition-colors"
            >
              Mark made up
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <div className="col-span-2 rounded-3xl bg-card ring-1 ring-border p-5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outstanding</span>
            <div className="mt-3">
              <p className="font-serif text-4xl">{pending.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedCount} completed all-time</p>
            </div>
          </div>
          {PRAYERS.map(p => {
            const label = PRAYER_LABEL[p];
            const oldest = oldestOf(label);
            return (
              <div key={p} className="rounded-3xl bg-card ring-1 ring-border p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className="text-xl font-semibold">{pendingByPrayer[label]}</span>
                </div>
                <button
                  disabled={!oldest}
                  onClick={() => oldest && complete(oldest)}
                  className="mt-4 w-full py-2 rounded-lg bg-muted text-[10px] font-bold uppercase tracking-wide hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  +1 made up
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center italic mt-6">
          Tip: pray one Qada alongside each Fard, then tap "+1 made up" on that prayer — it clears the oldest one.
        </p>
      </section>

      {/* Zone 2 — Log an entry + your plan, side by side */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch mb-12">
        <Card className="lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Add qada entry</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Prayer</label>
              <select value={prayer} onChange={e => setPrayer(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border text-sm">
                {PRAYERS.map(p => <option key={p} value={PRAYER_LABEL[p]}>{PRAYER_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">Original date</label>
              <input type="date" value={missed} onChange={e => setMissed(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border text-sm" />
            </div>
            <button
              onClick={() => create.mutate({ prayer, missed_date: missed })}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Add entry
            </button>
          </div>
        </Card>

        <Card className="lg:col-span-3 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">My Qada plan</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">I want to pray</span>
              <select value={perDay} onChange={e => savePerDay(Number(e.target.value))} className="px-3 py-1.5 rounded-lg bg-background ring-1 ring-border text-sm font-semibold">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} prayer{n > 1 ? "s" : ""} / day</option>
                ))}
              </select>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding prayers right now — your plan is clear, masha'Allah.</p>
            ) : (
              <div className="border-l-2 border-border pl-5 py-1 space-y-2">
                <p className="text-lg leading-snug">
                  You'll clear your <span className="font-semibold underline decoration-gold">{pending.length}</span> outstanding prayer{pending.length > 1 ? "s" : ""} in about{" "}
                  <span className="font-semibold">{Math.ceil(pending.length / perDay)}</span> day{Math.ceil(pending.length / perDay) > 1 ? "s" : ""}.
                </p>
                <p className="text-sm text-muted-foreground">
                  Around {finishDate(pending.length, perDay)}, insha'Allah. Small and steady — make it up when you can.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Zone 3 — Your log: filters and entries */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-muted p-1 rounded-xl">
              {(["pending", "completed", "all"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-border hidden md:block" />
            <div className="flex flex-wrap gap-1.5">
              {["All", ...PRAYERS.map(p => PRAYER_LABEL[p])].map(p => (
                <button
                  key={p}
                  onClick={() => setPrayerFilter(p)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ring-1 transition-colors ${prayerFilter === p ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border hover:text-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="px-3 py-1.5 rounded-full bg-background ring-1 ring-border text-xs font-medium">
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>

        <div className="rounded-3xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
          {filtered.map((q: any) => (
            <div key={q.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{q.prayer}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Missed {q.missed_date ?? "—"} {q.made_up_date && `· made up ${q.made_up_date}`}</p>
              </div>
              <label className="flex items-center gap-3 text-sm cursor-pointer shrink-0">
                <span className="text-xs text-muted-foreground">{q.completed ? "Completed" : "Mark done"}</span>
                <input
                  type="checkbox"
                  checked={q.completed}
                  onChange={e => update.mutate({ id: q.id, completed: e.target.checked, made_up_date: e.target.checked ? todayISO() : null })}
                  className="size-4 accent-[color:var(--sage-deep)]"
                />
              </label>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">Nothing here. Alhamdulillah.</p>}
        </div>
      </section>
    </AppShell>
  );
}
