import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ensureSeeded, getProfile, getWorshipLog, listWorshipLogs, listQada, listQuranLogs, listDhikr, listZakat, listZakatPayments, upsertWorshipLog } from "@/lib/data.functions";
import { formatGregorian, formatHijri, todayISO } from "@/lib/hijri";
import { DEFAULT_COORDS, formatCountdown, formatTime, nextPrayer, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { hawlProgress, hawlReminder } from "@/lib/hawl";
import { AYAT_BANNERS } from "@/lib/dua-seed";
import { CalendarDays, Check, Circle } from "lucide-react";
import { InstallAppButton } from "@/components/InstallAppButton";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Muslim HQ" },
    { name: "description", content: "Today's prayer times, your salah streak, and Zakat & Hawl reminders in one calm view." },
    { property: "og:title", content: "Dashboard — Muslim HQ" },
    { property: "og:description", content: "Today's prayer times, salah streaks, and Zakat reminders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const seedFn = useServerFn(ensureSeeded);
  const profileFn = useServerFn(getProfile);
  const todayFn = useServerFn(getWorshipLog);
  const upsertFn = useServerFn(upsertWorshipLog);
  const historyFn = useServerFn(listWorshipLogs);
  const qadaFn = useServerFn(listQada);
  const quranFn = useServerFn(listQuranLogs);
  const dhikrFn = useServerFn(listDhikr);

  const today = todayISO();

  // Seed once on first load
  useEffect(() => { seedFn({ data: {} as any }).catch(() => {}); }, [seedFn]);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
  const zakatFn = useServerFn(listZakat);
  const paymentsFn = useServerFn(listZakatPayments);
  const zakat = useQuery({ queryKey: ["zakat"], queryFn: () => zakatFn({ data: undefined as any }) });
  const payments = useQuery({ queryKey: ["zakat-payments"], queryFn: () => paymentsFn({ data: undefined as any }) });
  const log = useQuery({ queryKey: ["worship", today], queryFn: () => todayFn({ data: { date: today } }) });
  const history = useQuery({ queryKey: ["worship-history"], queryFn: () => historyFn({ data: { limit: 60 } }) });
  const qada = useQuery({ queryKey: ["qada"], queryFn: () => qadaFn({ data: undefined as any }) });
  const quran = useQuery({ queryKey: ["quran"], queryFn: () => quranFn({ data: undefined as any }) });
  const dhikr = useQuery({ queryKey: ["dhikr"], queryFn: () => dhikrFn({ data: undefined as any }) });

  useEffect(() => {
    const refreshWorship = (event: StorageEvent) => {
      if (event.key !== "muslim-hq-worship-changed") return;
      qc.invalidateQueries({ queryKey: ["worship", today] });
      qc.invalidateQueries({ queryKey: ["worship-history"] });
      qc.invalidateQueries({ queryKey: ["qada"] });
    };
    window.addEventListener("storage", refreshWorship);
    return () => window.removeEventListener("storage", refreshWorship);
  }, [qc, today]);

  const ayatToday = (quran.data ?? []).filter(entry => entry.log_date === today).reduce((total, entry) => {
    const match = entry.verses_completed?.match(/^\d+:(\d+)(?:[–-](\d+))?$/);
    if (!match) return total;
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    return total + Math.max(0, last - first + 1);
  }, 0);
  const dhikrToday = (dhikr.data ?? []).filter(entry => entry.log_date === today).reduce((total, entry) => total + (entry.count ?? 0), 0) + (log.data?.dhikr_count ?? 0);
  const qadaRemaining = (qada.data ?? []).filter(entry => !entry.completed).length;

  const anniversary = profile.data?.zakat_anniversary;
  const hawl = anniversary ? hawlProgress(anniversary) : null;
  const reminder = anniversary ? hawlReminder(anniversary) : null;

  const upsert = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upsertFn({ data: { log_date: today, ...patch } as any }),
    onSuccess: (row: any) => { qc.invalidateQueries({ queryKey: ["worship", today] }); qc.invalidateQueries({ queryKey: ["worship-history"] }); qc.invalidateQueries({ queryKey: ["qada"] }); if (row?.qadaAdded) toast(`${row.qadaAdded} added to your Qada list`); },
  });


  const coords = profile.data?.latitude
    ? { latitude: profile.data.latitude, longitude: profile.data.longitude!, label: profile.data.location_label ?? "", method: profile.data.calc_method, madhab: (profile.data as any).madhab }
    : { ...DEFAULT_COORDS, method: profile.data?.calc_method, madhab: (profile.data as any)?.madhab };

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const upcoming = useMemo(() => nextPrayer(coords, now), [coords, now]);
  const countdown = formatCountdown(upcoming.at.getTime() - now.getTime());

  const ayah = AYAT_BANNERS[new Date().getDate() % AYAT_BANNERS.length];

  // Streaks
  const streaks = useMemo(() => computeStreaks(history.data ?? []), [history.data]);

  const displayName = profile.data?.display_name ?? "friend";

  return (
    <AppShell>
      {profile.data && !profile.data.onboarding_complete && <OnboardingDialog initial={profile.data as any} />}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium">Assalamu alaikum</p>
          <h1 className="text-4xl md:text-5xl font-serif leading-none mt-1">Peace, {displayName}</h1>
        </div>
        <div className="text-sm text-right">
          <p>{formatGregorian()}</p>
          <p className="text-[color:var(--sage)]">{formatHijri()} AH</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{now.toLocaleTimeString()}</p>
          <div className="mt-2 flex md:justify-end"><InstallAppButton /></div>
        </div>
      </header>

      <section className="mb-8 border-y border-border py-5" aria-label="Zakat anniversary reminder">
        <div className="flex items-start gap-3"><CalendarDays className="mt-1 size-5 shrink-0 text-primary" /><div>
          <h2 className="font-serif text-2xl">Zakat & Hawl</h2>
          <p className="mt-1 text-sm text-muted-foreground">{reminder ? <strong className="font-medium text-foreground" role="status">{reminder.message}</strong> : hawl ? `${hawl.daysRemaining} days until your next Zakat anniversary` : "Set your Zakat anniversary to see when it is approaching."}</p>
          {hawl && <p className="mt-1 text-xs text-muted-foreground">Estimated anniversary: {hawl.due.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · Local moon sighting may differ.</p>}
          <Link to="/zakat" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">{hawl ? "Review Zakat" : "Set anniversary"}</Link>
        </div></div>
      </section>

      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 relative overflow-hidden bg-[color:var(--sand-soft)] rounded-3xl p-8 md:p-10 ring-1 ring-border">
          <div className="absolute -right-16 -bottom-16 size-72 bg-white/30 dark:bg-white/5 rounded-t-full rotate-12 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-xs tracking-widest uppercase text-[color:var(--gold)] font-semibold">Up Next — {coords.label ?? ""}</span>
            <div className="mt-4 mb-8">
              <h2 className="text-6xl md:text-7xl font-serif leading-none">{PRAYER_LABEL[upcoming.name]}</h2>
              <p className="text-lg text-[color:var(--sage)] mt-2 font-medium">in {countdown} · {formatTime(upcoming.at)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/worship" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium">Log salah</Link>
              <Link to="/duas" className="ring-1 ring-border px-5 py-2.5 rounded-full text-sm font-medium">Read a dua</Link>
            </div>
          </div>
        </div>

        <section className="lg:col-span-5 bg-card rounded-3xl p-8 ring-1 ring-border" aria-label="Today's Worship">
          <h3 className="text-sm font-semibold tracking-wide uppercase mb-5">Today's Worship</h3>
          <div className="space-y-1" aria-label="Today's prayers">
            {PRAYERS.map(p => {
              const status = log.data?.[`${p}_status` as keyof typeof log.data] as string | null | undefined;
              const completed = status === "on_time" || status === "late";
              const excused = log.data?.excused || status === "excused";
              return <div key={p} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
                <span className="font-medium">{PRAYER_LABEL[p]}</span>
                {excused ? <span className="text-xs text-muted-foreground">Excused</span> : completed ? <Check aria-label="Completed" className="size-5 text-primary" strokeWidth={2.5} /> : status === "missed" || status === "qada" ? <span className="text-xs text-muted-foreground">{status === "missed" ? "Missed" : "Qada"}</span> : <Circle aria-label={log.isPending ? "Loading" : "Not logged"} className="size-5 text-muted-foreground" strokeWidth={1.5} />}
              </div>;
            })}
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><dt>Quran <span className="text-muted-foreground">· ayat read today</span></dt><dd className="font-serif text-xl tabular-nums">{quran.isPending ? "…" : ayatToday}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt>Daily Dhikr</dt><dd className="font-serif text-xl tabular-nums">{dhikr.isPending || log.isPending ? "…" : dhikrToday}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt>Qada <span className="text-muted-foreground">· remaining</span></dt><dd className="font-serif text-xl tabular-nums">{qada.isPending ? "…" : qadaRemaining}</dd></div>
          </dl>
        </section>
      </div>

      {/* Intention + dhikr */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <label className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--sage)]">Daily Intention</label>
          <input
            type="text"
            defaultValue={log.data?.intention ?? ""}
            onBlur={e => upsert.mutate({ intention: e.target.value })}
            placeholder="Seek patience in every action..."
            className="mt-2 w-full bg-transparent border-b border-border py-2 text-lg font-serif italic focus:outline-none focus:border-[color:var(--gold)] transition-colors"
          />
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Did I remember Allah today?</p>
            <p className="text-xs text-muted-foreground">A small toggle, a heavy scale.</p>
          </div>
          <button
            onClick={() => upsert.mutate({ remembered_allah: !log.data?.remembered_allah })}
            className={`size-12 rounded-full ring-1 ring-border grid place-items-center transition-colors ${log.data?.remembered_allah ? "bg-[color:var(--gold)]" : "bg-background"}`}
          >
            <div className={`size-2.5 rounded-full ${log.data?.remembered_allah ? "bg-white" : "bg-[color:var(--gold)]"}`} />
          </button>
        </Card>
      </div>

      {/* Ayah banner */}
      <div className="bg-[color:var(--sage-deep)] text-[color:var(--sand)] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-2xl md:text-3xl font-serif text-balance mb-4 italic">"{ayah.text}"</p>
          <p className="text-xs tracking-widest uppercase opacity-60">{ayah.ref}</p>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none grid place-items-center">
          <div className="size-80 border border-white/40 rotate-45" />
          <div className="absolute size-80 border border-white/40" />
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Salah", value: streaks.salah },
          { label: "Quran", value: streaks.quran },
          { label: "Dhikr", value: streaks.dhikr },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--sage)] mb-1">{s.label} Streak</p>
            <p className="text-3xl font-serif">{s.value} {s.value === 1 ? "day" : "days"}</p>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/worship", label: "Salah Log", sub: "Track your prayers" },
          { to: "/quran", label: "Quran", sub: "Read & reflect" },
          { to: "/fasting", label: "Fasting", sub: "Sawm journal" },
          { to: "/dhikr", label: "Dhikr", sub: "Remembrance" },
          { to: "/duas", label: "Duas", sub: "Supplications" },
          { to: "/goals", label: "Goals", sub: "Aspirations" },
          { to: "/reflections", label: "Reflect", sub: "Private notes" },
          { to: "/zakat", label: "Zakat", sub: "Wealth & giving" },
        ].map(q => (
          <Link key={q.to} to={q.to} className="p-6 rounded-2xl bg-[color:var(--sand-soft)] ring-1 ring-border hover:bg-card transition-colors">
            <p className="text-sm font-medium mb-1">{q.label}</p>
            <p className="text-[10px] text-[color:var(--sage)] uppercase tracking-tight">{q.sub}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function computeStreaks(logs: any[]) {
  const sorted = [...logs].sort((a, b) => (a.log_date < b.log_date ? 1 : -1));
  const dayComplete = (l: any) => l.excused || PRAYERS.every(p => {
    const s = l[`${p}_status`];
    return s && s !== "qada" && s !== "missed";
  });
  const dayQuran = (l: any) => (l.quran_pages ?? 0) > 0 || (l.quran_minutes ?? 0) > 0;
  const dayDhikr = (l: any) => (l.dhikr_count ?? 0) > 0;

  const streakOf = (pred: (l: any) => boolean) => {
    let count = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const l = sorted.find(x => x.log_date === iso);
      if (!l) { if (i === 0) continue; break; }
      if (l.excused) continue;
      if (pred(l)) count++;
      else if (i > 0) break;
    }
    return count;
  };
  return { salah: streakOf(dayComplete), quran: streakOf(dayQuran), dhikr: streakOf(dayDhikr) };
}
