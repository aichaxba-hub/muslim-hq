import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader, Button } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createAnsweredDua, listAnsweredDuas, listDuas, syncDuaLibrary, toggleDuaFavorite, upsertDua } from "@/lib/data.functions";
import { DUA_CATEGORIES } from "@/lib/dua-seed";
import { CalendarCheck, ChevronDown, Heart, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { DuaFinder } from "@/components/DuaFinder";
import { DuaAudio } from "@/components/DuaAudio";
import { todayISO } from "@/lib/hijri";

export const Route = createFileRoute("/_authenticated/duas")({
  head: () => ({ meta: [
    { title: "Dua Vault & Answered Duas — Muslim HQ" },
    { name: "description", content: "Save, find, listen to, and privately reflect on duas and answered prayers." },
    { property: "og:title", content: "Dua Vault & Answered Duas — Muslim HQ" },
    { property: "og:description", content: "Save, find, listen to, and privately reflect on duas and answered prayers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DuasPage,
});

function DuasPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDuas);
  const favFn = useServerFn(toggleDuaFavorite);
  const upsertFn = useServerFn(upsertDua);
  const listAnsweredFn = useServerFn(listAnsweredDuas);
  const createAnsweredFn = useServerFn(createAnsweredDua);
  const { data = [] } = useQuery({ queryKey: ["duas"], queryFn: () => listFn({ data: undefined as any }) });
  const { data: answeredDuas = [] } = useQuery({ queryKey: ["answered-duas"], queryFn: () => listAnsweredFn({ data: undefined as any }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["duas"] });
  const syncFn = useServerFn(syncDuaLibrary);
  useQuery({
    queryKey: ["dua-library-sync"],
    staleTime: Infinity,
    queryFn: async () => { const r = await syncFn(); if (r.added) invalidate(); return r; },
  });
  const fav = useMutation({ mutationFn: (p: any) => favFn({ data: p }), onSuccess: invalidate });
  const upsert = useMutation({ mutationFn: (p: any) => upsertFn({ data: p }), onSuccess: () => { invalidate(); setShowForm(false); setForm(emptyForm); } });
  const createAnswered = useMutation({
    mutationFn: (p: any) => createAnsweredFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["answered-duas"] });
      setAnsweredForm({ title: "", category: "My Duas", dua_text: "", answered_date: todayISO(), reflection: "" });
      setShowAnsweredForm(false);
    },
  });

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { title: "", arabic: "", transliteration: "", translation: "", source: "", category: "My Duas", when_to_recite: "" };
  const [form, setForm] = useState(emptyForm);
  const [showAnsweredForm, setShowAnsweredForm] = useState(false);
  const [answeredForm, setAnsweredForm] = useState({ title: "", category: "My Duas", dua_text: "", answered_date: todayISO(), reflection: "" });
  const [showAnswered, setShowAnswered] = useState(answeredDuas.length > 0);
  useEffect(() => { if (answeredDuas.length > 0) setShowAnswered(true); }, [answeredDuas.length]);

  const q = search.trim().toLowerCase();
  const filtered = data.filter((d: any) => {
    const inCategory = filter === "All" ? true : filter === "Favorites" ? d.favorited : d.category === filter;
    if (!inCategory) return false;
    if (!q) return true;
    return [d.title, d.transliteration, d.translation, d.source, d.when_to_recite, d.category]
      .filter(Boolean)
      .some((v: string) => v.toLowerCase().includes(q));
  });

  return (
    <AppShell>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <PageHeader eyebrow="Dua Vault" title="Supplications" subtitle="A private library of the heart." />
        <Button onClick={() => setShowForm(v => !v)} variant="gold"><Plus className="inline size-4 -mt-0.5" /> Add dua</Button>
      </div>

      <DuaFinder duas={data} />

      {showForm && (
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl bg-background ring-1 ring-border">
              {["My Duas", ...DUA_CATEGORIES].map(c => <option key={c}>{c}</option>)}
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

      <section aria-labelledby="answered-duas-title" className="mb-8 border-y border-border py-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">
              <CalendarCheck className="size-4" /> Gratitude journal
            </p>
            <h2 id="answered-duas-title" className="font-serif text-3xl">Answered Duas</h2>
            <p className="mt-1 text-sm text-muted-foreground">A private record of the duas Allah answered in your life.</p>
          </div>
          <Button variant="ghost" onClick={() => setShowAnsweredForm(value => !value)}>
            <Plus className="mr-1.5 inline size-4" /> Add answered dua
          </Button>
        </div>

        {showAnsweredForm && (
          <Card className="mb-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Title
                <input required placeholder="What did you make dua for?" value={answeredForm.title} onChange={event => setAnsweredForm({ ...answeredForm, title: event.target.value })} className="rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Category
                <select value={answeredForm.category} onChange={event => setAnsweredForm({ ...answeredForm, category: event.target.value })} className="rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border">
                  {["My Duas", ...DUA_CATEGORIES].map(category => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Date answered
                <input type="date" value={answeredForm.answered_date} onChange={event => setAnsweredForm({ ...answeredForm, answered_date: event.target.value })} className="rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground md:col-span-2">
                Your dua
                <textarea rows={3} placeholder="Write the dua or request you were making…" value={answeredForm.dua_text} onChange={event => setAnsweredForm({ ...answeredForm, dua_text: event.target.value })} className="rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border" />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground md:col-span-2">
                Reflection
                <textarea rows={3} placeholder="How was it answered, and what are you grateful for?" value={answeredForm.reflection} onChange={event => setAnsweredForm({ ...answeredForm, reflection: event.target.value })} className="rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border" />
              </label>
            </div>
            <div className="mt-4">
              <Button disabled={!answeredForm.title.trim() || createAnswered.isPending} onClick={() => createAnswered.mutate(answeredForm)}>
                {createAnswered.isPending ? "Saving…" : "Save answered dua"}
              </Button>
            </div>
          </Card>
        )}

        {answeredDuas.length === 0 ? (
          <p className="py-5 text-sm text-muted-foreground">Your answered duas will appear here.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {answeredDuas.map((dua: any) => (
              <Card key={dua.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">{dua.category}</p>
                    <h3 className="font-serif text-2xl">{dua.title}</h3>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">{new Date(`${dua.answered_date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
                </div>
                {dua.dua_text && <p className="mb-3 text-sm leading-relaxed">{dua.dua_text}</p>}
                {dua.reflection && <p className="border-t border-border pt-3 text-sm italic text-muted-foreground">{dua.reflection}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, translation, source, or occasion…"
          className="w-full rounded-full bg-card ring-1 ring-border pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        {["All", "Favorites", "My Duas", ...DUA_CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full ring-1 ring-border ${filter === c ? "bg-primary text-primary-foreground" : ""}`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No duas match your search. Try a different word or category.</p>
      )}

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
            <DuaAudio arabic={d.arabic} transliteration={d.transliteration} translation={d.translation} />
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
