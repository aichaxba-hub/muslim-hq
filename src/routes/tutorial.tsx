import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tutorial")({
  head: () => ({ meta: [{ title: "Tutorial — Muslim HQ" }] }),
  component: Tutorial,
});

const sections = [
  { t: "How to log a day", d: "Open the dashboard. Under Today's Salah, use the dropdown next to each prayer: On time, Late, Qada, or Excused. Screenshot/video goes here." },
  { t: "How to track salah in depth", d: "Visit Worship. Log sunnah, nafl, congregation, and jummah. Add fasting and Quran details for the same day." },
  { t: "How to use the dua vault", d: "The vault comes seeded. Filter by category, tap the heart to favorite, or add your own duas." },
  { t: "How to check progress", d: "The Annual Review shows completion percentages, streaks, and monthly trend charts." },
  { t: "How to reset", d: "When it's been a hard week, open Reset & Realign. Four gentle prompts. Then start fresh." },
];

function Tutorial() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-sm text-muted-foreground">← Muslim HQ</Link>
        <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium mt-8">Tutorial</p>
        <h1 className="font-serif text-5xl mt-3">Walk through the system</h1>

        {sections.map(s => (
          <section key={s.t} className="mt-10">
            <h2 className="font-serif text-2xl mb-2">{s.t}</h2>
            <p className="text-muted-foreground">{s.d}</p>
            <div className="mt-4 aspect-video rounded-2xl bg-[color:var(--sand-soft)] ring-1 ring-border grid place-items-center text-xs uppercase tracking-widest text-muted-foreground">
              Screenshot / video placeholder
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
