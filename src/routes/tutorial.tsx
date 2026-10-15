import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/tutorial")({
  head: () => ({ meta: [
    { title: "Tutorial — Muslim HQ" },
    { name: "description", content: "A short interactive tour of Muslim HQ: the welcome questions and every tracker, from Salah to Giving." },
    { property: "og:title", content: "Tutorial — Muslim HQ" },
    { property: "og:description", content: "A short interactive tour of Muslim HQ: the welcome questions and every tracker, from Salah to Giving." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Tutorial,
});

type Step = { key: string; eyebrow: string; title: string; body: string; to?: string; tryIt?: string };

const STEPS: Step[] = [
  { key: "welcome", eyebrow: "When you sign up", title: "What would you like help with?", body: "Your first screen asks what you'd like help with. Tick as many as you like — each one becomes a goal you can track. Try it below.", tryIt: "Tap the goals that speak to you." },
  { key: "dashboard", eyebrow: "Dashboard", title: "Your day at a glance", body: "Today's prayer times, Hijri date, streaks and quick links. Everything starts here.", to: "/dashboard" },
  { key: "salah", eyebrow: "Salah", title: "Log each prayer", body: "Mark each fard prayer completed, plus sunnahs, nafl, jama'ah and masjid. Excused days never break your streak.", to: "/worship", tryIt: "Tap a prayer to mark it completed." },
  { key: "qada", eyebrow: "Qada", title: "Make up missed prayers", body: "Missed prayers land here automatically. Make them up oldest-first, one at a time.", to: "/qada" },
  { key: "quran", eyebrow: "Qur'an", title: "Read, listen and log", body: "Read with Mishary Alafasy's recitation, then log the surah and ayah range you completed.", to: "/quran" },
  { key: "fasting", eyebrow: "Fasting", title: "Track your fasts", body: "Log Ramadan, makeup, Mondays & Thursdays, Shawwal and more. Makeup fasts reduce the days you owe.", to: "/fasting" },
  { key: "dhikr", eyebrow: "Dhikr", title: "Count your remembrance", body: "Tap the counter or speak your dhikr, then save the session. Your streak counts days with a saved session.", to: "/dhikr", tryIt: "Tap the circle to count SubhanAllah." },
  { key: "duas", eyebrow: "Dua Vault", title: "Your private library", body: "Browse one category at a time, listen, favorite, add your own, and record duas Allah answered.", to: "/duas" },
  { key: "reflect", eyebrow: "Reflect", title: "Journal your heart", body: "Short prompts, an optional mood, and every entry saved privately.", to: "/reflections" },
  { key: "goals", eyebrow: "Goals", title: "Grow at your pace", body: "The goals you chose at sign-up live here. Move them from Not Started to Completed.", to: "/goals" },
  { key: "giving", eyebrow: "Giving", title: "Zakat, Fitr and Sadaqah", body: "Calculate Zakat with live gold and silver prices, work out Zakat al-Fitr, and log every gift.", to: "/zakat" },
  { key: "review", eyebrow: "Review", title: "See your growth", body: "Weekly, monthly, yearly and lifetime totals from every tracker, plus gentle AI reflections.", to: "/review" },
];

const GOALS = ["Pray consistently", "Make up missed prayers", "Read more Qur'an", "Build dhikr habits", "Fast more regularly", "Build better Islamic habits"];
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function Demo({ k }: { k: string }) {
  const [goals, setGoals] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  if (k === "welcome") return (
    <div className="grid gap-2">
      {GOALS.map(g => (
        <button key={g} type="button" aria-pressed={goals.includes(g)} onClick={() => toggle(goals, setGoals, g)}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm ring-1 transition ${goals.includes(g) ? "bg-[color:var(--gold)]/15 ring-[color:var(--gold)]" : "ring-border"}`}>
          <span className={`grid size-5 place-items-center rounded-full text-[10px] ring-1 ${goals.includes(g) ? "bg-[color:var(--gold)] text-primary-foreground ring-[color:var(--gold)]" : "ring-border"}`}>{goals.includes(g) ? "✓" : ""}</span>{g}
        </button>
      ))}
      <p className="text-xs text-muted-foreground">{goals.length ? `${goals.length} goal${goals.length > 1 ? "s" : ""} would be added to your Goals page.` : "Nothing chosen yet — you can also skip."}</p>
    </div>
  );
  if (k === "salah") return (
    <div className="flex flex-wrap gap-2">
      {PRAYERS.map(p => (
        <button key={p} type="button" aria-pressed={done.includes(p)} onClick={() => toggle(done, setDone, p)}
          className={`rounded-full px-4 py-2 text-sm ring-1 transition ${done.includes(p) ? "bg-primary text-primary-foreground ring-primary" : "ring-border"}`}>{p}</button>
      ))}
      <p className="w-full text-xs text-muted-foreground">{done.length === 5 ? "All five complete — your streak grows today." : `${done.length} of 5 completed`}</p>
    </div>
  );
  if (k === "dhikr") return (
    <div className="flex items-center gap-5">
      <button type="button" onClick={() => setCount(c => c + 1)} aria-label="Count SubhanAllah"
        className="grid size-24 place-items-center rounded-full bg-[color:var(--sage)]/15 font-serif text-3xl tabular-nums ring-1 ring-[color:var(--sage)]">{count}</button>
      <div className="text-sm"><p className="font-serif text-xl">SubhanAllah</p><p className="text-muted-foreground">{count >= 33 ? "33 reached — mashaAllah." : `${33 - count} to go`}</p>
        {count > 0 && <button type="button" onClick={() => setCount(0)} className="mt-1 text-xs text-muted-foreground hover:underline">Start over</button>}</div>
    </div>
  );
  return null;
}

function Tutorial() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="text-sm text-muted-foreground">← Muslim HQ</Link>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--sage)]">Tutorial · Step {i + 1} of {STEPS.length}</p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-[color:var(--gold)] transition-all" style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} />
        </div>

        <nav aria-label="Tour steps" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, n) => (
            <button key={s.key} type="button" onClick={() => setI(n)} aria-current={n === i ? "step" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 ring-border ${n === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{s.eyebrow}</button>
          ))}
        </nav>

        <section key={step.key} className="mt-6 rounded-3xl bg-card p-7 ring-1 ring-border">
          <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">{step.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl">{step.title}</h1>
          <p className="mt-3 text-muted-foreground">{step.body}</p>
          {step.tryIt && (
            <div className="mt-6 rounded-2xl bg-muted/50 p-5">
              <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Try it · {step.tryIt}</p>
              <Demo k={step.key} />
            </div>
          )}
          {step.to && <Link to={step.to} className="mt-6 inline-block text-sm text-[color:var(--sage)] hover:underline">Open {step.eyebrow} →</Link>}
        </section>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full px-5 py-2.5 text-sm ring-1 ring-border disabled:opacity-40">Back</button>
          {last
            ? <Link to="/auth" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Start your journey</Link>
            : <button type="button" onClick={() => setI(i + 1)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Next</button>}
        </div>
      </div>
    </div>
  );
}
