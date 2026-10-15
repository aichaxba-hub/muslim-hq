import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createQuranLog, getProfile, listQuranLogs, updateProfile } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useEffect, useMemo, useState } from "react";
import { QuranReader, type QuranSessionMilestone } from "@/components/QuranReader";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Chapter = { id: number; name_simple: string; verses_count: number; translated_name: { name: string } };

const RHYTHM_KEY = "mhq-quran-rhythm";
const RHYTHM_OPTIONS = [5, 10, 15, 20, 30, 40, 50, 100];

function countAyat(verses: string | null | undefined): number {
  if (!verses) return 0;
  const match = /^(\d+):(\d+)(?:[–-](\d+))?$/.exec(verses.trim());
  if (!match) return 0;
  const from = Number(match[2]);
  const to = match[3] ? Number(match[3]) : from;
  return Math.max(1, to - from + 1);
}


export const Route = createFileRoute("/_authenticated/quran")({
  head: () => ({ meta: [
    { title: "Read & Track the Quran — Muslim HQ" },
    { name: "description", content: "Read the Quran with English translation, synchronized recitation, private daily study goals, and progress tracking." },
    { property: "og:title", content: "Read & Track the Quran — Muslim HQ" },
    { property: "og:description", content: "Read the Quran with English translation, synchronized recitation, private daily study goals, and progress tracking." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: QuranPage,
});

function QuranPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listQuranLogs);
  const createFn = useServerFn(createQuranLog);
  const { data = [] } = useQuery({ queryKey: ["quran"], queryFn: () => listFn({ data: undefined as any }) });
  const { data: chapters = [] } = useQuery<Chapter[]>({ queryKey: ["quran-reader", "chapters"], queryFn: async () => {
    const response = await fetch("https://api.quran.com/api/v4/chapters?language=en");
    if (!response.ok) throw new Error("Could not load surahs");
    return ((await response.json()) as { chapters?: Chapter[] }).chapters ?? [];
  }, staleTime: 1000 * 60 * 60 * 24 });
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["quran"] }); setShowYourSessions(true); } });
  const autoLog = useMutation({
    mutationFn: (m: QuranSessionMilestone) => createFn({ data: {
      log_date: todayISO(), surah: m.surahName, auto_logged: true, completed_at: m.completedAt,
      verses_completed: m.fromAyah === m.toAyah ? `${m.surahNumber}:${m.fromAyah}` : `${m.surahNumber}:${m.fromAyah}–${m.toAyah}`,
      reflection: m.mode === "read" ? "Marked as read" : `Listened to ${m.versesCount} ayat`,
    } }),
    onSuccess: (_r, m) => { qc.invalidateQueries({ queryKey: ["quran"] }); setShowYourSessions(true); toast.success(`Logged ${m.surahName} ${m.fromAyah}–${m.toAyah}`); },
    onError: () => toast.error("Could not save this Quran session"),
  });

  const [form, setForm] = useState({ log_date: todayISO(), surah_number: 1, whole: true, from_ayah: "1", to_ayah: "", pages: "", juz: "", tafsir: false, reflection: "" });
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [showSessionLog, setShowSessionLog] = useState(false);
  const [showYourSessions, setShowYourSessions] = useState(false);
  useEffect(() => { if (data.length > 0) setShowSessionLog(true); }, [data.length === 0]);


  const profileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(updateProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
  const [dailyGoal, setDailyGoal] = useState(10);
  const [goalSynced, setGoalSynced] = useState(false);
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(RHYTHM_KEY));
    if (!goalSynced && RHYTHM_OPTIONS.includes(saved)) setDailyGoal(saved);
  }, []);
  useEffect(() => {
    const saved = Number((profile as any)?.quran_daily_goal);
    if (!goalSynced && RHYTHM_OPTIONS.includes(saved)) {
      setDailyGoal(saved);
      setGoalSynced(true);
    }
  }, [profile, goalSynced]);
  const saveDailyGoal = useMutation({
    mutationFn: (value: number) => saveProfileFn({ data: { quran_daily_goal: value } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: () => toast.error("Could not save your daily goal"),
  });
  function chooseDailyGoal(value: number) {
    setDailyGoal(value);
    setGoalSynced(true);
    window.localStorage.setItem(RHYTHM_KEY, String(value));
    saveDailyGoal.mutate(value);
  }

  const rhythm = useMemo(() => {
    const today = todayISO();
    let todayAyat = 0;
    for (const row of data as any[]) {
      if (row.log_date === today) todayAyat += countAyat(row.verses_completed);
    }
    return { todayAyat };
  }, [data]);
  const rhythmPercent = Math.min(100, Math.round((rhythm.todayAyat / dailyGoal) * 100));

  return (
    <AppShell>
      <PageHeader eyebrow="Quran" title="Reading & reflection" subtitle="Even a single page turns into light on Yawm al-Qiyamah." />


      <Card className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">Quran rhythm</p>
            <h2 className="font-serif text-2xl">Your daily goal</h2>
          </div>
          <label className="grid gap-1.5 text-xs text-muted-foreground">Ayat per day
            <select aria-label="Daily ayat goal" value={dailyGoal} onChange={event => chooseDailyGoal(Number(event.target.value))} className="h-11 rounded-lg bg-background px-3 text-foreground ring-1 ring-border">
              {RHYTHM_OPTIONS.map(option => <option key={option} value={option}>{option} ayat</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${rhythmPercent}%` }} /></div>
          <span className="w-28 text-right text-xs text-muted-foreground">{rhythm.todayAyat} of {dailyGoal} · {rhythmPercent}%</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {rhythm.todayAyat >= dailyGoal
            ? "Today's goal is complete, alhamdulillah."
            : rhythm.todayAyat > 0
              ? `${dailyGoal - rhythm.todayAyat} ayat to go today — your logged sessions count automatically.`
              : "Log or listen to a session and it counts toward today's goal automatically."}
        </p>
      </Card>

      <Card className="mb-6">
        <button type="button" aria-expanded={showSessionLog} onClick={() => setShowSessionLog(value => !value)} className="flex w-full items-center justify-between gap-3 text-left">
          <div>
            <h3 className="font-serif text-2xl">Session log</h3>
            <p className="mt-1 text-sm text-muted-foreground">Read from a mushaf, another app or at the masjid? Add it here so every reading counts toward your goals and Review.</p>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {data.length > 0 && <span className="rounded-full bg-muted px-2.5 py-1">{data.length} session{data.length === 1 ? "" : "s"}</span>}
            <ChevronDown className={`size-5 transition-transform ${showSessionLog ? "rotate-180" : ""}`} />
          </span>
        </button>
        {showSessionLog && (
        <>
        <div className="mt-5 border-t border-border pt-5">
        <h4 className="mb-4 text-sm font-medium uppercase tracking-widest text-[color:var(--sage)]">Log a reading session</h4>
        {(() => {
          const ch = chapters.find(c => c.id === form.surah_number);
          const max = ch?.verses_count ?? 286;
          const from = Math.max(1, Math.min(max, Number(form.from_ayah) || 1));
          const to = form.whole ? max : Math.max(from, Math.min(max, Number(form.to_ayah) || from));
          const ayatCount = to - from + 1;
          const inputCls = "h-11 w-full rounded-lg bg-background px-3 text-foreground ring-1 ring-border";
          const submit = () => {
            if (!ch) return toast.error("Surahs are still loading");
            create.mutate({
              log_date: form.log_date, surah: `${ch.id}. ${ch.name_simple}`,
              verses_completed: from === to ? `${ch.id}:${from}` : `${ch.id}:${from}–${to}`,
              pages: Math.max(0, Math.round(Number(form.pages) || 0)),
              juz: Math.max(0, Number(form.juz) || 0) || undefined,
              tafsir: form.tafsir, reflection: form.reflection.trim() || undefined,
            }, { onSuccess: () => { toast.success(`Logged ${ch.name_simple} ${from}–${to}`); setForm(f => ({ ...f, from_ayah: "1", to_ayah: "", pages: "", juz: "", tafsir: false, reflection: "", whole: true })); } });
          };
          return <>
            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-1.5 text-xs text-muted-foreground">Date<input aria-label="Session date" type="date" max={todayISO()} value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className={inputCls} /></label>
              <label className="grid gap-1.5 text-xs text-muted-foreground md:col-span-3">Surah<select aria-label="Surah" value={form.surah_number} onChange={e => setForm({ ...form, surah_number: Number(e.target.value), from_ayah: "1", to_ayah: "" })} className={inputCls}>
                {chapters.map(c => <option key={c.id} value={c.id}>{c.id}. {c.name_simple} · {c.verses_count} ayat</option>)}
              </select></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.whole} onChange={e => setForm({ ...form, whole: e.target.checked, from_ayah: "1" })} /> I read the whole surah</label>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {!form.whole && <>
                <label className="grid gap-1.5 text-xs text-muted-foreground">From ayah<input aria-label="From ayah" type="number" min={1} max={max} value={form.from_ayah} onChange={e => setForm({ ...form, from_ayah: e.target.value })} className={inputCls} /></label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">To ayah<input aria-label="To ayah" type="number" min={1} max={max} placeholder={String(max)} value={form.to_ayah} onChange={e => setForm({ ...form, to_ayah: e.target.value })} className={inputCls} /></label>
              </>}
              <label className="grid gap-1.5 text-xs text-muted-foreground">Pages (optional)<input aria-label="Pages read" type="number" min={0} value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} className={inputCls} /></label>
              <label className="grid gap-1.5 text-xs text-muted-foreground">Juz (optional)<input aria-label="Juz" type="number" min={0} step={0.25} value={form.juz} onChange={e => setForm({ ...form, juz: e.target.value })} className={inputCls} /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tafsir} onChange={e => setForm({ ...form, tafsir: e.target.checked })} /> Included tafsir / study</label>
            <textarea placeholder="Reflection (optional)" rows={2} value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} className="mt-3 w-full rounded-lg bg-background px-3 py-2 ring-1 ring-border" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={submit} disabled={create.isPending || !ch}>{create.isPending ? "Saving…" : "Add session"}</Button>
              {ch && <span className="text-sm text-muted-foreground">{ayatCount} ayat · {ch.name_simple} {from}–{to}</span>}
            </div>
          </>;
        })()}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <button type="button" aria-expanded={showYourSessions} onClick={() => setShowYourSessions(value => !value)} className="flex w-full items-center justify-between gap-3 text-left">
            <h4 className="text-sm font-medium uppercase tracking-widest text-[color:var(--sage)]">Your sessions</h4>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {data.length > 0 && <span className="rounded-full bg-muted px-2.5 py-1">{data.length} session{data.length === 1 ? "" : "s"}</span>}
              <ChevronDown className={`size-4 transition-transform ${showYourSessions ? "rotate-180" : ""}`} />
            </span>
          </button>
          {showYourSessions && (
          <div className="mt-4 grid gap-2">
            <p className="text-sm text-muted-foreground">Every logged session, collapsed. Tap one to see the details.</p>
            {data.length === 0 && <p className="py-4 text-sm text-muted-foreground">No sessions logged yet — your first one will appear here.</p>}
        {data.map((r: any) => {
          const expanded = expandedSessionIds.has(r.id);
          return (
            <div key={r.id} className="rounded-2xl ring-1 ring-border">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedSessionIds(previous => {
                  const next = new Set(previous);
                  if (next.has(r.id)) next.delete(r.id); else next.add(r.id);
                  return next;
                })}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <p className="font-medium truncate">{r.surah || "Session"} <span className="text-muted-foreground text-sm">· {r.log_date}</span></p>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {r.verses_completed ? `Ayat ${r.verses_completed}` : `${r.pages ?? 0}pp`}
                  <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </span>
              </button>
              {expanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {r.verses_completed && <span>Ayat {r.verses_completed}</span>}
                    <span>{r.pages ?? 0} pages</span>
                    {r.juz ? <span>{Number(r.juz).toFixed(2).replace(/\.00$/, "")} juz</span> : null}
                    {r.tafsir && <span>Tafsir / study</span>}
                    {r.auto_logged && <span>Logged from the reader</span>}
                    {r.completed_at && <span>{new Date(r.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
                  </div>
                  {r.reflection && <p className="text-sm text-muted-foreground mt-2 italic">"{r.reflection}"</p>}
                </div>
              )}
            </div>
          );
        })}
          </div>
          )}
        </div>
        </>
        )}
      </Card>

      <QuranReader onSessionComplete={m => autoLog.mutate(m)} />


    </AppShell>
  );
}
