import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFasting, upsertFasting, getProfile } from "@/lib/data.functions";
import { FAST_TYPES } from "@/lib/fasting";
import { todayISO, ramadanRange } from "@/lib/hijri";
import { useMemo, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/fasting")({
head: () => ({ meta: [
    { title: "Fasting Tracker — Muslim HQ" },
    { name: "description", content: "Log Ramadan, Shawwal, Arafah, Monday and Thursday sunnah fasts, and qada makeups privately." },
    { property: "og:title", content: "Fasting Tracker — Muslim HQ" },
    { property: "og:description", content: "Log Ramadan, Shawwal, Arafah, sunnah and makeup fasts privately." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FastingPage,
});

function FastingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFasting);
  const upsertFn = useServerFn(upsertFasting);
  const { data = [] } = useQuery({ queryKey: ["fasting"], queryFn: () => listFn({ data: undefined as any }) });
  const upsert = useMutation({ mutationFn: (p: any) => upsertFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["fasting"] }) });
  const [form, setForm] = useState({ log_date: todayISO(), fast_type: "Shawwal", completed: true, notes: "" });
  const [showLog, setShowLog] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  useEffect(() => { if (data.length > 0) setShowLog(true); }, [data.length]);
  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const done = (t: string) => data.filter((f: any) => f.fast_type === t && f.completed).length;
  const sunnahCount = data.filter((f: any) => (f.fast_type === "Monday Sunnah" || f.fast_type === "Thursday Sunnah") && f.completed).length;

  const profileFn = useServerFn(getProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const owed = Number((profile as any)?.ramadan_fasts_owed ?? 0);
  const madeUp = done("Ramadan Makeup");
  const remaining = Math.max(0, owed - madeUp);
  const nextRamadan = useMemo(() => {
    const today = todayISO();
    const y = new Date().getFullYear();
    const r = [ramadanRange(y), ramadanRange(y + 1)].find(x => x && x.start > today);
    if (!r) return null;
    const days = Math.round((new Date(r.start + "T12:00:00").getTime() - new Date(today + "T12:00:00").getTime()) / 86400000);
    return { ...r, daysUntil: days };
  }, []);
  const weeks = nextRamadan ? Math.max(1, Math.floor(nextRamadan.daysUntil / 7)) : 0;
  const perWeek = remaining && weeks ? Math.ceil(remaining / weeks) : 0;
  const logMakeup = () => upsert.mutate({ log_date: todayISO(), fast_type: "Ramadan Makeup", completed: true, notes: "" }, { onSuccess: () => toast.success("Fast made up — may Allah accept it") });

  return (
    <AppShell>
      <PageHeader eyebrow="Fasting" title="Sawm journal" subtitle="Every fast is a shield." />

      <Card className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Ramadan fasts to make up</p>
            <p className="font-serif text-5xl mt-1">{remaining}</p>
            <p className="text-xs text-muted-foreground mt-1">{madeUp} made up of {owed} owed</p>
            {owed > 0 && <div className="mt-3 h-2 w-full md:w-64 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (madeUp / owed) * 100)}%` }} /></div>}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button onClick={logMakeup} disabled={remaining === 0}>+1 made up today</Button>
          </div>
        </div>
        {nextRamadan && (
          <div className="mt-5 pt-4 border-t border-border text-sm leading-relaxed">
            <p>Ramadan {nextRamadan.hijriYear} begins in about <span className="font-semibold">{nextRamadan.daysUntil}</span> days ({new Date(nextRamadan.start + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}).</p>
            <p className="text-muted-foreground mt-1">
              {remaining === 0
                ? "Your balance is clear, masha'Allah."
                : `About ${perWeek} fast${perWeek > 1 ? "s" : ""} a week clears it before Ramadan — pairing with Monday and Thursday sunnah days is a gentle rhythm.`}
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Ramadan</p><p className="text-3xl font-serif">{done("Ramadan")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Shawwal</p><p className="text-3xl font-serif">{done("Shawwal")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Day of Arafah</p><p className="text-3xl font-serif">{done("Day of Arafah")}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Sunnah</p><p className="text-3xl font-serif">{sunnahCount}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Ramadan Makeup</p><p className="text-3xl font-serif">{done("Ramadan Makeup")}</p></Card>
      </div>

      <Card className="mb-6">
        <button
          type="button"
          onClick={() => setShowLog(v => !v)}
          aria-expanded={showLog}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-2xl">Log a fast</h3>
            {data.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {data.length} logged
              </span>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showLog ? "" : "-rotate-90"}`} />
        </button>
        {showLog && (
          <>
            <div className="grid md:grid-cols-4 gap-3 items-end mt-4">
              <input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
              <select value={form.fast_type} onChange={e => setForm({ ...form, fast_type: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
                {FAST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.completed} onChange={e => setForm({ ...form, completed: e.target.checked })} /> Completed</label>
              <Button onClick={() => upsert.mutate(form)}>Save</Button>
            </div>
            <input placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-3 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            {form.fast_type === "Ramadan Makeup" && form.completed && (
              <p className="mt-2 text-xs text-[color:var(--sage-deep)]">This will count toward your Ramadan makeup balance above — {remaining} still to go.</p>
            )}
            <div className="mt-5 pt-4 border-t border-border grid gap-2">
              {data.map((f: any) => {
                const open = expandedIds.has(f.id);
                return (
                  <div key={f.id} className="rounded-2xl ring-1 ring-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleExpand(f.id)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
                        <p className="font-medium truncate">{f.log_date} <span className="text-xs text-muted-foreground">· {f.fast_type}</span></p>
                      </div>
                      <span className={`shrink-0 text-xs px-3 py-1 rounded-full ${f.completed ? "bg-[color:var(--sage-deep)] text-[color:var(--sand)]" : "ring-1 ring-border"}`}>{f.completed ? "Completed" : "Missed"}</span>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pl-11 text-sm text-muted-foreground space-y-1.5">
                        <p><span className="text-foreground font-medium">Type:</span> {f.fast_type}</p>
                        <p><span className="text-foreground font-medium">Status:</span> {f.completed ? "Completed" : "Missed"}</p>
                        {f.notes && <p><span className="text-foreground font-medium">Notes:</span> {f.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}
