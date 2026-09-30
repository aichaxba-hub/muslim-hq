import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/start")({
head: () => ({ meta: [
    { title: "Start Here — Muslim HQ" },
    { name: "description", content: "A gentle 3-day starter plan for using Muslim HQ." },
    { property: "og:title", content: "Start Here — Muslim HQ" },
    { property: "og:description", content: "A gentle 3-day starter plan for building your worship rhythm with Muslim HQ." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: StartHere,
});

function StartHere() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-sm text-muted-foreground">← Muslim HQ</Link>
        <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium mt-8">Start Here</p>
        <h1 className="font-serif text-5xl mt-3 text-balance">Your deen, your pace.</h1>
        <p className="text-lg text-muted-foreground mt-4">Muslim HQ is a gentle system for consistency — not perfection. Here's how to use it.</p>

        <Section title="What this system is">
          <p>A private dashboard for your worship, reflection, and growth. Nothing is ever shared. Everything is optional.</p>
        </Section>

        <Section title="How to use it daily (5 minutes)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open the dashboard after Fajr — set a small intention.</li>
            <li>After each salah, tap its status. Nothing more.</li>
            <li>Before sleep, note dhikr and one line of reflection.</li>
          </ol>
        </Section>

        <Section title="Where to start">
          <p>Only the Daily Salah Log. That's it. Add more when it feels natural.</p>
        </Section>

        <Section title="What NOT to do">
          <p>Do not try to fill every field on day one. Do not chase streaks — chase presence. Do not use this as a scoreboard against yourself.</p>
        </Section>

        <Section title="Your 3-day starter plan">
          <ul className="space-y-2">
            <li><strong>Day 1</strong> — Log your 5 salah only.</li>
            <li><strong>Day 2</strong> — Add one Quran session (even 1 page).</li>
            <li><strong>Day 3</strong> — Add a 3-line reflection before sleep.</li>
          </ul>
        </Section>

        <div className="mt-12 flex gap-3">
          <Link to="/auth" className="px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Sign in and begin</Link>
          <Link to="/tutorial" className="px-5 py-3 rounded-full ring-1 ring-border text-sm font-medium">See the tutorial</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="font-serif text-2xl mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
