import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Wheat } from "lucide-react";
import { Button, Card } from "@/components/AppShell";
import { autocompletePlaces } from "@/lib/places.functions";
import { FITR_PRICES, FITR_PRICE_AS_OF, FITR_PRICE_SOURCE } from "@/lib/fitr-prices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { refreshSchedule } from "@/lib/fitr-refresh";

const STEPS = ["Location", "Household", "Income level", "Weight", "Review"] as const;

const INCOME_OPTIONS = [
  ["low", "Low Income", "Household monthly income below $2,723 USD", "Wheat flour"],
  ["medium", "Medium Income", "Household monthly income $2,723 - $8,170 USD", "Black beans"],
  ["high", "High Income", "Household monthly income above $8,170 USD", "Barley"],
] as const;

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
    <div className="relative grid gap-1.5 text-sm font-medium">
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
      {searching && <p className="text-xs font-normal text-muted-foreground">Searching places…</p>}
      {open && (
        <ul id="fitr-location-suggestions" role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg bg-popover ring-1 ring-border shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={location === suggestion.text}
                className="block w-full px-3 py-2.5 text-left text-sm font-normal hover:bg-muted focus:bg-muted focus:outline-none"
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
    <p className="rounded-lg bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">{label}</span> {children}
    </p>
  );
}

