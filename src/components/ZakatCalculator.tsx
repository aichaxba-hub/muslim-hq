import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Coins, RotateCcw, Save } from "lucide-react";
import { Button, Card } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMetalPrices } from "@/lib/metal-prices.functions";

const STORAGE_KEY = "mhq-zakat-calculator";

const STEPS = [
  "Nisab",
  "Precious metals",
  "Cash",
  "Investments",
  "Retirement",
  "Other assets",
  "Debts & expenses",
] as const;

const CURRENCIES = [
  ["USD", "$", "US Dollar"], ["EUR", "€", "Euro"], ["GBP", "£", "British Pound"],
  ["CHF", "CHF", "Swiss Franc"], ["JPY", "¥", "Japanese Yen"], ["CNY", "¥", "Chinese Yuan"],
  ["SGD", "S$", "Singapore Dollar"],
  ["CAD", "C$", "Canadian Dollar"], ["AUD", "A$", "Australian Dollar"], ["AED", "د.إ", "UAE Dirham"],
  ["SAR", "﷼", "Saudi Riyal"], ["MYR", "RM", "Malaysian Ringgit"], ["IDR", "Rp", "Indonesian Rupiah"],
  ["PKR", "₨", "Pakistani Rupee"], ["TRY", "₺", "Turkish Lira"], ["BDT", "৳", "Bangladeshi Taka"],
  ["ZAR", "R", "South African Rand"], ["NGN", "₦", "Nigerian Naira"], ["EGP", "E£", "Egyptian Pound"],
] as const;

const NISAB_OPTIONS = {
  jamhoor_silver: { label: "Majority · Silver (595g)", metal: "silver", grams: 595 },
  jamhoor_gold: { label: "Majority · Gold (85g)", metal: "gold", grams: 85 },
} as const;

type NisabKey = keyof typeof NISAB_OPTIONS;
type ToggleChoice = "defer" | "now";

type CalculatorState = {
  currency: string;
  hawlDate: string;
  nisabStandard: NisabKey;
  goldPrice: number;
  silverPrice: number;
  goldGrams: number;
  silverGrams: number;
  cashInHand: number;
  checking: number;
  savings: number;
  otherCash: number;
  shortInvestments: number;
  longInvestments: number;
  employerRetirement: number;
  employerRetirementChoice: ToggleChoice;
  traditionalIra: number;
  traditionalIraChoice: ToggleChoice;
  rothContributions: number;
  crypto: number;
  collectibles: number;
  businessAssets: number;
  businessCash: number;
  businessInventory: number;
  businessReceivables: number;
  businessLiabilities: number;
  goodDebt: number;
  otherAssets: number;
  dueDebts: number;
  currentExpenses: number;
};

const initialState: CalculatorState = {
  currency: "USD",
  hawlDate: new Date().toISOString().slice(0, 10),
  nisabStandard: "jamhoor_silver",
  goldPrice: 0,
  silverPrice: 0,
  goldGrams: 0,
  silverGrams: 0,
  cashInHand: 0,
  checking: 0,
  savings: 0,
  otherCash: 0,
  shortInvestments: 0,
  longInvestments: 0,
  employerRetirement: 0,
  employerRetirementChoice: "defer",
  traditionalIra: 0,
  traditionalIraChoice: "defer",
  rothContributions: 0,
  crypto: 0,
  collectibles: 0,
  businessAssets: 0,
  businessCash: 0,
  businessInventory: 0,
  businessReceivables: 0,
  businessLiabilities: 0,
  goodDebt: 0,
  otherAssets: 0,
  dueDebts: 0,
  currentExpenses: 0,
};

function AmountInput({ label, hint, value, symbol, onChange }: {
  label: string;
  hint?: string;
  value: number;
  symbol: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <span className="flex h-11 items-center rounded-lg bg-background px-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
        <span className="mr-2 text-sm text-muted-foreground">{symbol}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ""}
          placeholder="0.00"
          onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="h-full min-w-0 flex-1 bg-transparent text-right outline-none"
        />
      </span>
    </label>
  );
}

