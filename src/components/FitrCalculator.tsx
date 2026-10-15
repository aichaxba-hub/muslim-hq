import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/AppShell";
import { autocompletePlaces } from "@/lib/places.functions";

const foods = ["Wheat flour", "Rice", "Maize flour", "Barley", "Black beans"];

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
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState(3);
  const chosen = income === "low" ? "Wheat flour" : income === "medium" ? "Black beans" : "Barley";
  const total = (prices[chosen] ?? 0) * weight * household;
  const fields = "h-11 w-full rounded-lg bg-background px-3 ring-1 ring-border";
  return <section className="mb-8 border-t border-border pt-8" aria-label="Zakat al-Fitr calculator">
    <div className="mb-5"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Ramadan giving</p><h2 className="font-serif text-3xl">Zakat al-Fitr calculator</h2><p className="mt-2 text-sm text-muted-foreground">Estimate one saa of staple food per person, using local food prices you enter.</p></div>
    <div className="mb-5 rounded-xl bg-muted/60 px-4 py-3.5 ring-1 ring-border">
      <h3 className="font-serif text-lg text-foreground">What is a Sa'a?</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">A Sa'a (also spelled Sa' or Saa') is a traditional Arabian volume unit used to measure staple food items for Zakat al-Fitr.</p>
    </div>
    <div className="mb-5 flex flex-wrap gap-2">{["Location", "Household", "Income level", "Review"].map((label, index) => <Button key={label} variant="ghost" className={step === index ? "bg-muted" : ""} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined}>{index + 1}. {label}</Button>)}</div>
    <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="space-y-4">
        {step === 0 && <><h3 className="font-serif text-2xl">Your location</h3><LocationField location={location} setLocation={setLocation} fields={fields} /><StepNote label="Why we ask:">Your location helps us determine the appropriate food staple and pricing for your Zakat al-Fitr calculation.</StepNote><p className="text-xs text-muted-foreground">Suggestions appear as you type — pick yours, or keep typing freely. Use retail prices from shops in your area; prices are not fetched automatically.</p></>}
        {step === 1 && <><h3 className="font-serif text-2xl">Your household</h3><label className="grid gap-2 text-sm">People you are giving for<input className={fields} type="number" min="1" step="1" value={household} onChange={e => setHousehold(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label><label className="grid gap-2 text-sm">Kilograms per person (one saa estimate)<input className={fields} type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(Math.max(0.1, Number(e.target.value) || 0.1))} /></label><StepNote label="Remember:">Zakat al-Fitr is obligatory for every Muslim who possesses enough food for themselves and their dependents for the day of Eid.</StepNote></>}
        {step === 2 && <><h3 className="font-serif text-2xl">Choose a food</h3><div className="flex gap-2"><Button variant={method === "food" ? "primary" : "ghost"} onClick={() => setMethod("food")}>Choose food</Button><Button variant={method === "income" ? "primary" : "ghost"} onClick={() => setMethod("income")}>Income-based</Button></div>{method === "food" ? <label className="grid gap-2 text-sm">Staple food<select className={fields} value={selectedFood} onChange={e => setSelectedFood(e.target.value)}>{foods.map(food => <option key={food}>{food}</option>)}</select></label> : <label className="grid gap-2 text-sm">Income level<select className={fields} value={income} onChange={e => setIncome(e.target.value as typeof income)}><option value="low">Lower</option><option value="medium">Middle</option><option value="high">Higher</option></select></label>}<StepNote label="Food selection:">Different food staples are recommended based on income level, following traditional Islamic jurisprudence.</StepNote><p className="text-xs text-muted-foreground">Income-based picks the lowest, second-highest or highest priced food among the prices you provide.</p></>}
        {step === 3 && <><h3 className="font-serif text-2xl">Local food prices</h3><p className="text-sm text-muted-foreground">Enter the retail price per kilogram in your local currency. Only entered prices are used.</p><div className="grid gap-3 sm:grid-cols-2">{foods.map(food => <label key={food} className="grid gap-1.5 text-sm">{food} / kg<input className={fields} type="number" min="0" step="0.01" placeholder="Price per kg" value={prices[food] || ""} onChange={e => setPrices(current => ({ ...current, [food]: Math.max(0, Number(e.target.value) || 0) }))} /></label>)}</div></>}
        <div className="flex justify-between border-t border-border pt-4"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Previous</Button><Button disabled={step === 3} onClick={() => setStep(s => s + 1)}>Next</Button></div>
      </div>
      <aside className="border-t border-border pt-5 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Running summary</p><dl className="mt-3 space-y-2">{[["Location", location || "—"], ["Household", `${household} ${household === 1 ? "person" : "people"}`], ["Food", chosen || "—"], ["Saa weight", `${weight} kg per person`], ["Price per kg", prices[chosen] ? Number(prices[chosen]).toFixed(2) : "—"]].map(([label,value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>)}</dl><div className="mt-5 border-t border-border pt-4"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Estimated amount</p><strong className="font-serif text-3xl">{total > 0 ? total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}</strong><p className="text-xs text-muted-foreground">In the same currency as your entered food prices</p></div><p className="mt-4 text-xs text-muted-foreground">Food prices, saa weights and cash equivalents differ locally. Confirm the amount and giving method with a trusted local organization.</p></aside>
    </div>
  </section>;
}