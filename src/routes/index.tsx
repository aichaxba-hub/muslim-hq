import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Muslim HQ — The Ultimate Islamic System" },
      { name: "description", content: "A calm, all-in-one Islamic life dashboard. Track prayers, Quran, fasting, dhikr, duas, goals and reflection. Your deen, your pace." },
      { property: "og:title", content: "Muslim HQ — The Ultimate Islamic System" },
      { property: "og:description", content: "A calm, all-in-one Islamic life dashboard. Your deen, your pace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Landing() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);
  if (authed) { window.location.replace("/dashboard"); return null; }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <header className="flex items-center justify-between mb-20">
          <span className="font-serif text-2xl">Muslim <span className="text-[color:var(--gold)]">HQ</span></span>
          <div className="flex gap-2 text-sm">
            <Link to="/start" className="px-4 py-2 rounded-full ring-1 ring-border hover:bg-muted">Start Here</Link>
            <Link to="/auth" className="px-4 py-2 rounded-full bg-primary text-primary-foreground">Sign in</Link>
          </div>
        </header>

        <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium mb-4">Peace be upon you</p>
        <h1 className="text-5xl md:text-7xl font-serif leading-[0.95] text-balance max-w-3xl">
          Your deen. Your pace. <span className="italic text-[color:var(--sage)]">One prayer at a time.</span>
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-xl">
          A calm, all-in-one system for salah, Quran, fasting, dhikr, duas, goals and reflection.
          Built for consistency — not perfection.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/auth" className="px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin your journey</Link>
          <Link to="/start" className="px-6 py-3 rounded-full ring-1 ring-border text-sm font-medium">Read Start Here</Link>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-4">
          {[
            { t: "Track", d: "Salah, Quran, fasting, dhikr, sadaqah — all in one place." },
            { t: "Reflect", d: "Weekly journaling guided by prompts that soften the heart." },
            { t: "Realign", d: "Reset without shame. You are not behind — you are being brought back." },
          ].map(x => (
            <div key={x.t} className="rounded-3xl bg-card ring-1 ring-border p-6">
              <h3 className="font-serif text-2xl">{x.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
