import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFasting, listQuranLogs, listReflections, listSadaqah, listWorshipLogs, listDhikr } from "@/lib/data.functions";
import { PRAYERS } from "@/lib/prayer-times";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Review — Muslim HQ" }] }),
  component: ReviewPage,
});

const inMonth = (date: string | null | undefined, month: string) => !!date && date.slice(0, 7) === month;

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function ReviewPage() {
  const wl = useServerFn(listWorshipLogs);
  const ql = useServerFn(listQuranLogs);
  const fl = useServerFn(listFasting);
  const dl = useServerFn(listDhikr);
  const rl = useServerFn(listReflections);
  const sl = useServerFn(listSadaqah);
  const worship = useQuery({ queryKey: ["review", "w"], queryFn: () => wl({ data: { limit: 365 } }) });
  const quran = useQuery({ queryKey: ["review", "q"], queryFn: () => ql({ data: undefined as any }) });
  const fasting = useQuery({ queryKey: ["review", "f"], queryFn: () => fl({ data: undefined as any }) });
  const dhikr = useQuery({ queryKey: ["review", "d"], queryFn: () => dl({ data: undefined as any }) });
  const reflections = useQuery({ queryKey: ["review", "r"], queryFn: () => rl({ data: undefined as any }) });
  const sadaqah = useQuery({ queryKey: ["review", "s"], queryFn: () => sl({ data: undefined as any }) });

  const [mode, setMode] = useState<"lifetime" | "annual" | "monthly">("annual");
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
      if (st && st !== "qada") done++;
      if (st === "on_time") onTime++;
      if (st === "qada") qada++;
    }));
    const jummah = w.filter((l: any) => l.jummah).length;

    // Congregation / masjid tallies — the two are tracked independently.
    let jamaah = 0, masjid = 0;
    const perPrayer: Record<string, { jamaah: number; masjid: number }> = {};
    w.forEach((l: any) => PRAYERS.forEach(p => {
      perPrayer[p] ??= { jamaah: 0, masjid: 0 };
      if (l[`${p}_congregation`]) { jamaah++; perPrayer[p].jamaah++; }
      if (l[`${p}_masjid`]) { masjid++; perPrayer[p].masjid++; }
    }));

    return {
      completionPct: totalSlots ? Math.round((done / totalSlots) * 100) : 0,
      onTimePct: totalSlots ? Math.round((onTime / totalSlots) * 100) : 0,
      qada,
      quranPages: q.reduce((a: number, x: any) => a + (x.pages ?? 0), 0) + w.reduce((a: number, x: any) => a + (x.quran_pages ?? 0), 0),
      quranJuz: q.reduce((a: number, x: any) => a + (Number(x.juz) || 0), 0),
      dhikrTotal: d.reduce((a: number, x: any) => a + (x.count ?? 0), 0) + w.reduce((a: number, x: any) => a + (x.dhikr_count ?? 0), 0),
      fastsCompleted: f.filter((x: any) => x.completed).length,
      jummahRate: eligible.length ? Math.round((jummah / eligible.length) * 100) : 0,
      sadaqahTotal: s.reduce((a: number, x: any) => a + (+x.amount || 0), 0),
      reflectionsCount: r.length,
      jamaahCount: jamaah,
      jamaahPct: done ? Math.round((jamaah / done) * 100) : 0,
      masjidCount: masjid,
      masjidPct: done ? Math.round((masjid / done) * 100) : 0,
      perPrayer,
    };
  }, [mode, month, year, worship.data, quran.data, fasting.data, dhikr.data, reflections.data, sadaqah.data]);

  const chart = useMemo(() => {
    if (mode === "lifetime") {
      const map: Record<string, { label: string; pages: number; salah: number }> = {};
      (worship.data ?? []).forEach((l: any) => {
        const y = l.log_date.slice(0, 4);
        map[y] ??= { label: y, pages: 0, salah: 0 };
        map[y].pages += l.quran_pages ?? 0;
        map[y].salah += PRAYERS.filter(p => l[`${p}_status`] && l[`${p}_status`] !== "qada").length;
      });
      return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
    }
    if (mode === "annual") {
      const map: Record<string, { label: string; pages: number; salah: number }> = {};
      (worship.data ?? []).filter((l: any) => l.log_date.slice(0, 4) === year).forEach((l: any) => {
        const m = l.log_date.slice(0, 7);
        map[m] ??= { label: m, pages: 0, salah: 0 };
        map[m].pages += l.quran_pages ?? 0;
        map[m].salah += PRAYERS.filter(p => l[`${p}_status`] && l[`${p}_status`] !== "qada").length;
      });
      return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
    }
    const map: Record<string, { label: string; pages: number; salah: number }> = {};
    (worship.data ?? []).filter((l: any) => inMonth(l.log_date, month)).forEach((l: any) => {
      const day = l.log_date.slice(8, 10);
      map[day] ??= { label: day, pages: 0, salah: 0 };
      map[day].pages += l.quran_pages ?? 0;
      map[day].salah += PRAYERS.filter(p => l[`${p}_status`] && l[`${p}_status`] !== "qada").length;
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [mode, month, year, worship.data]);

  return (
    <AppShell>
      <PageHeader eyebrow="Review" title="A quiet audit" subtitle="Numbers do not measure sincerity — but they show up." />

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex rounded-full border border-[color:var(--sand)] overflow-hidden">
          {(["lifetime", "annual", "monthly"] as const).map(m => (
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
        {mode === "monthly" && (
          <input
            type="month"
            value={month}
            onChange={e => e.target.value && setMonth(e.target.value)}
            className="rounded-full border border-[color:var(--sand)] bg-transparent px-4 py-2 text-sm"
          />
        )}
      </div>

      <h3 className="font-serif text-2xl mb-4">{mode === "lifetime" ? "All time" : mode === "annual" ? year : monthLabel(month)}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Prayer completion" value={`${stats.completionPct}%`} />
        <Stat label="On-time rate" value={`${stats.onTimePct}%`} />
        <Stat label="Qada" value={stats.qada} />
        <Stat label="Jummah rate" value={`${stats.jummahRate}%`} />
        <Stat label="Quran pages" value={stats.quranPages} />
        <Stat label="Juz progressed" value={stats.quranJuz.toFixed(1)} />
        <Stat label="Fasts" value={stats.fastsCompleted} />
        <Stat label="Dhikr total" value={stats.dhikrTotal} />
        <Stat label="Sadaqah" value={stats.sadaqahTotal.toLocaleString()} />
        <Stat label="Reflections" value={stats.reflectionsCount} />
      </div>

      <Card className="mb-8">
        <h3 className="font-serif text-2xl mb-4">{mode === "lifetime" ? "Yearly trends" : mode === "annual" ? "Monthly trends" : `Daily trends — ${monthLabel(month)}`}</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="salah" stroke="var(--sage-deep)" name="Salah" />
              <Line type="monotone" dataKey="pages" stroke="var(--gold)" name="Quran pages" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">{label}</p>
      <p className="text-3xl font-serif mt-1">{value}</p>
    </Card>
  );
}
