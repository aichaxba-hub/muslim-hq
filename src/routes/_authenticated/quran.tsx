import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createQuranLog, createQuranStudyGoal, deleteQuranStudyGoal, getProfile, listQuranLogs, listQuranStudyGoals, setQuranStudyGoalComplete, updateProfile, updateQuranStudyProgress } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useEffect, useMemo, useState } from "react";
import { QuranReader, type QuranSessionMilestone, type QuranStudySelection } from "@/components/QuranReader";
import { BookOpenCheck, Check, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Chapter = { id: number; name_simple: string; verses_count: number; translated_name: { name: string } };
type StudyGoal = { id: string; goal_date: string; surah_number: number; surah_name: string; start_ayah: number; end_ayah: number; last_completed_ayah: number; completed: boolean; note: string | null };

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

function surahNumberOf(verses: string | null | undefined): number | null {
  if (!verses) return null;
  const match = /^(\d+):/.exec(verses.trim());
  return match ? Number(match[1]) : null;
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
  const listGoalsFn = useServerFn(listQuranStudyGoals);
  const createGoalFn = useServerFn(createQuranStudyGoal);
  const progressFn = useServerFn(updateQuranStudyProgress);
  const completeGoalFn = useServerFn(setQuranStudyGoalComplete);
  const deleteGoalFn = useServerFn(deleteQuranStudyGoal);
  const { data = [] } = useQuery({ queryKey: ["quran"], queryFn: () => listFn({ data: undefined as any }) });
  const { data: studyGoals = [], isPending: goalsPending } = useQuery({ queryKey: ["quran-study-goals"], queryFn: () => listGoalsFn({ data: undefined as any }) });
  const { data: chapters = [] } = useQuery<Chapter[]>({ queryKey: ["quran-reader", "chapters"], queryFn: async () => {
    const response = await fetch("https://api.quran.com/api/v4/chapters?language=en");
    if (!response.ok) throw new Error("Could not load surahs");
    return ((await response.json()) as { chapters?: Chapter[] }).chapters ?? [];
  }, staleTime: 1000 * 60 * 60 * 24 });
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["quran"] }) });
  const autoLog = useMutation({
    mutationFn: (m: QuranSessionMilestone) => createFn({ data: {
      log_date: todayISO(), surah: m.surahName, minutes: m.minutes, auto_logged: true, completed_at: m.completedAt,
      verses_completed: m.fromAyah === m.toAyah ? `${m.surahNumber}:${m.fromAyah}` : `${m.surahNumber}:${m.fromAyah}–${m.toAyah}`,
      reflection: m.mode === "read" ? "Marked as read" : `Listened to ${m.versesCount} ayat`,
    } }),
    onSuccess: (_r, m) => { qc.invalidateQueries({ queryKey: ["quran"] }); toast.success(`Logged ${m.surahName} ${m.fromAyah}–${m.toAyah}`); },
    onError: () => toast.error("Could not save this Quran session"),
  });
  const refreshGoals = () => qc.invalidateQueries({ queryKey: ["quran-study-goals"] });
  const addGoal = useMutation({ mutationFn: (p: any) => createGoalFn({ data: p }), onSuccess: () => { refreshGoals(); setShowGoalForm(false); toast.success("Study goal added"); }, onError: () => toast.error("Could not add the study goal") });
  const updateProgress = useMutation({ mutationFn: (p: { id: string; ayah: number }) => progressFn({ data: p }), onSuccess: refreshGoals });
  const completeGoal = useMutation({ mutationFn: (p: { id: string; completed: boolean }) => completeGoalFn({ data: p }), onSuccess: refreshGoals });
  const removeGoal = useMutation({ mutationFn: (id: string) => deleteGoalFn({ data: { id } }), onSuccess: () => { refreshGoals(); toast.success("Study goal removed"); } });

  const [form, setForm] = useState({ log_date: todayISO(), surah_number: 1, whole: true, from_ayah: "1", to_ayah: "", pages: "", juz: "", tafsir: false, reflection: "" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ goal_date: todayISO(), surah_number: 1, start_ayah: 1, end_ayah: 7, note: "" });
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [resumeRequest, setResumeRequest] = useState(0);
  const selectedChapter = chapters.find(chapter => chapter.id === goalForm.surah_number);
  const activeGoal = (studyGoals as StudyGoal[]).find(goal => goal.id === activeGoalId) ?? null;
  const readerSelection: QuranStudySelection | null = activeGoal ? {
    id: activeGoal.id, surahNumber: activeGoal.surah_number, surahName: activeGoal.surah_name,
    startAyah: activeGoal.start_ayah, endAyah: activeGoal.end_ayah, lastCompletedAyah: activeGoal.last_completed_ayah,
  } : null;

  function chooseSurah(surahNumber: number) {
    const chapter = chapters.find(item => item.id === surahNumber);
    setGoalForm(current => ({ ...current, surah_number: surahNumber, start_ayah: 1, end_ayah: chapter?.verses_count ?? 1 }));
  }

  function openGoal(goal: StudyGoal, resume = false) {
    setActiveGoalId(goal.id);
    if (resume) setResumeRequest(value => value + 1);
    window.setTimeout(() => document.getElementById("quran-reader")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const totalPages = data.reduce((s: number, r: any) => s + (r.pages ?? 0), 0);
  const totalMinutes = data.reduce((s: number, r: any) => s + (r.minutes ?? 0), 0);
  const totalJuz = data.reduce((s: number, r: any) => s + (Number(r.juz) || 0), 0);

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
    const monthPrefix = today.slice(0, 7);
    let todayAyat = 0;
    let monthAyat = 0;
    const monthSurahs = new Set<number>();
    const monthSurahNames = new Set<string>();
    for (const row of data as any[]) {
      const ayat = countAyat(row.verses_completed);
      if (row.log_date === today) todayAyat += ayat;
      if (typeof row.log_date === "string" && row.log_date.startsWith(monthPrefix)) {
        monthAyat += ayat;
        const number = surahNumberOf(row.verses_completed);
        if (number) monthSurahs.add(number);
        else if (row.surah) monthSurahNames.add(String(row.surah).replace(/^\d+\.\s*/, ""));
      }
    }
    return { todayAyat, monthAyat, monthSurahs: monthSurahs.size + monthSurahNames.size };
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
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4"><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Ayat this month</p><p className="font-serif text-3xl">{rhythm.monthAyat}</p></div>
          <div className="rounded-lg border border-border p-4"><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Surahs covered this month</p><p className="font-serif text-3xl">{rhythm.monthSurahs}</p></div>
        </div>
      </Card>


      <Card className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]"><BookOpenCheck className="size-4" /> My study plan</p>
            <h2 className="font-serif text-2xl">Daily surah goals</h2>
          </div>
          <Button onClick={() => setShowGoalForm(value => !value)}><Plus className="mr-2 inline size-4" /> Add goal</Button>
        </div>

        {showGoalForm && (
          <form className="mt-5 border-y border-border py-5" onSubmit={event => {
            event.preventDefault();
            if (!selectedChapter) return;
            addGoal.mutate({ ...goalForm, surah_name: selectedChapter.name_simple });
          }}>
            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-1.5 text-xs text-muted-foreground">Day<input aria-label="Goal date" type="date" value={goalForm.goal_date} onChange={event => setGoalForm({ ...goalForm, goal_date: event.target.value })} className="h-11 rounded-lg bg-background px-3 text-foreground ring-1 ring-border" /></label>
              <label className="grid gap-1.5 text-xs text-muted-foreground md:col-span-2">Surah<select aria-label="Goal surah" value={goalForm.surah_number} onChange={event => chooseSurah(Number(event.target.value))} className="h-11 rounded-lg bg-background px-3 text-foreground ring-1 ring-border">{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.id}. {chapter.name_simple} · {chapter.verses_count} ayat</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1.5 text-xs text-muted-foreground">From ayah<input aria-label="Start ayah" min={1} max={selectedChapter?.verses_count} type="number" value={goalForm.start_ayah} onChange={event => setGoalForm({ ...goalForm, start_ayah: Number(event.target.value) })} className="h-11 min-w-0 rounded-lg bg-background px-3 text-foreground ring-1 ring-border" /></label>
                <label className="grid gap-1.5 text-xs text-muted-foreground">To ayah<input aria-label="End ayah" min={goalForm.start_ayah} max={selectedChapter?.verses_count} type="number" value={goalForm.end_ayah} onChange={event => setGoalForm({ ...goalForm, end_ayah: Number(event.target.value) })} className="h-11 min-w-0 rounded-lg bg-background px-3 text-foreground ring-1 ring-border" /></label>
              </div>
            </div>
            <textarea aria-label="Study intention" placeholder="Intention or note (optional)" maxLength={500} value={goalForm.note} onChange={event => setGoalForm({ ...goalForm, note: event.target.value })} className="mt-3 w-full rounded-lg bg-background px-3 py-2 ring-1 ring-border" rows={2} />
            <Button type="submit" disabled={addGoal.isPending || !selectedChapter || goalForm.end_ayah > (selectedChapter?.verses_count ?? 0) || goalForm.end_ayah < goalForm.start_ayah} className="mt-3">{addGoal.isPending ? "Saving…" : "Save goal"}</Button>
          </form>
        )}

        <div className="mt-5 grid gap-3">
          {goalsPending && <div className="h-24 animate-pulse rounded-lg bg-muted" />}
          {!goalsPending && studyGoals.length === 0 && <p className="py-5 text-sm text-muted-foreground">No study goals yet. Begin with one surah or a few ayat today.</p>}
          {(studyGoals as StudyGoal[]).map(goal => {
            const total = goal.end_ayah - goal.start_ayah + 1;
            const reached = goal.last_completed_ayah >= goal.start_ayah ? Math.min(total, goal.last_completed_ayah - goal.start_ayah + 1) : 0;
            const percent = goal.completed ? 100 : Math.round(reached / total * 100);
            return <article key={goal.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{goal.surah_name} · ayat {goal.start_ayah}–{goal.end_ayah}</h3><span className="text-xs text-muted-foreground">{goal.goal_date === todayISO() ? "Today" : goal.goal_date}</span>{goal.completed && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Complete</span>}</div>
                  {goal.note && <p className="mt-1 text-sm text-muted-foreground">{goal.note}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="ghost" className="h-9 px-3" onClick={() => openGoal(goal)}><BookOpenCheck className="mr-1.5 inline size-4" /> Open</Button>
                  {!goal.completed && <Button variant="ghost" className="h-9 px-3" onClick={() => openGoal(goal, true)}><Play className="mr-1.5 inline size-4" /> Resume</Button>}
                  <Button variant="ghost" className="h-9 px-3" onClick={() => completeGoal.mutate({ id: goal.id, completed: !goal.completed })}><Check className="mr-1.5 inline size-4" /> {goal.completed ? "Reopen" : "Complete"}</Button>
                  <Button variant="ghost" className="h-9 px-3" aria-label={`Delete ${goal.surah_name} study goal`} onClick={() => removeGoal.mutate(goal.id)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} /></div><span className="w-24 text-right text-xs text-muted-foreground">{reached} of {total} · {percent}%</span></div>
            </article>;
          })}
        </div>
      </Card>

      <QuranReader studySelection={readerSelection} resumeRequest={resumeRequest} onVerseCompleted={(id, ayah) => updateProgress.mutate({ id, ayah })} onSessionComplete={m => autoLog.mutate(m)} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Total pages</p><p className="text-3xl font-serif">{totalPages}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Juz progressed</p><p className="text-3xl font-serif">{totalJuz.toFixed(1)}</p></Card>
        <Card><p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Minutes</p><p className="text-3xl font-serif">{totalMinutes}</p></Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-serif text-2xl">Log a reading session</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Read from a mushaf, another app or at the masjid? Add it here so every reading counts toward your goals and Review.</p>
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
              <label className="grid gap-1.5 text-xs text-muted-foreground">Juz (optional)<input aria-label="Juz progressed" type="number" min={0} step={0.25} value={form.juz} onChange={e => setForm({ ...form, juz: e.target.value })} className={inputCls} /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tafsir} onChange={e => setForm({ ...form, tafsir: e.target.checked })} /> Included tafsir / study</label>
            <textarea placeholder="Reflection (optional)" rows={2} value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} className="mt-3 w-full rounded-lg bg-background px-3 py-2 ring-1 ring-border" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button onClick={submit} disabled={create.isPending || !ch}>{create.isPending ? "Saving…" : "Add session"}</Button>
              {ch && <span className="text-sm text-muted-foreground">{ayatCount} ayat · {ch.name_simple} {from}–{to}</span>}
            </div>
          </>;
        })()}
      </Card>

      <div className="grid gap-2">
        {data.map((r: any) => (
          <div key={r.id} className="p-4 rounded-2xl ring-1 ring-border">
            <div className="flex justify-between items-baseline">
              <p className="font-medium">{r.surah || "Session"} <span className="text-muted-foreground text-sm">· {r.log_date}</span></p>
              <p className="text-xs text-muted-foreground">{r.verses_completed ? `Ayat ${r.verses_completed} · ` : ""}{r.pages}pp {r.tafsir && "· tafsir"}{r.completed_at ? ` · ${new Date(r.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}</p>
            </div>
            {r.reflection && <p className="text-sm text-muted-foreground mt-2 italic">"{r.reflection}"</p>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
