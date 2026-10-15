import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-app-server-fn";
import { Sparkles } from "lucide-react";
import { Button, Card } from "@/components/AppShell";
import { findDuas } from "@/lib/dua-finder.functions";
import { DuaAudio } from "@/components/DuaAudio";

export function DuaFinder({ duas }: { duas: any[] }) {
  const findFn = useServerFn(findDuas);
  const [need, setNeed] = useState("");
  const run = useMutation({ mutationFn: (n: string) => findFn({ data: { need: n } }) });
  const byId = new Map(duas.map((d) => [d.id, d]));
  const res = run.data;

  return (
    <Card className="mb-6">
      <h2 className="font-serif text-xl mb-1 flex items-center gap-2"><Sparkles className="size-4 text-[color:var(--gold)]" /> Find a dua for what you're carrying</h2>
      <p className="text-xs text-muted-foreground mb-3">Describe what you need support with. We'll suggest duas from your own vault.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (need.trim().length >= 3) run.mutate(need.trim()); }} className="flex flex-col sm:flex-row gap-3">
        <textarea value={need} onChange={(e) => setNeed(e.target.value)} rows={2} maxLength={1000}
          placeholder="e.g. I feel anxious about my job and my family's future"
          className="flex-1 px-3 py-2 rounded-xl bg-background ring-1 ring-border text-sm" />
        <Button type="submit" disabled={run.isPending || need.trim().length < 3}>{run.isPending ? "Searching…" : "Find duas"}</Button>
      </form>
      {run.isError && <p className="text-sm text-destructive mt-3">Something went wrong. Please try again.</p>}
      {res?.error && <p className="text-sm text-destructive mt-3">{res.error}</p>}
      {res && !res.error && res.matches.length === 0 && <p className="text-sm text-muted-foreground mt-3">No close match in your vault yet — try different words, or add a dua for this.</p>}
      {res && res.matches.length > 0 && (
        <ul className="mt-4 space-y-3">
          {res.matches.map((m) => {
            const d = byId.get(m.id);
            if (!d) return null;
            return (
              <li key={m.id} className="rounded-2xl bg-background ring-1 ring-border p-4">
                <p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">{d.category}</p>
                <p className="font-serif text-lg">{d.title}</p>
                {d.arabic && <p dir="rtl" className="text-xl mt-1">{d.arabic}</p>}
                 {d.transliteration && <p className="text-sm mt-2 italic text-muted-foreground">{d.transliteration}</p>}
                {d.translation && <p className="text-sm mt-1">{d.translation}</p>}
                 <div className="mt-3">
                   <DuaAudio arabic={d.arabic} transliteration={d.transliteration} translation={d.translation} />
                 </div>
                <p className="text-xs text-muted-foreground mt-2 italic">{m.reason}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
