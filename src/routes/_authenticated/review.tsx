import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAnsweredDuas, listDuas, listFasting, listGoals, listQuranLogs, listReflections, listSadaqah, listWorshipLogs, listDhikr, listZakat, listZakatPayments, listQada, listQuranStudyGoals, getProfile } from "@/lib/data.functions";
import { PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { ChevronLeft, ChevronRight, Landmark, MoonStar, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { weekStartISO } from "@/lib/hijri";
import { ReviewInsightsCard } from "@/components/ReviewInsightsCard";

const NAFL_PRAYERS = [
  { v: "duha", l: "Duha" },
  { v: "tahajjud", l: "Tahajjud" },
  { v: "witr", l: "Witr" },
  { v: "istikhara", l: "Istikhara" },
] as const;

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [
    { title: "Worship Review — Muslim HQ" },
    { name: "description", content: "Reflect on your Salah, Quran, fasting, dhikr, duas, giving, and journaling over a week, month, year, or lifetime." },
    { property: "og:title", content: "Worship Review — Muslim HQ" },
    { property: "og:description", content: "A calm, private review of your worship rhythms and spiritual practices." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReviewPage,
});

const inMonth = (date: string | null | undefined, month: string) => !!date && date.slice(0, 7) === month;

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const inWeek = (date: string | null | undefined, weekStart: string) => {
  if (!date) return false;
  const day = date.slice(0, 10);
  return day >= weekStart && day <= addDays(weekStart, 6);
};

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function weekLabel(weekStart: string) {
  const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}`;
}

function ReviewPage() {
  const wl = useServerFn(listWorshipLogs);
  const ql = useServerFn(listQuranLogs);
  const fl = useServerFn(listFasting);
  const dl = useServerFn(listDhikr);
  const rl = useServerFn(listReflections);
  const sl = useServerFn(listSadaqah);
  const dul = useServerFn(listDuas);
  const worship = useQuery({ queryKey: ["review", "w"], queryFn: () => wl({ data: { limit: 5000 } }) });
  const quran = useQuery({ queryKey: ["review", "q"], queryFn: () => ql({ data: undefined as any }) });
  const fasting = useQuery({ queryKey: ["review", "f"], queryFn: () => fl({ data: undefined as any }) });
  const dhikr = useQuery({ queryKey: ["review", "d"], queryFn: () => dl({ data: undefined as any }) });
  const reflections = useQuery({ queryKey: ["review", "r"], queryFn: () => rl({ data: undefined as any }) });
  const sadaqah = useQuery({ queryKey: ["review", "s"], queryFn: () => sl({ data: undefined as any }) });
  const duas = useQuery({ queryKey: ["review", "duas"], queryFn: () => dul({ data: undefined as any }) });
  const adl = useServerFn(listAnsweredDuas);
  const answeredDuas = useQuery({ queryKey: ["review", "answered"], queryFn: () => adl({ data: undefined as any }) });
  const gl = useServerFn(listGoals);
  const goals = useQuery({ queryKey: ["review", "goals"], queryFn: () => gl({ data: undefined as any }) });
  const zakatFn = useServerFn(listZakat);
  const paymentsFn = useServerFn(listZakatPayments);
  const zakat = useQuery({ queryKey: ["zakat"], queryFn: () => zakatFn({ data: undefined as any }) });
  const payments = useQuery({ queryKey: ["zakat-payments"], queryFn: () => paymentsFn({ data: undefined as any }) });
  const qadaFn = useServerFn(listQada);
  const qadaQ = useQuery({ queryKey: ["qada"], queryFn: () => qadaFn({ data: undefined as any }) });
  const studyFn = useServerFn(listQuranStudyGoals);
  const studyQ = useQuery({ queryKey: ["review", "study"], queryFn: () => studyFn({ data: undefined as any }) });
  const profileFn = useServerFn(getProfile);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });


  const [mode, setMode] = useState<"lifetime" | "annual" | "monthly" | "weekly">("annual");
  const [weekStart, setWeekStart] = useState(() => weekStartISO());
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(() => new Date().getFullYear().toString());

  const years = useMemo(() => {
    const set = new Set<string>([new Date().getFullYear().toString()]);
    (worship.data ?? []).forEach((l: any) => l.log_date && set.add(l.log_date.slice(0, 4)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [worship.data]);

  const stats = useMemo(() => {
    const inRange = (date: string | null | undefined) => {
      if (!date) return false;
      if (mode === "weekly") return inWeek(date, weekStart);
      if (mode === "monthly") return inMonth(date, month);
      if (mode === "annual") return date.slice(0, 4) === year;
      return true;
    };
    const w = (worship.data ?? []).filter((l: any) => inRange(l.log_date));
    const q = (quran.data ?? []).filter((l: any) => inRange(l.log_date));
    const f = (fasting.data ?? []).filter((l: any) => inRange(l.log_date));
    const d = (dhikr.data ?? []).filter((l: any) => inRange(l.log_date));
    const r = (reflections.data ?? []).filter((l: any) => inRange(l.entry_date));
    const s = (sadaqah.data ?? []).filter((l: any) => inRange(l.log_date));

    const eligible = w.filter((l: any) => !l.excused);
    const totalSlots = eligible.length * 5;
    let done = 0, onTime = 0, qada = 0;
    eligible.forEach((l: any) => PRAYERS.forEach(p => {
      const st = l[`${p}_status`];
      if (st === "on_time" || st === "late") done++;
      if (st === "on_time") onTime++;
      if (st === "qada" || st === "missed") qada++;
    }));
    const jummah = eligible.filter((l: any) => l.jummah).length;

    // Congregation / masjid tallies — the two are tracked independently.
    let jamaah = 0, masjid = 0;
    const perPrayer: Record<string, { jamaah: number; masjid: number }> = {};
    eligible.forEach((l: any) => PRAYERS.forEach(p => {
      perPrayer[p] ??= { jamaah: 0, masjid: 0 };
      if (l[`${p}_congregation`]) { jamaah++; perPrayer[p].jamaah++; }
      if (l[`${p}_masjid`]) { masjid++; perPrayer[p].masjid++; }
    }));

    // Nafl are voluntary — counted from every logged day in range, excused days included.
    const naflCounts: Record<string, number> = {};
    w.forEach((l: any) => NAFL_PRAYERS.forEach(n => {
      if (l[n.v]) naflCounts[n.v] = (naflCounts[n.v] ?? 0) + 1;
    }));

    const goalsInRange = (goals.data ?? []).filter((g: any) => inRange(g.created_at));
    const goalsCompleted = goalsInRange.filter((g: any) => g.status === "Completed").length;

    const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
      const m: Record<string, number> = {};
      rows.forEach(r => { const k = key(r)?.toString().trim() || "Other"; m[k] = (m[k] ?? 0) + 1; });
      return m;
    };
    // Qada: makeups by made_up_date, outstanding as current balance.
    const allQada = (qadaQ.data ?? []) as any[];
    const qadaMadeUp = allQada.filter(x => x.completed && inRange(x.made_up_date));
    const qadaOutstanding = allQada.filter(x => !x.completed).length;
    // Quran study goals in range (by goal_date).
    const study = ((studyQ.data ?? []) as any[]).filter(g => inRange(g.goal_date));
    const studyAyat = study.reduce((a, g) => a + Math.max(0, Math.min(g.last_completed_ayah, g.end_ayah) - g.start_ayah + 1), 0);
    const recitedAyat = q.reduce((a: number, x: any) => {
      const m = String(x.verses_completed ?? "").match(/^\d+:(\d+)(?:[–-](\d+))?$/);
      return a + (m ? (m[2] ? Math.max(1, +m[2] - +m[1] + 1) : 1) : 0);
    }, 0);
    const surahsRead = new Set(q.map((x: any) => surahKey(x.surah)).filter(Boolean)).size;
    // Goals
    const goalsInProgress = goalsInRange.filter((g: any) => g.status === "In Progress").length;
    // Duas
    const duasInRange = ((duas.data ?? []) as any[]).filter(x => mode === "lifetime" || inRange(x.created_at));
    const giftRows = s.filter((x: any) => x.kind !== "zakat");
    const dhikrSessions = d.length;
    const excusedDays = w.filter((l: any) => l.excused).length;

    return {
      completionPct: totalSlots ? Math.round((done / totalSlots) * 100) : 0,
      onTimePct: totalSlots ? Math.round((onTime / totalSlots) * 100) : 0,
      missedPrayers: qada,
      loggedDays: w.length,
      excusedDays,
      excuseBreakdown: countBy(w.filter((l: any) => l.excused), (l: any) => l.excuse_type),
      qadaMadeUp: qadaMadeUp.length,
      qadaMadeUpByPrayer: countBy(qadaMadeUp, x => PRAYER_LABEL[x.prayer as keyof typeof PRAYER_LABEL] ?? x.prayer),
      qadaOutstanding,
      // Single source per metric: Quran sessions and dhikr logs only (legacy day-log fields would double count).
      quranPages: q.reduce((a: number, x: any) => a + (x.pages ?? 0), 0),
      quranJuz: q.reduce((a: number, x: any) => a + (Number(x.juz) || 0), 0),
      quranSessions: q.length,
      surahsRead,
      studyAyat,
      recitedAyat,
      studyGoalsCompleted: study.filter(g => g.completed).length,
      studyGoalsTotal: study.length,
      dhikrTotal: d.reduce((a: number, x: any) => a + (x.count ?? 0), 0),
      dhikrSessions,
      dhikrByPhrase: countBy(d, (x: any) => x.category),
      fastsCompleted: f.filter((x: any) => x.completed).length,
      fastsByType: countBy(f.filter((x: any) => x.completed), (x: any) => x.fast_type),
      ramadanFastsOwed: (profileQ.data as any)?.ramadan_fasts_owed ?? 0,
      jummahRate: eligible.length ? Math.round((jummah / eligible.length) * 100) : 0,
      jummahCount: jummah,
      sadaqahTotal: giftRows.reduce((a: number, x: any) => a + (+x.amount || 0), 0),
      sadaqahGifts: giftRows.length,
      reflectionsCount: r.length,
      moods: countBy(r.filter((x: any) => x.mood), (x: any) => x.mood),
      duasSaved: duasInRange.length,
      duasFavorited: duasInRange.filter(x => x.favorited).length,
      jamaahCount: jamaah,
      jamaahPct: done ? Math.round((jamaah / done) * 100) : 0,
      masjidCount: masjid,
      masjidPct: done ? Math.round((masjid / done) * 100) : 0,
      perPrayer,
      naflCounts,
      goalsCompleted,
      goalsInProgress,
      goalsTotal: goalsInRange.length,
      goalsByCategory: countBy(goalsInRange, (g: any) => g.category),
    };
  }, [mode, month, year, weekStart, worship.data, quran.data, fasting.data, dhikr.data, reflections.data, sadaqah.data, goals.data, qadaQ.data, studyQ.data, profileQ.data, duas.data]);

  // Personal habit profile across ALL history — grounds the AI in this user's real patterns.
  const journey = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    const recent = (date: string | null | undefined, from: number, to: number) => !!date && date.slice(0, 10) > daysAgo(from) && date.slice(0, 10) <= daysAgo(to);
    const logs = (worship.data ?? []) as any[];
    const perPrayer: Record<string, { onTimePct: number; logged: number }> = {};
    PRAYERS.forEach(p => {
      const rows = logs.filter(l => !l.excused && l[`${p}_status`]);
      perPrayer[PRAYER_LABEL[p]] = { logged: rows.length, onTimePct: rows.length ? Math.round(rows.filter(l => l[`${p}_status`] === "on_time").length / rows.length * 100) : 0 };
    });
    const ranked = Object.entries(perPrayer).filter(([, v]) => v.logged >= 3).sort((a, b) => b[1].onTimePct - a[1].onTimePct);
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wd: Record<string, number> = {};
    logs.filter(l => !l.excused).forEach(l => {
      const done = PRAYERS.filter(p => l[`${p}_status`] === "on_time").length;
      const k = weekday[new Date(`${l.log_date}T12:00:00`).getDay()];
      wd[k] = (wd[k] ?? 0) + done;
    });
    // Current full-five streak (excused days preserve it).
    let streak = 0;
    const byDate = new Map(logs.map(l => [l.log_date, l]));
    for (let i = 0; i < 400; i++) {
      const l = byDate.get(daysAgo(i));
      if (!l) { if (i === 0) continue; break; }
      if (l.excused) continue;
      if (PRAYERS.every(p => l[`${p}_status`] === "on_time")) streak++; else if (i === 0) continue; else break;
    }
    const window = (from: number, to: number) => {
      const w = logs.filter(l => !l.excused && recent(l.log_date, from, to));
      const slots = w.length * 5;
      const on = w.reduce((a, l) => a + PRAYERS.filter(p => l[`${p}_status`] === "on_time").length, 0);
      const quranRows = ((quran.data ?? []) as any[]).filter(x => recent(x.log_date, from, to));
      const dh = ((dhikr.data ?? []) as any[]).filter(x => recent(x.log_date, from, to));
      return {
        onTimePct: slots ? Math.round(on / slots * 100) : null,
        quranSessions: quranRows.length,
        dhikr: dh.reduce((a, x) => a + (x.count ?? 0), 0),
        qadaMadeUp: ((qadaQ.data ?? []) as any[]).filter(x => x.completed && recent(x.made_up_date, from, to)).length,
        fasts: ((fasting.data ?? []) as any[]).filter(x => x.completed && recent(x.log_date, from, to)).length,
      };
    };
    const dhikrFav: Record<string, number> = {};
    ((dhikr.data ?? []) as any[]).forEach(x => { if (x.category) dhikrFav[x.category] = (dhikrFav[x.category] ?? 0) + (x.count ?? 0); });
    const first = logs.map(l => l.log_date).sort()[0];
    return {
      today,
      trackingSince: first ?? null,
      currentFullFiveStreak: streak,
      strongestPrayer: ranked[0]?.[0] ?? null,
      prayerNeedingCare: ranked.length > 1 ? ranked[ranked.length - 1][0] : null,
      perPrayerOnTime: perPrayer,
      onTimeByWeekday: wd,
      favouriteDhikr: Object.entries(dhikrFav).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k),
      last30Days: window(30, 0),
      previous30Days: window(60, 30),
      quranDailyGoal: (profileQ.data as any)?.quran_daily_goal ?? null,
      khatmTarget: (profileQ.data as any)?.khatm_target ?? null,
      activeGoals: ((goals.data ?? []) as any[]).filter(g => g.status !== "Completed").slice(0, 5).map(g => g.title),
    };
  }, [worship.data, quran.data, dhikr.data, qadaQ.data, fasting.data, profileQ.data, goals.data]);

  const shift = (dir: -1 | 1) => {
    if (mode === "weekly") setWeekStart(addDays(weekStart, 7 * dir));
    else if (mode === "monthly") {
      const [y, m] = month.split("-").map(Number);
      const d = new Date(y, m - 1 + dir, 1);
      setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else if (mode === "annual") setYear(String(Number(year) + dir));
  };

  const answeredDuaCounts = useMemo(() => {
    const inRange = (date: string | null | undefined) => {
      if (!date) return mode === "lifetime";
      if (mode === "weekly") return inWeek(date, weekStart);
      if (mode === "monthly") return inMonth(date, month);
      if (mode === "annual") return date.slice(0, 4) === year;
      return true;
    };
    const rows = (answeredDuas.data ?? []).filter((a: any) => inRange(a.answered_date));
    const counts = new Map<string, number>();
    rows.forEach((a: any) => {
      const category = a.category?.trim() || "My Duas";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    const byCategory = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { total: rows.length, byCategory };
  }, [answeredDuas.data, mode, month, year, weekStart]);

  const topDuaCategory = useMemo(() => {
    const inRange = (date: string | null | undefined) => {
      if (!date) return mode === "lifetime";
      if (mode === "weekly") return inWeek(date, weekStart);
      if (mode === "monthly") return inMonth(date, month);
      if (mode === "annual") return date.slice(0, 4) === year;
      return true;
    };
    const counts = new Map<string, number>();
    (duas.data ?? []).filter((dua: any) => inRange(dua.created_at)).forEach((dua: any) => {
      const category = dua.category?.trim() || "Uncategorized";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
  }, [duas.data, mode, month, year, weekStart]);

  const zakatTotals = useMemo(() => {
    const inRange = (date: string | null | undefined) => mode === "lifetime" || !!date && (mode === "annual" ? date.slice(0, 4) === year : mode === "weekly" ? inWeek(date, weekStart) : inMonth(date, month));
    const entries = (zakat.data ?? []).filter((entry: any) => inRange(entry.created_at));
    const ids = new Set(entries.map(entry => entry.id));
    const due = entries.reduce((sum, entry) => sum + Number(entry.zakat_due ?? 0), 0);
    const paid = (payments.data ?? []).filter(payment => ids.has(payment.zakat_entry_id)).reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { due, paid, remaining: Math.max(0, due - paid) };
  }, [zakat.data, payments.data, mode, month, year, weekStart]);

  return (
    <AppShell>
      <PageHeader eyebrow="Review" title="A quiet audit" subtitle="Numbers do not measure sincerity — but they show up." />

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex rounded-full border border-[color:var(--sand)] overflow-hidden">
          {(["lifetime", "annual", "monthly", "weekly"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 text-sm capitalize transition-colors ${mode === m ? "bg-[color:var(--sage-deep)] text-[color:var(--sand-soft)]" : "hover:bg-[color:var(--sand-soft)]"}`}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "annual" && (
          <button
            onClick={() => exportIslamicYear(year, stats).catch(() => toast.error("Could not export your year — please try again"))}
            className="rounded-full border border-[color:var(--sand)] px-4 py-2 text-sm hover:bg-[color:var(--sand-soft)]"
          >
            Export My Islamic Year
          </button>
        )}
        {mode === "annual" && (
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="rounded-full border border-[color:var(--sand)] bg-transparent px-4 py-2 text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
        {mode === "weekly" && (
          <input
            type="date"
            aria-label="Week starting"
            value={weekStart}
            onChange={e => e.target.value && setWeekStart(weekStartISO(new Date(`${e.target.value}T12:00:00`)))}
            className="rounded-full border border-[color:var(--sand)] bg-transparent px-4 py-2 text-sm"
          />
        )}
        {mode === "monthly" && (
          <input
            type="month"
            value={month}
            onChange={e => e.target.value && setMonth(e.target.value)}
            className="rounded-full border border-[color:var(--sand)] bg-transparent px-4 py-2 text-sm"
          />
        )}
        {mode !== "lifetime" && (
          <div className="flex gap-1">
            <button aria-label="Previous period" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-full border border-[color:var(--sand)] hover:bg-[color:var(--sand-soft)]"><ChevronLeft size={16} /></button>
            <button aria-label="Next period" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full border border-[color:var(--sand)] hover:bg-[color:var(--sand-soft)]"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
      <ReviewInsightsCard
        ready={!worship.isLoading && !quran.isLoading}
        period={mode === "weekly" ? `week of ${weekStart}` : mode === "monthly" ? `month ${month}` : mode === "annual" ? `year ${year}` : "lifetime"}
        stats={{ ...stats, perPrayer: undefined, journey, answeredDuas: answeredDuaCounts.total, topDuaCategory: topDuaCategory?.[0] ?? null, zakat: zakatTotals }}
      />

      <h3 className="font-serif text-3xl mb-6">{mode === "lifetime" ? "All time" : mode === "annual" ? year : mode === "weekly" ? weekLabel(weekStart) : monthLabel(month)}</h3>

      <section className="mb-8">
        <div className="mb-3 flex items-baseline gap-3 border-b border-[color:var(--sand)] pb-2">
          <h4 className="font-serif text-xl">Salah</h4>
          <p className="text-xs text-muted-foreground">Excused days are honoured, never counted against you.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Prayer completion" value={`${stats.completionPct}%`} />
          <Stat label="On-time rate" value={`${stats.onTimePct}%`} />
          <Stat label="Days logged" value={stats.loggedDays} />
          <Stat label="Excused days" value={stats.excusedDays} sub={breakdown(stats.excuseBreakdown)} />
          <Stat label="Jummah" value={`${stats.jummahCount} · ${stats.jummahRate}%`} />
          <Stat label="In Jama'ah" value={`${stats.jamaahCount} · ${stats.jamaahPct}%`} />
          <Stat label="At the Masjid" value={`${stats.masjidCount} · ${stats.masjidPct}%`} />
          <Stat label="Missed prayers" value={stats.missedPrayers} />
        </div>
        <Card className="mt-4">
          <h3 className="font-serif text-2xl mb-1">Jama'ah & Masjid by prayer</h3>
          <p className="text-xs text-muted-foreground mb-4">Counted separately — a prayer can be one, both, or neither.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PRAYERS.map(p => (
              <div key={p} className="rounded-2xl ring-1 ring-border p-3">
                <p className="text-sm font-medium mb-2">{PRAYER_LABEL[p]}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={12} /> Jama'ah <span className="font-semibold text-foreground">{stats.perPrayer[p]?.jamaah ?? 0}</span></p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark size={12} /> Masjid <span className="font-semibold text-foreground">{stats.perPrayer[p]?.masjid ?? 0}</span></p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="mt-4">
          <h3 className="font-serif text-2xl mb-1">The Nafl</h3>
          <p className="text-xs text-muted-foreground mb-4">Voluntary prayers, counted separately — excused days included.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NAFL_PRAYERS.map(n => (
              <div key={n.v} className="rounded-2xl ring-1 ring-border p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium"><MoonStar size={12} className="text-[color:var(--sage)]" /> {n.l}</p>
                <p className="text-2xl font-serif mt-1">{stats.naflCounts[n.v] ?? 0}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Section title="Qada" note="Every makeup is a return.">
        <Stat label="Made up" value={qadaQ.isLoading ? "…" : stats.qadaMadeUp} sub={breakdown(stats.qadaMadeUpByPrayer)} />
        <Stat label="Outstanding now" value={qadaQ.isLoading ? "…" : stats.qadaOutstanding} />
      </Section>

      <Section title="Quran">
        <Stat label="Pages" value={stats.quranPages} />
        <Stat label="Juz progressed" value={stats.quranJuz.toFixed(1)} />
        <Stat label="Sessions" value={stats.quranSessions} />
        <Stat label="Surahs read" value={stats.surahsRead} />
        <Stat label="Ayat recited" value={stats.recitedAyat} sub={`${stats.studyAyat} via study goals`} />
        <Stat label="Study goals" value={`${stats.studyGoalsCompleted} / ${stats.studyGoalsTotal}`} />
      </Section>

      <Section title="Fasting">
        <Stat label="Fasts" value={stats.fastsCompleted} sub={breakdown(stats.fastsByType)} />
        <Stat label="Ramadan fasts owed" value={stats.ramadanFastsOwed} />
      </Section>

      <Section title="Dhikr">
        <Stat label="Dhikr total" value={stats.dhikrTotal.toLocaleString()} />
        <Stat label="Sessions" value={stats.dhikrSessions} sub={breakdown(stats.dhikrByPhrase)} />
      </Section>

      <Section title="Heart" note="Duas, reflections and intentions.">
        <Stat label="Duas saved" value={stats.duasSaved} sub={`${stats.duasFavorited} favourited`} />
        <Stat label="Answered duas" value={answeredDuaCounts.total} />
        <Stat label="Top dua category" value={topDuaCategory?.[0] ?? "—"} sub={topDuaCategory ? `${topDuaCategory[1]} saved` : undefined} small />
        <Stat label="Reflections" value={stats.reflectionsCount} sub={breakdown(stats.moods)} />
        <Stat label="Goals completed" value={goals.isLoading ? "…" : `${stats.goalsCompleted} / ${stats.goalsTotal}`} sub={`${stats.goalsInProgress} in progress`} />
      </Section>

      <Section title="Giving">
        <Stat label="Sadaqah" value={`$${stats.sadaqahTotal.toLocaleString()}`} sub={`${stats.sadaqahGifts} ${stats.sadaqahGifts === 1 ? "gift" : "gifts"}`} />
        <Stat label="Zakat due" value={zakat.isLoading ? "…" : zakatTotals.due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <Stat label="Zakat paid" value={zakat.isLoading || payments.isLoading ? "…" : zakatTotals.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <Stat label="Zakat remaining" value={zakat.isLoading || payments.isLoading ? "…" : zakatTotals.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
      </Section>


    </AppShell>
  );
}

async function exportIslamicYear(year: string, s: any) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Muslim HQ";
  const sheet = wb.addWorksheet("My Islamic Year");
  const b = (m: Record<string, number>) => breakdown(m) ?? "—";
  const rows: [string, string, string | number][] = [
    ["Salah", "Completion", `${s.completionPct}%`],
    ["Salah", "Completed on time", `${s.onTimePct}%`],
    ["Salah", "Days logged", s.loggedDays],
    ["Salah", "Excused days", s.excusedDays],
    ["Salah", "Excuse reasons", b(s.excuseBreakdown)],
    ["Salah", "Jama'ah prayers", s.jamaahCount],
    ["Salah", "Masjid prayers", s.masjidCount],
    ["Salah", "Jummah attended", s.jummahCount],
    ["Qada", "Made up", s.qadaMadeUp],
    ["Qada", "Made up by prayer", b(s.qadaMadeUpByPrayer)],
    ["Qada", "Still outstanding (today)", s.qadaOutstanding],
    ["Quran", "Sessions", s.quranSessions],
    ["Quran", "Pages", s.quranPages],
    ["Quran", "Juz", s.quranJuz],
    ["Quran", "Ayat recited", s.recitedAyat],
    ["Quran", "Surahs read", s.surahsRead],
    ["Quran", "Study goals completed", `${s.studyGoalsCompleted} of ${s.studyGoalsTotal}`],
    ["Fasting", "Fasts completed", s.fastsCompleted],
    ["Fasting", "By type", b(s.fastsByType)],
    ["Dhikr", "Total count", s.dhikrTotal],
    ["Dhikr", "Sessions", s.dhikrSessions],
    ["Dhikr", "Sessions by phrase", b(s.dhikrByPhrase)],
    ["Heart", "Reflections", s.reflectionsCount],
    ["Heart", "Moods", b(s.moods)],
    ["Heart", "Duas saved", s.duasSaved],
    ["Goals", "Completed", s.goalsCompleted],
    ["Goals", "In progress", s.goalsInProgress],
    ["Giving", "Sadaqah total", s.sadaqahTotal],
    ["Giving", "Sadaqah gifts", s.sadaqahGifts],
  ];
  sheet.addRow([`My Islamic Year — ${year}`]).font = { bold: true, size: 14 };
  sheet.addRow([]);
  sheet.addRow(["Section", "Measure", "Value"]).font = { bold: true };
  rows.forEach(r => sheet.addRow(r));
  sheet.getColumn(1).width = 14; sheet.getColumn(2).width = 30; sheet.getColumn(3).width = 50;
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url; a.download = `my-islamic-year-${year}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function breakdown(m: Record<string, number>) {
  const e = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return e.length ? e.map(([k, v]) => `${k} ${v}`).join(" · ") : undefined;
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-3 border-b border-[color:var(--sand)] pb-2">
        <h4 className="font-serif text-xl">{title}</h4>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub, small }: { label: string; value: string | number; sub?: string; small?: boolean }) {
  return (
    <Card>
      <p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">{label}</p>
      <p className={`${small ? "text-xl" : "text-3xl"} font-serif mt-1 truncate`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sub}</p>}
    </Card>
  );
}
