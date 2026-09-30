import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createReflection, listReflections } from "@/lib/data.functions";
import { todayISO, weekStartISO } from "@/lib/hijri";
import { useState } from "react";

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
    entry_date: todayISO(), week_start: weekStartISO(), mood: "grateful",
    closest_to_allah: "", fell_short: "", distraction: "", sincere_dua: "", one_change: "",
    wins: "", struggles: "", gratitude: "", next_intention: "",
  };
  const [form, setForm] = useState(empty);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <AppShell>
      <PageHeader eyebrow="Reflection & Journaling" title="What the week is teaching you" subtitle="No grade. No judge. Just honesty before Allah." />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          <select value={form.mood} onChange={e => set("mood", e.target.value)} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
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
        <Button onClick={() => create.mutate(form)}>Save reflection</Button>
      </Card>

      <div className="grid gap-3">
        {data.map((r: any) => (
          <Card key={r.id}>
            <p className="text-xs text-muted-foreground">{r.entry_date} · <span className="text-[color:var(--gold)]">{r.mood}</span></p>
            {r.closest_to_allah && <p className="mt-2 text-sm"><strong>Closest:</strong> {r.closest_to_allah}</p>}
            {r.fell_short && <p className="text-sm"><strong>Short:</strong> {r.fell_short}</p>}
            {r.next_intention && <p className="text-sm italic mt-2">→ {r.next_intention}</p>}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
