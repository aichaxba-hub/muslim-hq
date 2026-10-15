import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/AppShell";
import { autocompletePlaces } from "@/lib/places.functions";


type Suggestion = { placeId: string; text: string };

function LocationField({ location, setLocation, fields }: { location: string; setLocation: (value: string) => void; fields: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());
  const requestId = useRef(0);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    const query = location.trim();
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const { suggestions: results } = await autocompletePlaces({ data: { input: query, sessionToken: sessionToken.current } });
        if (id !== requestId.current) return;
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        if (id !== requestId.current) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);

  const pick = (suggestion: Suggestion) => {
    skipNextSearch.current = true;
    setLocation(suggestion.text);
    setSuggestions([]);
    setOpen(false);
    sessionToken.current = crypto.randomUUID();
  };

  return (
    <div className="relative grid gap-2 text-sm">
      <label htmlFor="fitr-location">City, country, region or zip code</label>
      <input
        id="fitr-location"
        className={fields}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing your city or region"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="fitr-location-suggestions"
        aria-autocomplete="list"
      />
      {searching && <p className="text-xs text-muted-foreground">Searching places…</p>}
      {open && (
        <ul id="fitr-location-suggestions" role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg bg-popover ring-1 ring-border shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={location === suggestion.text}
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(suggestion)}
              >
                {suggestion.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StepNote({ label, children }: { label: string; children: string }) {
  return (
    <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground ring-1 ring-border">
      <span className="font-medium text-foreground">{label}</span> {children}
    </p>
  );
}

export function FitrCalculator() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [household, setHousehold] = useState(1);
  const [income, setIncome] = useState<"low" | "medium" | "high">("medium");
  const [prices] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState<"conservative" | "standard">("conservative");
  const weightKg = weight === "conservative" ? 3 : 2.2;
  const chosen = income === "low" ? "Wheat flour" : income === "medium" ? "Black beans" : "Barley";
  const total = (prices[chosen] ?? 0) * weightKg * household;
  const fields = "h-11 w-full rounded-lg bg-background px-3 ring-1 ring-border";
  return <section className="mb-8 border-t border-border pt-8" aria-label="Zakat al-Fitr calculator">
    <div className="mb-5"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Ramadan giving</p><h2 className="font-serif text-3xl">Zakat al-Fitr calculator</h2><p className="mt-2 text-sm text-muted-foreground">Estimate one saa of staple food per person, using local food prices you enter.</p></div>
    <div className="mb-5 rounded-xl bg-muted/60 px-4 py-3.5 ring-1 ring-border">
      <h3 className="font-serif text-lg text-foreground">What is a Sa'a?</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">A Sa'a (also spelled Sa' or Saa') is a traditional Arabian volume unit used to measure staple food items for Zakat al-Fitr.</p>
    </div>
    <div className="mb-5 flex flex-wrap gap-2">{["Location", "Household", "Income level", "Saa Weight"].map((label, index) => <Button key={label} variant="ghost" className={step === index ? "bg-muted" : ""} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined}>{index + 1}. {label}</Button>)}</div>
    <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="space-y-4">
        {step === 0 && <><h3 className="font-serif text-2xl">Your location</h3><LocationField location={location} setLocation={setLocation} fields={fields} /><StepNote label="Why we ask:">Your location helps us determine the appropriate food staple and pricing for your Zakat al-Fitr calculation.</StepNote></>}
        {step === 1 && <><h3 className="font-serif text-2xl">Your household</h3><label className="grid gap-2 text-sm">People you are giving for (including yourself)<input className={fields} type="number" min="1" step="1" value={household} onChange={e => setHousehold(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label><StepNote label="Remember:">Zakat al-Fitr is obligatory for every Muslim who possesses enough food for themselves and their dependents for the day of Eid.</StepNote></>}
        {step === 2 && <><h3 className="font-serif text-2xl">Income level</h3><div className="grid gap-2">{[["low", "Low Income", "Household monthly income below $2,723 USD", "Wheat flour"], ["medium", "Medium Income", "Household monthly income $2,723 - $8,170 USD", "Black beans"], ["high", "High Income", "Household monthly income above $8,170 USD", "Barley"]].map(([value, title, range, food]) => <button key={value} type="button" onClick={() => setIncome(value as typeof income)} aria-pressed={income === value} className={`rounded-xl px-4 py-3 text-left ring-1 transition ${income === value ? "bg-muted ring-2 ring-primary" : "bg-background ring-border hover:bg-muted/60"}`}><span className="block text-sm font-medium text-foreground">{title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{range}</span><span className="mt-1.5 block text-xs font-medium text-foreground">Recommended: {food}</span></button>)}</div><StepNote label="Food selection:">Different food staples are recommended based on income level, following traditional Islamic jurisprudence.</StepNote></>}
        {step === 3 && <><h3 className="font-serif text-2xl">Saa Weight</h3><div className="grid max-w-sm grid-cols-2 gap-2">{[["conservative", "3.0 kg", "Conservative"], ["standard", "2.2 kg", "Standard"]].map(([value, kg, label]) => <button key={value} type="button" role="radio" aria-checked={weight === value} onClick={() => setWeight(value as typeof weight)} className={`rounded-xl px-4 py-3 text-center ring-1 transition ${weight === value ? "bg-[color:var(--gold)] text-[color:var(--sage-deep)] ring-2 ring-[color:var(--gold)]" : "bg-background ring-border hover:bg-muted/60"}`}><span className="block text-base font-semibold">{kg}</span><span className="mt-0.5 block text-xs opacity-80">{label}</span></button>)}</div><p className="mt-3 text-sm text-muted-foreground">3.0 kg safely exceeds all scholarly estimates. 2.2 kg follows the majority position.</p></>}
        <div className="flex justify-between border-t border-border pt-4"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Previous</Button><Button disabled={step === 3} onClick={() => setStep(s => s + 1)}>Next</Button></div>
      </div>
      <aside className="border-t border-border pt-5 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Running summary</p><dl className="mt-3 space-y-2">{[["Location", location || "—"], ["Household", `${household} ${household === 1 ? "person" : "people"}`], ["Food", chosen || "—"], ["Saa weight", `${weightKg} kg per person`], ["Price per kg", prices[chosen] ? Number(prices[chosen]).toFixed(2) : "—"]].map(([label,value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>)}</dl><div className="mt-5 border-t border-border pt-4"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Estimated amount</p><strong className="font-serif text-3xl">{total > 0 ? total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}</strong><p className="text-xs text-muted-foreground">Note: Prices are researched from government and market data sources and updated annually before Ramadan.</p></div><p className="mt-4 text-xs text-muted-foreground">Food prices, saa weights and cash equivalents differ locally. Confirm the amount and giving method with a trusted local organization.</p></aside>
    </div>
  </section>;
}