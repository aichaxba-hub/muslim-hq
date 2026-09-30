import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSadaqah, createZakat, listSadaqah, listZakat } from "@/lib/data.functions";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";
import { ZakatCalculator, type ZakatCalculation } from "@/components/ZakatCalculator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/zakat")({
  head: () => ({ meta: [
    { title: "Zakat Calculator & Giving — Muslim HQ" },
    { name: "description", content: "Calculate personal Zakat across metals, cash, investments, retirement, other assets, debts, and expenses, then privately track giving." },
    { property: "og:title", content: "Zakat Calculator & Giving — Muslim HQ" },
    { property: "og:description", content: "A guided personal Zakat calculator and private giving tracker." },
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
  const zakat = useQuery({ queryKey: ["zakat"], queryFn: () => zListFn({ data: undefined as any }) });
  const sadaqah = useQuery({ queryKey: ["sadaqah"], queryFn: () => sListFn({ data: undefined as any }) });
  const zCreate = useMutation({ mutationFn: (p: any) => zCreateFn({ data: p }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["zakat"] }); toast.success("Zakat entry saved"); }, onError: () => toast.error("Could not save the Zakat entry") });
  const sCreate = useMutation({ mutationFn: (p: any) => sCreateFn({ data: p }), onSuccess: () => qc.invalidateQueries({ queryKey: ["sadaqah"] }) });

  const [s, setS] = useState({ log_date: todayISO(), amount: 0, cause: "", notes: "", ramadan: false });

  const totalSadaqah = (sadaqah.data ?? []).reduce((a: number, r: any) => a + (+r.amount || 0), 0);

  return (
    <AppShell>
      <PageHeader eyebrow="Zakat & Giving" title="Wealth is a trust" subtitle="Purify it. Circulate it." />

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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="font-serif text-2xl mb-4">Sadaqah log</h3>
          <p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">Total given</p>
          <p className="text-4xl font-serif mb-4">{totalSadaqah.toLocaleString()}</p>
          <div className="space-y-2">
            <input type="date" value={s.log_date} onChange={e => setS({ ...s, log_date: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <input type="number" placeholder="Amount" value={s.amount} onChange={e => setS({ ...s, amount: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <input placeholder="Cause" value={s.cause} onChange={e => setS({ ...s, cause: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.ramadan} onChange={e => setS({ ...s, ramadan: e.target.checked })} /> Ramadan giving</label>
            <Button onClick={() => sCreate.mutate(s)}>Log sadaqah</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl mb-3">Wealth duas</h3>
          <p className="font-quran text-2xl leading-loose mb-2" dir="rtl">اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ</p>
          <p className="text-sm text-muted-foreground italic">“O Allah, suffice me with what You have made lawful, keeping me from what You have forbidden.”</p>
        </Card>
      </div>

      <PageHeader title="Zakat entries" />
      <div className="grid gap-2 mb-8">
        {(zakat.data ?? []).map((z: any) => (
          <div key={z.id} className="flex justify-between p-4 rounded-2xl ring-1 ring-border text-sm">
            <span>{z.year} · {z.asset_type} · {z.amount}</span>
            <span className="text-[color:var(--gold)]">{z.zakat_due} due {z.paid && "· paid"}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