function Choice({ value, onChange }: { value: ToggleChoice; onChange: (value: ToggleChoice) => void }) {
  return (
    <div className="flex w-fit rounded-lg bg-muted p-1" aria-label="Retirement Zakat timing">
      {(["defer", "now"] as const).map(option => (
        <Button
          key={option}
          type="button"
          variant="ghost"
          aria-pressed={value === option}
          className={`h-8 px-3 ring-0 ${value === option ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          onClick={() => onChange(option)}
        >
          {option === "defer" ? "Defer" : "Pay now"}
        </Button>
      ))}
    </div>
  );
}

export type ZakatCalculation = {
  currency: string;
  grossAssets: number;
  deductions: number;
  netZakatable: number;
  nisab: number;
  zakatDue: number;
};

export function ZakatCalculator({ onSave, saving }: { onSave: (result: ZakatCalculation) => void; saving?: boolean }) {
  const [step, setStep] = useState(0);
  const [calc, setCalc] = useState<CalculatorState>(initialState);
  const [restored, setRestored] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const metalFn = useServerFn(getMetalPrices);
  const metalPrices = useQuery({ queryKey: ["metal-prices", calc.currency], queryFn: () => metalFn({ data: { currency: calc.currency } }), staleTime: 15 * 60 * 1000, retry: false });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setCalc({ ...initialState, ...(JSON.parse(stored) as Partial<CalculatorState>) });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (restored) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calc));
  }, [calc, restored]);

  useEffect(() => {
    if (!restored || !metalPrices.data || !("gold" in metalPrices.data) || !("silver" in metalPrices.data)) return;
    // Spot feeds return many decimals; keep the filled-in values readable and still editable.
    if (!("gold" in metalPrices.data)) return;
    const { gold, silver } = metalPrices.data;
    const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;
    setCalc(current => ({
      ...current,
      goldPrice: gold != null ? round(gold, 2) : current.goldPrice,
      silverPrice: silver != null ? round(silver, 4) : current.silverPrice,
    }));
  }, [restored, metalPrices.data]);

  const symbol = CURRENCIES.find(item => item[0] === calc.currency)?.[1] ?? calc.currency;
  const result = useMemo<ZakatCalculation>(() => {
    const metals = calc.goldGrams * calc.goldPrice + calc.silverGrams * calc.silverPrice;
    const cash = calc.cashInHand + calc.checking + calc.savings + calc.otherCash;
    const investments = calc.shortInvestments + calc.longInvestments * 0.3;
    const retirement = (calc.employerRetirementChoice === "now" ? calc.employerRetirement * 0.3 : 0)
      + (calc.traditionalIraChoice === "now" ? calc.traditionalIra * 0.3 : 0)
      + calc.rothContributions;
    const other = calc.crypto + calc.collectibles + calc.businessAssets + calc.goodDebt + calc.otherAssets;
    const grossAssets = metals + cash + investments + retirement + other;
    const deductions = calc.dueDebts + calc.currentExpenses;
    const netZakatable = Math.max(0, grossAssets - deductions);
    const nisabChoice = NISAB_OPTIONS[calc.nisabStandard] ?? NISAB_OPTIONS.jamhoor_silver;
    const nisab = nisabChoice.grams * (nisabChoice.metal === "gold" ? calc.goldPrice : calc.silverPrice);
    const zakatDue = nisab > 0 && netZakatable >= nisab ? netZakatable * 0.025 : 0;
    return { currency: calc.currency, grossAssets, deductions, netZakatable, nisab, zakatDue };
  }, [calc]);

  const categoryTotals = useMemo(() => ({
    "Precious metals": calc.goldGrams * calc.goldPrice + calc.silverGrams * calc.silverPrice,
    "Cash & bank": calc.cashInHand + calc.checking + calc.savings + calc.otherCash,
    Investments: calc.shortInvestments + calc.longInvestments * 0.3,
    Retirement: (calc.employerRetirementChoice === "now" ? calc.employerRetirement * 0.3 : 0)
      + (calc.traditionalIraChoice === "now" ? calc.traditionalIra * 0.3 : 0) + calc.rothContributions,
    "Other assets": calc.crypto + calc.collectibles + calc.businessAssets + calc.goodDebt + calc.otherAssets,
  }), [calc]);

  function setAmount(key: keyof CalculatorState, value: number) {
    setCalc(current => ({ ...current, [key]: value }));
  }

  function reset() {
    setCalc({ ...initialState, hawlDate: new Date().toISOString().slice(0, 10) });
    setStep(0);
    window.localStorage.removeItem(STORAGE_KEY);
    setShowBusiness(false);
  }

  function importBusinessAssets() {
    const total = Math.max(0, calc.businessCash + calc.businessInventory + calc.businessReceivables - calc.businessLiabilities);
    setCalc(current => ({ ...current, businessAssets: total }));
    setShowBusiness(false);
  }

  function money(value: number) {
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <Card className="mb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]"><Coins className="size-4" /> Guided calculator</p>
          <h2 className="font-serif text-3xl">Zakat calculator</h2>
          <p className="mt-1 text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <Button variant="ghost" className="self-start" onClick={reset}><RotateCcw className="mr-2 inline size-4" /> Reset</Button>
      </div>

      <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${Math.round((step + 1) / STEPS.length * 100)}% through calculator`}>
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(step + 1) / STEPS.length * 100}%` }} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2 pb-1">
            {STEPS.map((label, index) => (
              <Button key={label} type="button" variant="ghost" className={`h-9 shrink-0 px-3 ${index === step ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setStep(index)}>
                {index < step ? <Check className="mr-1.5 inline size-3.5" /> : <span className="mr-1.5">{index + 1}</span>}{label}
              </Button>
            ))}
          </div>

          {step === 0 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title">
               <div><h3 id="zakat-step-title" className="font-serif text-2xl">Choose your nisab</h3><p className="mt-1 text-sm text-muted-foreground">Nisab is the minimum zakatable wealth threshold. Metal prices refresh from live market sources when available and remain editable.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium">Currency<select value={calc.currency} onChange={event => setCalc({ ...calc, currency: event.target.value })} className="h-11 rounded-lg bg-background px-3 ring-1 ring-border">{CURRENCIES.map(item => <option key={item[0]} value={item[0]}>{item[1]} {item[2]} ({item[0]})</option>)}</select></label>
                 <label className="grid gap-1.5 text-sm font-medium">Valuation date<input type="date" value={calc.hawlDate} onChange={event => setCalc({ ...calc, hawlDate: event.target.value })} className="h-11 rounded-lg bg-background px-3 ring-1 ring-border" /></label>
              </div>
              <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Nisab standard</legend>{Object.entries(NISAB_OPTIONS).map(([key, option]) => <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${calc.nisabStandard === key ? "border-primary bg-muted" : "border-border"}`}><input type="radio" name="nisab" value={key} checked={calc.nisabStandard === key} onChange={() => setCalc({ ...calc, nisabStandard: key as NisabKey })} />{option.label}</label>)}</fieldset>
               <div className="grid gap-4 sm:grid-cols-2"><AmountInput label="Gold price per gram" value={calc.goldPrice} symbol={symbol} onChange={value => setAmount("goldPrice", value)} /><AmountInput label="Silver price per gram" value={calc.silverPrice} symbol={symbol} onChange={value => setAmount("silverPrice", value)} /></div>
               <p className="text-xs text-muted-foreground" role="status">{metalPrices.isLoading ? "Loading current metal prices…" : metalPrices.data && "gold" in metalPrices.data ? `Live spot prices (${metalPrices.data.source}) · ${new Date((metalPrices.data.timestamp ?? 0) * 1000).toLocaleString()} · ${calc.currency}/gram` : `Live prices unavailable${metalPrices.data && "error" in metalPrices.data ? ` (${metalPrices.data.error})` : ""}. Enter prices manually to continue.`}</p>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title"><div><h3 id="zakat-step-title" className="font-serif text-2xl">Precious metals</h3><p className="mt-1 text-sm text-muted-foreground">Enter the pure gold and silver weight you own. Personal jewelry treatment can differ by scholarly opinion.</p></div><div className="grid gap-4 sm:grid-cols-2"><AmountInput label="Gold" hint="Pure weight in grams" value={calc.goldGrams} symbol="g" onChange={value => setAmount("goldGrams", value)} /><AmountInput label="Silver" hint="Pure weight in grams" value={calc.silverGrams} symbol="g" onChange={value => setAmount("silverGrams", value)} /></div></section>
          )}

          {step === 2 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title"><div><h3 id="zakat-step-title" className="font-serif text-2xl">Cash assets</h3><p className="mt-1 text-sm text-muted-foreground">Include money you own and can access across cash and bank accounts.</p></div><div className="grid gap-4 sm:grid-cols-2"><AmountInput label="Cash in hand" value={calc.cashInHand} symbol={symbol} onChange={value => setAmount("cashInHand", value)} /><AmountInput label="Checking accounts" value={calc.checking} symbol={symbol} onChange={value => setAmount("checking", value)} /><AmountInput label="Savings accounts" value={calc.savings} symbol={symbol} onChange={value => setAmount("savings", value)} /><AmountInput label="Other cash accounts" value={calc.otherCash} symbol={symbol} onChange={value => setAmount("otherCash", value)} /></div></section>
          )}

          {step === 3 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title"><div><h3 id="zakat-step-title" className="font-serif text-2xl">Investments</h3><p className="mt-1 text-sm text-muted-foreground">Short-term trading holdings are counted fully. This estimate counts 30% of long-term holdings as zakatable.</p></div><div className="grid gap-4 sm:grid-cols-2"><AmountInput label="Short-term holdings" hint="Stocks or funds held for trading" value={calc.shortInvestments} symbol={symbol} onChange={value => setAmount("shortInvestments", value)} /><AmountInput label="Long-term holdings" hint={`${money(calc.longInvestments * 0.3)} included at 30%`} value={calc.longInvestments} symbol={symbol} onChange={value => setAmount("longInvestments", value)} /></div></section>
          )}

          {step === 4 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title"><div><h3 id="zakat-step-title" className="font-serif text-2xl">Retirement accounts</h3><p className="mt-1 text-sm text-muted-foreground">Choose whether to estimate Zakat now or defer until withdrawal. Pay now includes 30% of the account balance.</p></div><div className="space-y-5"><div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><AmountInput label="401(k) / 403(b)" value={calc.employerRetirement} symbol={symbol} onChange={value => setAmount("employerRetirement", value)} /><Choice value={calc.employerRetirementChoice} onChange={value => setCalc({ ...calc, employerRetirementChoice: value })} /></div><div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><AmountInput label="Traditional IRA" value={calc.traditionalIra} symbol={symbol} onChange={value => setAmount("traditionalIra", value)} /><Choice value={calc.traditionalIraChoice} onChange={value => setCalc({ ...calc, traditionalIraChoice: value })} /></div><AmountInput label="Roth IRA contributions" hint="Contributions only" value={calc.rothContributions} symbol={symbol} onChange={value => setAmount("rothContributions", value)} /></div></section>
          )}

          {step === 5 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title">
              <div><h3 id="zakat-step-title" className="font-serif text-2xl">Other assets</h3><p className="mt-1 text-sm text-muted-foreground">Include assets held for investment and money owed to you that you reasonably expect to collect.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AmountInput label="Cryptocurrency" value={calc.crypto} symbol={symbol} onChange={value => setAmount("crypto", value)} />
                <AmountInput label="Investment art & collectibles" value={calc.collectibles} symbol={symbol} onChange={value => setAmount("collectibles", value)} />
                <div className="rounded-xl border border-border p-4 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-sm font-medium">Business assets</p><p className="text-xs text-muted-foreground">Imported zakatable business value: {money(calc.businessAssets)}</p></div>
                    <Button type="button" variant="ghost" onClick={() => setShowBusiness(value => !value)}>{showBusiness ? "Close business calculator" : "Calculate business Zakat"}</Button>
                  </div>
                  {showBusiness && <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                    <AmountInput label="Business cash" value={calc.businessCash} symbol={symbol} onChange={value => setAmount("businessCash", value)} />
                    <AmountInput label="Zakatable inventory" value={calc.businessInventory} symbol={symbol} onChange={value => setAmount("businessInventory", value)} />
                    <AmountInput label="Collectible receivables" value={calc.businessReceivables} symbol={symbol} onChange={value => setAmount("businessReceivables", value)} />
                    <AmountInput label="Current business liabilities" value={calc.businessLiabilities} symbol={symbol} onChange={value => setAmount("businessLiabilities", value)} />
                    <div className="flex flex-col gap-3 rounded-lg bg-muted p-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm">Net business assets <strong className="ml-2">{money(Math.max(0, calc.businessCash + calc.businessInventory + calc.businessReceivables - calc.businessLiabilities))}</strong></p><Button type="button" onClick={importBusinessAssets}>Import result</Button></div>
                  </div>}
                </div>
                <AmountInput label="Money owed to you" hint="Collectible debt" value={calc.goodDebt} symbol={symbol} onChange={value => setAmount("goodDebt", value)} />
                <AmountInput label="Other zakatable assets" value={calc.otherAssets} symbol={symbol} onChange={value => setAmount("otherAssets", value)} />
              </div>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-5" aria-labelledby="zakat-step-title"><div><h3 id="zakat-step-title" className="font-serif text-2xl">Debts & expenses</h3><p className="mt-1 text-sm text-muted-foreground">Deduct debts and essential expenses currently due, rather than the full value of long-term future payments.</p></div><div className="grid gap-4 sm:grid-cols-2"><AmountInput label="Debts currently due" value={calc.dueDebts} symbol={symbol} onChange={value => setAmount("dueDebts", value)} /><AmountInput label="Essential expenses due" value={calc.currentExpenses} symbol={symbol} onChange={value => setAmount("currentExpenses", value)} /></div><div className={`rounded-lg border p-4 ${result.nisab > 0 && result.netZakatable >= result.nisab ? "border-primary bg-muted" : "border-border"}`}><p className="text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">{result.nisab === 0 ? "Enter metal prices to check nisab" : result.netZakatable >= result.nisab ? "Above nisab" : "Below nisab"}</p><p className="mt-1 font-serif text-4xl">{money(result.zakatDue)}</p><p className="mt-1 text-sm text-muted-foreground">Estimated Zakat due at 2.5%</p><Button className="mt-4" disabled={saving || result.zakatDue <= 0} onClick={() => onSave(result)}><Save className="mr-2 inline size-4" />{saving ? "Saving…" : "Save Zakat entry"}</Button></div></section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}><ArrowLeft className="mr-2 inline size-4" /> Previous</Button>
            {step < STEPS.length - 1 && <Button onClick={() => setStep(value => Math.min(STEPS.length - 1, value + 1))}>Continue <ArrowRight className="ml-2 inline size-4" /></Button>}
          </div>
        </div>

        <aside className="self-start border-t border-border pt-6 lg:sticky lg:top-28 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" aria-label="Running Zakat summary">
          <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">Running summary</p>
          <div className="mt-4 space-y-2 text-sm">{Object.entries(categoryTotals).map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span>{money(value)}</span></div>)}<div className="flex justify-between gap-3 text-destructive"><span>Debts & expenses</span><span>−{money(result.deductions)}</span></div></div>
          <div className="my-4 border-t border-border" />
          <div className="space-y-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Net zakatable</span><strong>{money(result.netZakatable)}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Nisab threshold</span><strong>{money(result.nisab)}</strong></div></div>
          <div className="mt-5 rounded-lg bg-muted p-4"><p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Estimated Zakat</p><p className="mt-1 font-serif text-3xl">{money(result.zakatDue)}</p></div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">This is an estimate. Zakat treatment can differ by school, asset type, and circumstances; consult a trusted local scholar when needed.</p>
        </aside>
      </div>
    </Card>
  );
}