export function FitrCalculator() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [household, setHousehold] = useState(1);
  const [income, setIncome] = useState<"low" | "medium" | "high">("medium");
  const [weight, setWeight] = useState<"conservative" | "standard">("conservative");
  const weightKg = weight === "conservative" ? 3 : 2.2;
  const chosen = income === "low" ? "Wheat flour" : income === "medium" ? "Black beans" : "Barley";
  const { data: livePrices } = useQuery({ queryKey: ["fitr-prices"], queryFn: async () => (await supabase.from("fitr_prices").select("food, price_per_kg, as_of")).data ?? [] });
  const liveRow = livePrices?.find((r) => r.food === chosen);
  const pricePerKg = liveRow ? Number(liveRow.price_per_kg) : (FITR_PRICES[chosen] ?? 0);
  const priceAsOf = livePrices?.[0]?.as_of ?? FITR_PRICE_AS_OF;
  const nextRefresh = refreshSchedule().refreshOn.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const total = pricePerKg * weightKg * household;
  const fields = "h-11 w-full rounded-lg bg-background px-3 ring-1 ring-border";
  const money = (value: number) => value.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function reset() {
    setLocation("");
    setHousehold(1);
    setIncome("medium");
    setWeight("conservative");
    setStep(0);
  }

  return (
    <Card className="mb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]"><Wheat className="size-4" /> Ramadan giving</p>
          <h2 className="font-serif text-3xl">Zakat al-Fitr calculator</h2>
          <p className="mt-1 text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <Button variant="ghost" className="self-start" onClick={reset}><RotateCcw className="mr-2 inline size-4" /> Reset</Button>
      </div>

      <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${Math.round((step + 1) / STEPS.length * 100)}% through Zakat al-Fitr calculator`}>
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(step + 1) / STEPS.length * 100}%` }} />
      </div>

      <div className="mb-7 rounded-lg bg-muted p-4">
        <h3 className="text-sm font-medium">What is a Sa'a?</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">A Sa'a (also spelled Sa' or Saa') is a traditional Arabian volume unit used to measure staple food items for Zakat al-Fitr.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2 pb-1">
            {STEPS.map((label, index) => (
              <Button key={label} type="button" variant="ghost" className={`h-9 shrink-0 px-3 ${index === step ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setStep(index)} aria-current={index === step ? "step" : undefined}>
                {index < step ? <Check className="mr-1.5 inline size-3.5" /> : <span className="mr-1.5">{index + 1}</span>}{label}
              </Button>
            ))}
          </div>

          {step === 0 && (
            <section className="space-y-5" aria-labelledby="fitr-step-title">
              <div><h3 id="fitr-step-title" className="font-serif text-2xl">Your location</h3><p className="mt-1 text-sm text-muted-foreground">Where you live decides which staple food fits your area and what it costs there.</p></div>
              <LocationField location={location} setLocation={setLocation} fields={fields} />
              <StepNote label="Why we ask:">Your location helps us determine the appropriate food staple and pricing for your Zakat al-Fitr calculation.</StepNote>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5" aria-labelledby="fitr-step-title">
              <div><h3 id="fitr-step-title" className="font-serif text-2xl">Your household</h3><p className="mt-1 text-sm text-muted-foreground">One saa of staple food is given for each person you provide for.</p></div>
              <label className="grid max-w-xs gap-1.5 text-sm font-medium">People you are giving for (including yourself)<input className={fields} type="number" min="1" step="1" value={household} onChange={e => setHousehold(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label>
              <StepNote label="Remember:">Zakat al-Fitr is obligatory for every Muslim who possesses enough food for themselves and their dependents for the day of Eid.</StepNote>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5" aria-labelledby="fitr-step-title">
              <div><h3 id="fitr-step-title" className="font-serif text-2xl">Income level</h3><p className="mt-1 text-sm text-muted-foreground">Choose the band your household monthly income falls into and we will suggest the matching staple.</p></div>
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-medium">Household monthly income</legend>
                {INCOME_OPTIONS.map(([value, title, range, food]) => (
                  <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${income === value ? "border-primary bg-muted" : "border-border"}`}>
                    <input className="mt-0.5" type="radio" name="fitr-income" value={value} checked={income === value} onChange={() => setIncome(value as typeof income)} />
                    <span><span className="block font-medium">{title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{range}</span><span className="mt-1 block text-xs">Recommended: {food}</span></span>
                  </label>
                ))}
              </fieldset>
              <StepNote label="Food selection:">Different food staples are recommended based on income level, following traditional Islamic jurisprudence.</StepNote>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5" aria-labelledby="fitr-step-title">
              <div><h3 id="fitr-step-title" className="font-serif text-2xl">Weight</h3><p className="mt-1 text-sm text-muted-foreground">Choose how much one saa should weigh for you.</p></div>
              <div className="grid max-w-sm grid-cols-2 gap-2">{[["conservative", "3.0 kg", "Conservative"], ["standard", "2.2 kg", "Standard"]].map(([value, kg, label]) => <button key={value} type="button" role="radio" aria-checked={weight === value} onClick={() => setWeight(value as typeof weight)} className={`rounded-xl px-4 py-3 text-center ring-1 transition ${weight === value ? "bg-[color:var(--gold)] text-[color:var(--sage-deep)] ring-2 ring-[color:var(--gold)]" : "bg-background ring-border hover:bg-muted/60"}`}><span className="block text-base font-semibold">{kg}</span><span className="mt-0.5 block text-xs opacity-80">{label}</span></button>)}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">3.0 kg safely exceeds all scholarly estimates. 2.2 kg follows the majority position.</p>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-5" aria-labelledby="fitr-step-title">
              <div><h3 id="fitr-step-title" className="font-serif text-2xl">Review your Zakat al-Fitr</h3><p className="mt-1 text-sm text-muted-foreground">Check each answer before you finalize the amount.</p></div>
              <dl className="grid gap-2.5 rounded-lg bg-muted p-4 text-sm">{[["Location", location || "Not entered"], ["People you are giving for", `${household} ${household === 1 ? "person" : "people"} (including yourself)`], ["Income level", income === "low" ? "Low Income (below $2,723/month)" : income === "medium" ? "Medium Income ($2,723 – $8,170/month)" : "High Income (above $8,170/month)"], ["Recommended staple", chosen], ["Saa weight", `${weightKg.toFixed(1)} kg per person (${weight === "conservative" ? "Conservative" : "Standard"})`], ["Price per kilogram", pricePerKg ? `$${pricePerKg.toFixed(2)} USD` : "—"], ["Total food weight", `${(weightKg * household).toFixed(1)} kg`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>
              <div className="rounded-lg border border-primary bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">Your Zakat al-Fitr amount</p>
                <p className="mt-1 font-serif text-4xl">{total > 0 ? money(total) : "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{household} {household === 1 ? "person" : "people"} × {weightKg.toFixed(1)} kg × ${pricePerKg.toFixed(2)}/kg of {chosen.toLowerCase()}. Prices as of {priceAsOf}; next refresh {nextRefresh}, 30 days before Ramadan.</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">If anything looks off, use the steps above to adjust it — your amount updates instantly. Confirm the amount and giving method with a trusted local organization before paying.</p>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}><ArrowLeft className="mr-2 inline size-4" /> Previous</Button>
            {step < STEPS.length - 1 && <Button onClick={() => setStep(value => Math.min(STEPS.length - 1, value + 1))}>Continue <ArrowRight className="ml-2 inline size-4" /></Button>}
          </div>
        </div>

        <aside className="self-start border-t border-border pt-6 lg:sticky lg:top-28 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" aria-label="Running Zakat al-Fitr summary">
          <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">Running summary</p>
          <div className="mt-4 space-y-2 text-sm">{[["Location", location || "—"], ["Household", `${household} ${household === 1 ? "person" : "people"}`], ["Food", chosen || "—"], ["Saa weight", `${weightKg.toFixed(1)} kg per person`], ["Price per kg", pricePerKg ? `$${pricePerKg.toFixed(2)}` : "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>)}</div>
          <div className="my-4 border-t border-border" />
          <div className="space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Total food weight</span><strong>{(weightKg * household).toFixed(1)} kg</strong></div></div>
          <div className="mt-5 rounded-lg bg-muted p-4"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Estimated amount</p><p className="mt-1 font-serif text-3xl">{total > 0 ? money(total) : "—"}</p></div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Note: Prices are researched from government and market data sources and updated annually before Ramadan. {FITR_PRICE_SOURCE} Prices as of {priceAsOf}. All amounts in US dollars. Next refresh: {nextRefresh}, 30 days before Ramadan.</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Food prices, saa weights and cash equivalents differ locally. Confirm the amount and giving method with a trusted local organization.</p>
        </aside>
      </div>
    </Card>
  );
}
