import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSadaqah, createZakat, listSadaqah, listZakat, getProfile, updateProfile, listZakatPayments, recordZakatPayment } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";
import { ZakatCalculator, type ZakatCalculation } from "@/components/ZakatCalculator";
import { toast } from "sonner";
import { FitrCalculator } from "@/components/FitrCalculator";
import { hawlProgress, hawlReminder } from "@/lib/hawl";
import { CalendarDays, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/zakat")({
  head: () => ({ meta: [
    { title: "Zakat Calculator & Giving — Muslim HQ" },
    { name: "description", content: "Calculate personal Zakat and Zakat al-Fitr, track your Hawl anniversary and record private payments and giving." },
    { property: "og:title", content: "Zakat Calculator & Giving — Muslim HQ" },
    { property: "og:description", content: "Personal Zakat and Zakat al-Fitr calculators, Hawl progress and a private giving tracker." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ZakatPage,
});

function ZakatPage() {
  const qc = useQueryClient();
  const zListFn = useServerFn(listZakat);
  const zCreateFn = useServerFn(createZakat);
  const sListFn = useServerFn(listSadaqah);
  const sCreateFn = useServerFn(createSadaqah);
  const profileFn = useServerFn(getProfile);
  const profileUpdateFn = useServerFn(updateProfile);
  const paymentsFn = useServerFn(listZakatPayments);
  const paymentCreateFn = useServerFn(recordZakatPayment);
  const zakat = useQuery({ queryKey: ["zakat"], queryFn: () => zListFn({ data: undefined as any }) });
  const sadaqah = useQuery({ queryKey: ["sadaqah"], queryFn: () => sListFn({ data: undefined as any }) });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
  const payments = useQuery({ queryKey: ["zakat-payments"], queryFn: () => paymentsFn({ data: undefined as any }) });
  const [anniversary, setAnniversary] = useState("");
  const [paymentEntry, setPaymentEntry] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [paymentNote, setPaymentNote] = useState("");
  const anniversaryValue = profile.data?.zakat_anniversary ?? "";
  const progress = anniversaryValue ? hawlProgress(anniversaryValue) : null;
  const reminder = anniversaryValue ? hawlReminder(anniversaryValue) : null;
  const anniversarySave = useMutation({ mutationFn: (value: string) => profileUpdateFn({ data: { zakat_anniversary: value } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Zakat anniversary saved"); }, onError: () => toast.error("Could not save anniversary") });
  const paymentCreate = useMutation({ mutationFn: (p: { zakat_entry_id: string; amount: number; paid_on: string; note?: string }) => paymentCreateFn({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["zakat"] }); qc.invalidateQueries({ queryKey: ["zakat-payments"] }); setPaymentEntry(null); setPaymentAmount(""); setPaymentNote(""); toast.success("Payment recorded"); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Could not record payment") });
  const zCreate = useMutation({ mutationFn: (p: any) => zCreateFn({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["zakat"] }); toast.success("Zakat entry saved"); }, onError: () => toast.error("Could not save the Zakat entry") });
  const emptySadaqah = { log_date: todayISO(), amount: 0, cause: "", notes: "", ramadan: false };
  const sCreate = useMutation({
    mutationFn: (p: any) => sCreateFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sadaqah"] });
      setS({ ...emptySadaqah, log_date: todayISO() });
      toast.success("Sadaqah logged");
    },
    onError: () => toast.error("Could not log sadaqah"),
  });

  const [s, setS] = useState(emptySadaqah);

  const totalSadaqah = (sadaqah.data ?? []).reduce((a: number, r: any) => a + (+r.amount || 0), 0);

  return (
    <AppShell>
      <PageHeader eyebrow="Zakat & Giving" title="Wealth is a trust" subtitle="Purify it. Circulate it." />

      <section className="mb-8 border-y border-border py-6" aria-label="Hawl tracker">
        <div className="flex items-start gap-3"><CalendarDays className="mt-1 size-5 text-primary" /><div><h2 className="font-serif text-2xl">Your Hawl</h2><p className="text-sm text-muted-foreground">Set the date your wealth first reached nisab. A lunar year later, review what you owe.</p></div></div>
        <div className="mt-4 flex flex-wrap items-end gap-3"><label className="grid gap-1 text-sm">Zakat anniversary date<input aria-label="Zakat anniversary date" type="date" className="h-11 rounded-lg bg-background px-3 ring-1 ring-border" value={anniversary || anniversaryValue} onChange={e => setAnniversary(e.target.value)} /></label><Button disabled={!anniversary || anniversarySave.isPending} onClick={() => anniversarySave.mutate(anniversary)}>Save date</Button></div>
        {progress && <div className="mt-5 max-w-2xl"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{progress.daysRemaining === 0 ? "Zakat is due today" : `${progress.daysRemaining} days until Zakat is due`}</strong><span>{progress.due.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Hawl progress"><div className="h-full bg-primary transition-[width]" style={{ width: `${progress.percent}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{progress.percent}% of the current lunar year · Estimated date; local moon sighting may differ.</p></div>}
        {reminder && <p className="mt-4 max-w-2xl border-l-2 border-primary bg-muted px-4 py-3 text-sm" role="status">{reminder.message}</p>}
      </section>

      <ZakatCalculator
        saving={zCreate.isPending}
        onSave={(result: ZakatCalculation) => zCreate.mutate({
          year: new Date().getFullYear(),
          asset_type: `Personal assets (${result.currency})`,
          amount: +result.netZakatable.toFixed(2),
          nisab: +result.nisab.toFixed(2),
          zakat_due: +result.zakatDue.toFixed(2),
        })}
      />

      <FitrCalculator />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="font-serif text-2xl mb-4">Sadaqah log</h3>
          <p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Total given</p>
           <p className="text-4xl font-serif mb-4">${totalSadaqah.toLocaleString()}</p>
          <div className="space-y-2">
            <input type="date" value={s.log_date} onChange={e => setS({ ...s, log_date: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <input type="number" placeholder="Amount" value={s.amount} onChange={e => setS({ ...s, amount: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <input placeholder="Cause" value={s.cause} onChange={e => setS({ ...s, cause: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.ramadan} onChange={e => setS({ ...s, ramadan: e.target.checked })} /> Ramadan giving</label>
            <Button onClick={() => sCreate.mutate(s)}>Log sadaqah</Button>
          </div>
          <div className="mt-5 space-y-2">
            {(sadaqah.data ?? []).map((r: any) => (
              <div key={r.id} className="flex justify-between p-3 rounded-xl ring-1 ring-border text-sm">
                <span>{r.log_date}{r.cause ? ` · ${r.cause}` : ""}{r.ramadan ? " · Ramadan" : ""}</span>
                 <span className="text-[color:var(--gold)]">${(+r.amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl mb-3">Wealth duas</h3>
          <p className="font-quran text-2xl leading-loose mb-2" dir="rtl">اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ</p>
          <p className="text-sm text-muted-foreground italic">“O Allah, suffice me with what You have made lawful, keeping me from what You have forbidden.”</p>
        </Card>
      </div>

       <PageHeader title="Zakat entries & payments" />
      <div className="grid gap-2 mb-8">
         {(zakat.data ?? []).map((z: any) => {
           const entryPayments = (payments.data ?? []).filter(p => p.zakat_entry_id === z.id);
           const given = entryPayments.reduce((sum, p) => sum + Number(p.amount), 0);
           const remaining = Math.max(0, Number(z.zakat_due ?? 0) - given);
           return <div key={z.id} className="border-b border-border py-4 text-sm">
             <div className="flex flex-wrap items-center justify-between gap-3"><span>{z.year} · {z.asset_type} · {Number(z.amount ?? 0).toLocaleString()}</span><strong className="text-[color:var(--gold)]">{Number(z.zakat_due ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} due · {z.paid || remaining < .01 ? "Paid" : `${remaining.toFixed(2)} remaining`}</strong></div>
             {entryPayments.map(p => <p key={p.id} className="mt-2 text-muted-foreground">{p.paid_on} · Payment {Number(p.amount).toFixed(2)}{p.note ? ` · ${p.note}` : ""}</p>)}
             {!z.paid && remaining >= .01 && <div className="mt-3"><Button variant="ghost" onClick={() => { setPaymentEntry(paymentEntry === z.id ? null : z.id); setPaymentAmount(""); }}><Plus className="mr-2 inline size-4" />Record payment</Button>{paymentEntry === z.id && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]"><label className="grid gap-1">Amount<input aria-label="Payment amount" type="number" min="0.01" step="0.01" max={remaining} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-10 rounded-lg bg-background px-3 ring-1 ring-border" /></label><label className="grid gap-1">Date paid<input aria-label="Payment date" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-10 rounded-lg bg-background px-3 ring-1 ring-border" /></label><label className="grid gap-1 sm:col-span-2">Note (optional)<input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="h-10 rounded-lg bg-background px-3 ring-1 ring-border" /></label><Button disabled={paymentCreate.isPending || !paymentDate || !(Number(paymentAmount) > 0) || Number(paymentAmount) > remaining + .001} onClick={() => paymentCreate.mutate({ zakat_entry_id: z.id, amount: Number(paymentAmount), paid_on: paymentDate, note: paymentNote })}>Save payment</Button><Button variant="ghost" disabled={paymentCreate.isPending} onClick={() => { setPaymentAmount(remaining.toFixed(2)); }}>Pay remaining in full</Button></div>}</div>}
           </div>;
         })}
      </div>
    </AppShell>
  );
}
