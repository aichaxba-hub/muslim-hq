import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-app-server-fn";
import { toast } from "sonner";
import { Card, Button } from "@/components/AppShell";
import { createQuranLog, updateProfile } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";

const TOTAL_PAGES = 604;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dayDiff(a: string, b: string) {
  return Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);
}
function endOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

export function KhatmPlanner({ profile, logs }: { profile: any; logs: any[] }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(updateProfile);
  const logFn = useServerFn(createQuranLog);
  const today = todayISO();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear() + (now.getMonth() >= 10 ? 1 : 0));
  const [pages, setPages] = useState("");

  const target: string | null = profile?.khatm_target ?? null;
  const start: string | null = profile?.khatm_start ?? null;

  const save = useMutation({
    mutationFn: (d: { khatm_target: string | null; khatm_start: string | null }) => saveFn({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: () => toast.error("Could not save your Khatm plan"),
  });
  const logPages = useMutation({
    mutationFn: (n: number) => logFn({ data: { log_date: today, pages: n, surah: "Khatm reading", reflection: `Read ${n} pages toward Khatm` } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quran"] }); setPages(""); toast.success("Pages logged — may Allah bless your reading"); },
    onError: () => toast.error("Could not log pages"),
  });

  const plan = useMemo(() => {
    if (!target || !start) return null;
    const end = endOfMonth(target.slice(0, 7));
    let read = 0, readToday = 0;
    for (const r of logs) {
      if (typeof r.log_date !== "string" || r.log_date < start) continue;
      const p = Number(r.pages) || 0;
      read += p;
      if (r.log_date === today) readToday += p;
    }
    read = Math.min(TOTAL_PAGES, read);
    const remaining = TOTAL_PAGES - read;
    const daysLeft = Math.max(1, dayDiff(today, end) + 1);
    // pace for today excludes today's reading so the target stays stable through the day
    const remainingAtDayStart = Math.max(0, TOTAL_PAGES - (read - readToday));
    const perDay = Math.ceil(remainingAtDayStart / daysLeft);
    const totalDays = Math.max(1, dayDiff(start, end) + 1);
    const originalPace = Math.ceil(TOTAL_PAGES / totalDays);
    const elapsed = Math.max(0, dayDiff(start, today));
    const expected = Math.min(TOTAL_PAGES, originalPace * elapsed);
    const behind = Math.max(0, expected - (read - readToday));
    return { end, read, remaining, daysLeft, perDay, readToday, originalPace, behind, past: today > end };
  }, [target, start, logs, today]);

  const years = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2];
  const fmt = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function startPlan() {
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (endOfMonth(ym) < today) return toast.error("Choose a month that hasn't passed yet");
    save.mutate({ khatm_target: `${ym}-01`, khatm_start: today });
  }

  return (
    <Card className="mb-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">Khatm planner</p>
      {!plan ? (
        <div>
          <h3 className="font-display text-xl">Complete the Quran by…</h3>
          <p className="mt-1 text-sm text-muted-foreground">Pick a month and we'll work out your daily pages (604 in total), adjusting gently if a day slips by.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select aria-label="Target month" value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select aria-label="Target year" value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button onClick={startPlan} disabled={save.isPending}>Start my Khatm</Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl">Khatm by {fmt(target!)}</h3>
            <span className="text-sm text-muted-foreground">{plan.read} / {TOTAL_PAGES} pages</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[color:var(--gold)]" style={{ width: `${(plan.read / TOTAL_PAGES) * 100}%` }} />
          </div>
          {plan.remaining === 0 ? (
            <p className="mt-4 text-sm">Khatm complete, alhamdulillah! May Allah accept it from you.</p>
          ) : plan.past ? (
            <p className="mt-4 text-sm text-muted-foreground">Your target month has passed with {plan.remaining} pages left — no worries, choose a new month and keep going.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Read today</p><p className="font-display text-2xl">{plan.readToday} / {plan.perDay}</p><p className="text-xs text-muted-foreground">pages</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Days left</p><p className="font-display text-2xl">{plan.daysLeft}</p><p className="text-xs text-muted-foreground">{plan.remaining} pages remaining</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Pace</p><p className="font-display text-2xl">{plan.perDay}/day</p><p className="text-xs text-muted-foreground">{plan.behind > 0 ? `Adjusted from ${plan.originalPace} after missed days` : "On track"}</p></div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {plan.remaining > 0 && !plan.past && <>
              <input aria-label="Pages read" type="number" min={1} max={604} value={pages} onChange={e => setPages(e.target.value)} placeholder="Pages read" className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <Button onClick={() => { const n = Math.round(Number(pages)); if (n > 0 && n <= 604) logPages.mutate(n); }} disabled={logPages.isPending}>Log pages</Button>
            </>}
            <button className="text-sm text-muted-foreground underline" onClick={() => { if (window.confirm("Reset your Khatm plan?")) save.mutate({ khatm_target: null, khatm_start: null }); }}>Change plan</button>
          </div>
        </div>
      )}
    </Card>
  );
}
