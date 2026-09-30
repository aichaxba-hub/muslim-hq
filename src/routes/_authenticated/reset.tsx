import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/reset")({
head: () => ({ meta: [
    { title: "Reset & Realign — Muslim HQ" },
    { name: "description", content: "A gentle guided reset to pause, reflect, and realign your worship rhythms." },
    { property: "og:title", content: "Reset & Realign — Muslim HQ" },
    { property: "og:description", content: "A gentle guided reset to pause, reflect, and realign your worship rhythms." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPage,
});

function ResetPage() {
  const [a, setA] = useState({ pulled: "", simplify: "", matters: "", step: "" });
  const set = (k: string, v: string) => setA({ ...a, [k]: v });

  return (
    <AppShell>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium">Reset & Realign</p>
        <h1 className="font-serif text-5xl md:text-6xl mt-3 text-balance">You are not behind.</h1>
        <p className="font-serif text-3xl italic text-[color:var(--sage)] mt-2">You are being brought back.</p>
      </div>

      <Card className="mb-6">
        {[
          ["pulled", "What pulled me away?"],
          ["simplify", "What can I simplify?"],
          ["matters", "What matters most right now?"],
          ["step", "One small step today."],
        ].map(([k, l]) => (
          <div key={k} className="mb-4">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{l}</label>
            <textarea rows={2} value={(a as any)[k]} onChange={e => set(k, e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          </div>
        ))}
      </Card>

      <div className="text-center">
        <Link to="/worship"><Button variant="gold">Start fresh today →</Button></Link>
      </div>
    </AppShell>
  );
}
