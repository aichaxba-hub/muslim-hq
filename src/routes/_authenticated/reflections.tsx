import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createReflection, listReflections } from "@/lib/data.functions";
import { todayISO, weekStartISO } from "@/lib/hijri";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/reflections")({
head: () => ({ meta: [
    { title: "Reflection & Journaling — Muslim HQ" },
    { name: "description", content: "A private space to journal, reflect on your day, and grow with intention." },
    { property: "og:title", content: "Reflection & Journaling — Muslim HQ" },
    { property: "og:description", content: "A private space to journal, reflect on your day, and grow with intention." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReflectionsPage,
});
const MOODS = ["at peace", "struggling", "grateful", "anxious", "hopeful"];

function ReflectionsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReflections);
  const createFn = useServerFn(createReflection);
  const { data = [] } = useQuery({ queryKey: ["reflections"], queryFn: () => listFn({ data: undefined as any }) });
  const create = useMutation({
    mutationFn: (p: any) => createFn({ data: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reflections"] }); setForm(empty); }
  });

  const empty = {
    entry_date: todayISO(), week_start: weekStartISO(), mood: "",
    closest_to_allah: "", fell_short: "", distraction: "", sincere_dua: "", one_change: "",
    wins: "", struggles: "", gratitude: "", next_intention: "",
  };
  const [form, setForm] = useState(empty);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const [selected, setSelected] = useState<any>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (data.length > 0) setShowSaved(true);
  }, [data.length]);

  return (
    <AppShell>
      <PageHeader eyebrow="Reflection & Journaling" title="What the week is teaching you" subtitle="No grade. No judge. Just honesty before Allah." />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <select value={form.mood} onChange={e => set("mood", e.target.value)} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
            <option value=""> </option>
            {MOODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {[
          ["closest_to_allah", "What brought me closest to Allah this week?"],
          ["fell_short", "Where did I fall short?"],
          ["distraction", "What distracted my heart most?"],
          ["sincere_dua", "Which dua do I need to make more sincerely?"],
          ["one_change", "One change to carry into next week?"],
          ["wins", "Wins"],
          ["struggles", "Struggles"],
          ["gratitude", "Gratitude"],
          ["next_intention", "Next week's intention"],
        ].map(([k, label]) => (
          <div key={k} className="mb-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
            <textarea rows={2} value={(form as any)[k]} onChange={e => set(k, e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          </div>
        ))}
        <Button onClick={() => create.mutate({ ...form, mood: form.mood || null })}>Save reflection</Button>
      </Card>

      <Card className="mb-6 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSaved(!showSaved)}
          aria-expanded={showSaved}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            Your saved reflections
            <span className="text-xs text-muted-foreground">({data.length} saved)</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showSaved ? "rotate-180" : ""}`} />
        </button>
        {showSaved && (
          <div className="grid gap-3 px-5 pb-5">
            {data.map((r: any) => (
              <Card
                key={r.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelected(r)}
              >
                <p className="text-xs text-muted-foreground">{r.entry_date}{r.mood ? <> · <span className="text-[color:var(--gold)]">{r.mood}</span></> : null}</p>
                {r.closest_to_allah && <p className="mt-2 text-sm"><strong>Closest:</strong> {r.closest_to_allah}</p>}
                {r.fell_short && <p className="text-sm"><strong>Short:</strong> {r.fell_short}</p>}
                {r.next_intention && <p className="text-sm italic mt-2">→ {r.next_intention}</p>}
              </Card>
            ))}
            {!data.length && <p className="text-sm text-muted-foreground">No reflections saved yet. Your first one can start right below.</p>}
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected?.entry_date}{selected?.mood ? <> · <span className="text-[color:var(--gold)] font-normal">{selected.mood}</span></> : null}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              {[
                ["closest_to_allah", "What brought me closest to Allah"],
                ["fell_short", "Where I fell short"],
                ["distraction", "What distracted my heart most"],
                ["sincere_dua", "Dua to make more sincerely"],
                ["one_change", "One change to carry forward"],
                ["wins", "Wins"],
                ["struggles", "Struggles"],
                ["gratitude", "Gratitude"],
                ["next_intention", "Next week's intention"],
              ].map(([k, label]) => (
                (selected as any)[k] ? (
                  <div key={k}>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-1 whitespace-pre-wrap">{(selected as any)[k]}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
