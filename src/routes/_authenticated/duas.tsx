import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDuas, toggleDuaFavorite, upsertDua } from "@/lib/data.functions";
import { DUA_CATEGORIES } from "@/lib/dua-seed";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/duas")({
  head: () => ({ meta: [{ title: "Dua Vault — Muslim HQ" }] }),
  component: DuasPage,
});

function DuasPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDuas);
  const favFn = useServerFn(toggleDuaFavorite);
  const upsertFn = useServerFn(upsertDua);
  const { data = [] } = useQuery({ queryKey: ["duas"], queryFn: () => listFn({ data: undefined as any }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["duas"] });
  const fav = useMutation({ mutationFn: (p: any) => favFn({ data: p }), onSuccess: invalidate });
  const upsert = useMutation({ mutationFn: (p: any) => upsertFn({ data: p }), onSuccess: () => { invalidate(); setShowForm(false); setForm(emptyForm); } });

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { title: "", arabic: "", transliteration: "", translation: "", source: "", category: "Forgiveness", when_to_recite: "" };
  const [form, setForm] = useState(emptyForm);

  const filtered = data.filter((d: any) => filter === "All" ? true : filter === "Favorites" ? d.favorited : d.category === filter);

  return (
    <AppShell>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <PageHeader eyebrow="Dua Vault" title="Supplications" subtitle="A private library of the heart." />
        <Button onClick={() => setShowForm(v => !v)} variant="gold"><Plus className="inline size-4 -mt-0.5" /> Add dua</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {DUA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea placeholder="Arabic" value={form.arabic} onChange={e => setForm({ ...form, arabic: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border md:col-span-2" dir="rtl" rows={2} />
            <input placeholder="Transliteration" value={form.transliteration} onChange={e => setForm({ ...form, transliteration: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border md:col-span-2" />
            <input placeholder="Translation" value={form.translation} onChange={e => setForm({ ...form, translation: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border md:col-span-2" />
            <input placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <input placeholder="When to recite" value={form.when_to_recite} onChange={e => setForm({ ...form, when_to_recite: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
          </div>
          <div className="mt-4"><Button onClick={() => upsert.mutate(form)}>Save dua</Button></div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        {["All", "Favorites", ...DUA_CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full ring-1 ring-border ${filter === c ? "bg-primary text-primary-foreground" : ""}`}>{c}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((d: any) => (
          <Card key={d.id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{d.category}</p>
                <h3 className="font-serif text-2xl">{d.title}</h3>
              </div>
              <button onClick={() => fav.mutate({ id: d.id, favorited: !d.favorited })} className="p-2">
                <Heart className={`size-5 ${d.favorited ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground"}`} />
              </button>
            </div>
            {d.arabic && <p dir="rtl" className="text-2xl font-serif leading-relaxed mb-3">{d.arabic}</p>}
            {d.transliteration && <p className="text-sm italic text-muted-foreground mb-2">{d.transliteration}</p>}
            {d.translation && <p className="text-sm mb-3">"{d.translation}"</p>}
            <div className="text-xs text-muted-foreground border-t border-border pt-3 flex justify-between">
              <span>{d.source}</span>
              <span>{d.when_to_recite}</span>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
