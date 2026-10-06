import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createDhikr, listDhikr } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useState, useEffect } from "react";
import { VoiceDhikrCounter } from "@/components/VoiceDhikrCounter";
import { VOICE_DHIKR_CATEGORIES } from "@/lib/dhikr-voice";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dhikr")({
  head: () => ({
    meta: [
      { title: "Dhikr Counter — Muslim HQ" },
      { name: "description", content: "Count dhikr by tap or voice, then save each remembrance session privately." },
      { property: "og:title", content: "Dhikr Counter — Muslim HQ" },
      { property: "og:description", content: "Count dhikr by tap or voice, then save each remembrance session privately." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DhikrPage,
});
const CATS = [...VOICE_DHIKR_CATEGORIES, "Other"];

function DhikrPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDhikr);
  const createFn = useServerFn(createDhikr);
  const { data = [] } = useQuery({ queryKey: ["dhikr"], queryFn: () => listFn({ data: undefined as any }) });
  const create = useMutation({ mutationFn: (p: any) => createFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["dhikr"] }) });
  const [form, setForm] = useState({ log_date: todayISO(), category: CATS[0], count: 33, notes: "" });
  const [showTotals, setShowTotals] = useState(false);
  useEffect(() => { if (data.length > 0) setShowTotals(true); }, [data.length]);

  const totals: Record<string, number> = {};
  data.forEach((d: any) => { totals[d.category] = (totals[d.category] ?? 0) + (d.count ?? 0); });

  const [taps, setTaps] = useState(0);

  return (
    <AppShell>
      <PageHeader eyebrow="Dhikr" title="Remembrance counter" subtitle="Remember Him, and He remembers you." />

      <Card className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-[color:var(--sage)] mb-2">Live tasbih</p>
        <p className="text-7xl font-serif mb-4">{taps}</p>
        <div className="flex justify-center gap-3">
          <Button variant="gold" onClick={() => setTaps(t => t + 1)}>Tap</Button>
          <Button variant="ghost" onClick={() => setTaps(0)}>Reset</Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="font-serif text-2xl mb-4">Log a session</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <input type="date" value={form.log_date} onChange={e => setForm({ ...form, log_date: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="number" min={1} value={form.count} onChange={e => setForm({ ...form, count: +e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <Button onClick={() => create.mutate(form)}>Save</Button>
        </div>
      </Card>

      <VoiceDhikrCounter
        onUseCount={(count, category) => {
          setForm(current => ({
            ...current,
            count,
            category: category && CATS.includes(category) ? category : current.category,
          }));
        }}
        onSaveSession={async (count, category) => {
          await create.mutateAsync({
            log_date: todayISO(),
            category,
            count,
            notes: "Voice-counted session",
          });
        }}
      />

      <Card>
        <button
          type="button"
          onClick={() => setShowTotals(s => !s)}
          aria-expanded={showTotals}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-2xl">Running totals</h3>
            <span className="text-xs uppercase tracking-widest text-[color:var(--sage)] ring-1 ring-border rounded-full px-2.5 py-0.5">
              {data.length} {data.length === 1 ? "session" : "sessions"}
            </span>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showTotals ? "rotate-180" : ""}`} />
        </button>

        {showTotals && (
          <div className="mt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {Object.entries(totals).map(([k, v]) => (
                <Card key={k}><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">{k}</p><p className="text-2xl font-serif">{v}</p></Card>
              ))}
              {Object.keys(totals).length === 0 && <p className="text-muted-foreground text-sm">No sessions yet.</p>}
            </div>

            <div className="grid gap-2">
              {data.slice(0, 30).map((r: any) => (
                <div key={r.id} className="flex justify-between p-3 rounded-2xl ring-1 ring-border text-sm">
                  <span>{r.log_date} · {r.category}</span>
                  <span className="text-muted-foreground">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
