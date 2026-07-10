import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFasting, listQuranLogs, listReflections, listSadaqah, listWorshipLogs, listDhikr } from "@/lib/data.functions";
import { PRAYERS } from "@/lib/prayer-times";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Annual Review — Muslim HQ" }] }),
  component: ReviewPage,
});

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

  const stats = useMemo(() => {
    const w = worship.data ?? [];
    const eligible = w.filter((l: any) => !l.excused);
    const totalSlots = eligible.length * 5;
    let done = 0, onTime = 0, qada = 0;
    eligible.forEach((l: any) => PRAYERS.forEach(p => {
      const s = l[`${p}_status`];
      if (s && s !== "qada") done++;
      if (s === "on_time") onTime++;
      if (s === "qada") qada++;
    }));
    const jummah = w.filter((l: any) => l.jummah).length;
    return {
      completionPct: totalSlots ? Math.round((done / totalSlots) * 100) : 0,
      onTimePct: totalSlots ? Math.round((onTime / totalSlots) * 100) : 0,
      qada,
      quranPages: (quran.data ?? []).reduce((a: number, r: any) => a + (r.pages ?? 0), 0) + w.reduce((a: number, r: any) => a + (r.quran_pages ?? 0), 0),
      quranJuz: (quran.data ?? []).reduce((a: number, r: any) => a + (Number(r.juz) || 0), 0),
      dhikrTotal: (dhikr.data ?? []).reduce((a: number, r: any) => a + (r.count ?? 0), 0) + w.reduce((a: number, r: any) => a + (r.dhikr_count ?? 0), 0),
      fastsCompleted: (fasting.data ?? []).filter((f: any) => f.completed).length,
      jummahRate: eligible.length ? Math.round((jummah / eligible.length) * 100) : 0,
      sadaqahTotal: (sadaqah.data ?? []).reduce((a: number, r: any) => a + (+r.amount || 0), 0),
      reflectionsCount: (reflections.data ?? []).length,
    };
  }, [worship.data, quran.data, fasting.data, dhikr.data, reflections.data, sadaqah.data]);

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; pages: number; salah: number }> = {};
    (worship.data ?? []).forEach((l: any) => {
      const m = l.log_date.slice(0, 7);
      map[m] ??= { month: m, pages: 0, salah: 0 };
      map[m].pages += l.quran_pages ?? 0;
      map[m].salah += PRAYERS.filter(p => l[`${p}_status`] && l[`${p}_status`] !== "qada").length;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [worship.data]);

  return (
    <AppShell>
      <PageHeader eyebrow="Annual Review" title="A quiet audit of the year" subtitle="Numbers do not measure sincerity — but they show up." />

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
        <h3 className="font-serif text-2xl mb-4">Monthly trends</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" />
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
