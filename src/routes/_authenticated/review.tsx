import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAnsweredDuas, listDuas, listFasting, listQuranLogs, listReflections, listSadaqah, listWorshipLogs, listDhikr, listZakat, listZakatPayments } from "@/lib/data.functions";
import { PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { BookHeart, Landmark, Users } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [
    { title: "Worship Review — Muslim HQ" },
    { name: "description", content: "Reflect on your Salah, Quran, fasting, dhikr, duas, giving, and journaling over a month, year, or lifetime." },
    { property: "og:title", content: "Worship Review — Muslim HQ" },
    { property: "og:description", content: "A calm, private review of your worship rhythms and spiritual practices." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
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
  const dul = useServerFn(listDuas);
  const worship = useQuery({ queryKey: ["review", "w"], queryFn: () => wl({ data: { limit: 365 } }) });
  const quran = useQuery({ queryKey: ["review", "q"], queryFn: () => ql({ data: undefined as any }) });
  const fasting = useQuery({ queryKey: ["review", "f"], queryFn: () => fl({ data: undefined as any }) });
  const dhikr = useQuery({ queryKey: ["review", "d"], queryFn: () => dl({ data: undefined as any }) });
  const reflections = useQuery({ queryKey: ["review", "r"], queryFn: () => rl({ data: undefined as any }) });
  const sadaqah = useQuery({ queryKey: ["review", "s"], queryFn: () => sl({ data: undefined as any }) });
  const duas = useQuery({ queryKey: ["review", "duas"], queryFn: () => dul({ data: undefined as any }) });
  const adl = useServerFn(listAnsweredDuas);
  const answeredDuas = useQuery({ queryKey: ["review", "answered"], queryFn: () => adl({ data: undefined as any }) });
  const zakatFn = useServerFn(listZakat);
  const paymentsFn = useServerFn(listZakatPayments);
  const zakat = useQuery({ queryKey: ["zakat"], queryFn: () => zakatFn({ data: undefined as any }) });
  const payments = useQuery({ queryKey: ["zakat-payments"], queryFn: () => paymentsFn({ data: undefined as any }) });


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
      if (st && st !== "qada" && st !== "missed") done++;
      if (st === "on_time") onTime++;
      if (st === "qada" || st === "missed") qada++;
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
      sadaqahTotal: s.filter((x: any) => x.kind !== "zakat").reduce((a: number, x: any) => a + (+x.amount || 0), 0),
      givingTotal: s.reduce((a: number, x: any) => a + (+x.amount || 0), 0),
      reflectionsCount: r.length,
      jamaahCount: jamaah,
      jamaahPct: done ? Math.round((jamaah / done) * 100) : 0,
      masjidCount: masjid,
      masjidPct: done ? Math.round((masjid / done) * 100) : 0,
      perPrayer,
    };
  }, [mode, month, year, worship.data, quran.data, fasting.data, dhikr.data, reflections.data, sadaqah.data]);

  const answeredDuaCounts = useMemo(() => {
    const inRange = (date: string | null | undefined) => {
      if (!date) return mode === "lifetime";
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
  }, [answeredDuas.data, mode, month, year]);

  const topDuaCategory = useMemo(() => {
    const inRange = (date: string | null | undefined) => {
      if (!date) return mode === "lifetime";
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
  }, [duas.data, mode, month, year]);

  const zakatTotals = useMemo(() => {
    const inRange = (date: string | null | undefined) => mode === "lifetime" || !!date && (mode === "annual" ? date.slice(0, 4) === year : inMonth(date, month));
    const entries = (zakat.data ?? []).filter((entry: any) => inRange(entry.created_at));
    const ids = new Set(entries.map(entry => entry.id));
    const due = entries.reduce((sum, entry) => sum + Number(entry.zakat_due ?? 0), 0);
    const paid = (payments.data ?? []).filter(payment => ids.has(payment.zakat_entry_id)).reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { due, paid, remaining: Math.max(0, due - paid) };
  }, [zakat.data, payments.data, mode, month, year]);

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
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-[color:var(--sage)]"><BookHeart className="size-5" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--sage)]">Top dua category</p>
            <p className="mt-1 font-serif text-2xl">{topDuaCategory?.[0] ?? "No duas saved"}</p>
            <p className="text-xs text-muted-foreground">{topDuaCategory ? `${topDuaCategory[1]} saved ${topDuaCategory[1] === 1 ? "dua" : "duas"} in this period` : "Your most-saved category will appear here."}</p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Prayer completion" value={`${stats.completionPct}%`} />
        <Stat label="On-time rate" value={`${stats.onTimePct}%`} />
        <Stat label="Qada" value={stats.qada} />
        <Stat label="Jummah rate" value={`${stats.jummahRate}%`} />
        <Stat label="Quran pages" value={stats.quranPages} />
        <Stat label="Juz progressed" value={stats.quranJuz.toFixed(1)} />
        <Stat label="Fasts" value={stats.fastsCompleted} />
        <Stat label="Dhikr total" value={stats.dhikrTotal} />
        <Stat label="Sadaqah" value={`$${stats.sadaqahTotal.toLocaleString()}`} />
        <Stat label="Logged giving (Zakat + Sadaqah)" value={`$${stats.givingTotal.toLocaleString()}`} />
        <Stat label="Zakat due" value={zakat.isLoading ? "…" : zakatTotals.due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <Stat label="Zakat paid" value={zakat.isLoading || payments.isLoading ? "…" : zakatTotals.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <Stat label="Zakat remaining" value={zakat.isLoading || payments.isLoading ? "…" : zakatTotals.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
        <Stat label="Reflections" value={stats.reflectionsCount} />
        <Stat label="In Jama'ah" value={`${stats.jamaahCount} · ${stats.jamaahPct}%`} />
        <Stat label="At the Masjid" value={`${stats.masjidCount} · ${stats.masjidPct}%`} />
      </div>

      <Card className="mb-8">
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

      <Card>
        <h3 className="font-serif text-2xl mb-1">Answered duas</h3>
        <p className="text-xs text-muted-foreground mb-4">Gratitude, counted — {answeredDuaCounts.total} answered {answeredDuaCounts.total === 1 ? "dua" : "duas"} in this period.</p>
        {answeredDuaCounts.byCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No answered duas recorded yet — the ones you mark as answered will appear here.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {answeredDuaCounts.byCategory.map(([category, count]) => (
              <div key={category} className="rounded-2xl ring-1 ring-border p-3">
                <p className="text-sm font-medium truncate">{category}</p>
                <p className="text-2xl font-serif mt-1">{count}</p>
              </div>
            ))}
          </div>
        )}
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
