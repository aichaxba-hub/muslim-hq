import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { computeTimes, DEFAULT_COORDS, formatTime, nextPrayer, PRAYERS, PRAYER_LABEL, type Coords } from "@/lib/prayer-times";

export const Route = createFileRoute("/offline")({
  head: () => ({ meta: [
    { title: "Offline Prayer Times & Dhikr — Muslim HQ" },
    { name: "description", content: "Prayer times and a dhikr counter that keep working without an internet connection." },
    { property: "og:title", content: "Offline Prayer Times & Dhikr — Muslim HQ" },
    { property: "og:description", content: "Prayer times and dhikr counting, even offline." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OfflinePage,
});

const PRESETS = ["SubhanAllah", "Alhamdulillah", "Allahu Akbar", "Astaghfirullah", "La ilaha illallah"];

function OfflinePage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [online, setOnline] = useState(true);
  const [phrase, setPhrase] = useState(PRESETS[0]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    try { setCoords(JSON.parse(localStorage.getItem("mhq-coords") ?? "null") ?? DEFAULT_COORDS); } catch { setCoords(DEFAULT_COORDS); }
    try { setCounts(JSON.parse(localStorage.getItem("mhq-offline-dhikr") ?? "{}")); } catch { /* empty */ }
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  function bump(delta: number) {
    const next = { ...counts, [phrase]: Math.max(0, (counts[phrase] ?? 0) + delta) };
    setCounts(next);
    localStorage.setItem("mhq-offline-dhikr", JSON.stringify(next));
  }

  const times = coords ? computeTimes(coords) : null;
  const upcoming = coords ? nextPrayer(coords) : null;

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--sage)]">{online ? "You're online" : "You're offline"}</p>
        <h1 className="font-serif text-4xl mt-1">Muslim <span className="text-[color:var(--gold)]">HQ</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Prayer times and dhikr work here without internet.</p>
        {online && <Link to="/dashboard" className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4">Back to your dashboard</Link>}

        <section className="mt-8 rounded-3xl bg-card p-6 ring-1 ring-border">
          <h2 className="font-serif text-2xl">Today's prayers</h2>
          <p className="text-xs text-muted-foreground">{coords?.label || "Makkah (set your location in Profile while online)"}</p>
          <ul className="mt-4 divide-y divide-border">
            {times && PRAYERS.map(p => (
              <li key={p} className={`flex justify-between py-2 text-sm ${upcoming?.name === p ? "font-semibold text-primary" : ""}`}>
                <span>{PRAYER_LABEL[p]}</span><span>{formatTime(times[p])}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-3xl bg-card p-6 ring-1 ring-border text-center">
          <h2 className="font-serif text-2xl">Dhikr counter</h2>
          <select aria-label="Dhikr phrase" value={phrase} onChange={e => setPhrase(e.target.value)} className="mt-3 w-full h-11 rounded-xl bg-background px-3 ring-1 ring-border">
            {PRESETS.map(p => <option key={p}>{p}</option>)}
          </select>
          <button onClick={() => bump(1)} className="mt-5 size-44 rounded-full bg-primary text-primary-foreground font-serif text-5xl shadow-inner active:scale-95 transition" aria-label={`Count ${phrase}`}>
            {counts[phrase] ?? 0}
          </button>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            <button onClick={() => bump(-1)} className="rounded-full px-4 py-1.5 ring-1 ring-border">−1</button>
            <button onClick={() => bump(-(counts[phrase] ?? 0))} className="rounded-full px-4 py-1.5 ring-1 ring-border">Reset</button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Saved on this device.</p>
        </section>
      </div>
    </main>
  );
}
