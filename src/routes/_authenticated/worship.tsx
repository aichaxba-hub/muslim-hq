import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, getWorshipLog, listWorshipLogs, upsertWorshipLog } from "@/lib/data.functions";
import { PRAYERS, PRAYER_LABEL, DEFAULT_COORDS } from "@/lib/prayer-times";
import { PrayerPlaceToggles } from "@/components/PrayerPlaceToggles";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";
import { toast } from "sonner";
import { QiblaFinder } from "@/components/QiblaFinder";


export const Route = createFileRoute("/_authenticated/worship")({
  head: () => ({ meta: [
    { title: "Salah Log — Muslim HQ" },
    { name: "description", content: "Privately track each daily salah, prayer status, congregation, and masjid attendance — with a Qibla compass." },
    { property: "og:title", content: "Salah Log — Muslim HQ" },
    { property: "og:description", content: "A calm, private daily salah tracker." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: WorshipHub,
});

const STATUSES = [
  { v: "on_time", l: "On time" },
  { v: "late", l: "Late" },
  { v: "missed", l: "Missed" },
  { v: "excused", l: "Excused" },
];

const NAFL_PRAYERS = [
  { v: "duha", l: "Duha" },
  { v: "tahajjud", l: "Tahajjud" },
  { v: "witr", l: "Witr" },
  { v: "istikhara", l: "Istikhara" },
];

const EXCUSE_TYPES = ["Menstruation", "Postpartum", "Illness", "Travel"];


function WorshipHub() {
  const [date, setDate] = useState(todayISO());
  const qc = useQueryClient();
  const getFn = useServerFn(getWorshipLog);
  const upsertFn = useServerFn(upsertWorshipLog);
  const listFn = useServerFn(listWorshipLogs);
  const profileFn = useServerFn(getProfile);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });
  const coords = profile.data?.latitude
    ? { latitude: profile.data.latitude, longitude: profile.data.longitude! }
    : { latitude: DEFAULT_COORDS.latitude, longitude: DEFAULT_COORDS.longitude };
  const log = useQuery({ queryKey: ["worship", date], queryFn: () => getFn({ data: { date } }) });
  const history = useQuery({ queryKey: ["worship-history-all"], queryFn: () => listFn({ data: { limit: 90 } }) });

  const upsert = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upsertFn({ data: { log_date: date, ...patch } as any }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["worship", date] });
      const previous = qc.getQueryData(["worship", date]);
      qc.setQueryData(["worship", date], (current: Record<string, unknown> | null | undefined) => ({ ...current, ...patch }));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      qc.setQueryData(["worship", date], context?.previous);
      toast.error("Could not save your Salah log");
    },
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["qada"] });
      window.localStorage.setItem("muslim-hq-worship-changed", String(Date.now()));
      if (row?.qadaAdded) toast(`${row.qadaAdded} added to your Qada list`, { description: "Make it up when you can. Allah is Most Merciful." });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["worship", date] });
      qc.invalidateQueries({ queryKey: ["worship-history"] });
      qc.invalidateQueries({ queryKey: ["worship-history-all"] });
    },
  });

  const l = log.data ?? {};

  return (
    <AppShell>
      <PageHeader eyebrow="Salah" title="Daily Salah Log" subtitle="One prayer at a time. Excused days protect your streak — not break it." />

      <div className="flex items-center gap-3 mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 rounded-full ring-1 ring-border bg-background text-sm" />
        <span className="text-xs text-muted-foreground">Viewing {date}</span>
      </div>

      <div className="mb-6">
        <QiblaFinder latitude={coords.latitude} longitude={coords.longitude} hasLocation={!!profile.data?.latitude} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-serif text-2xl mb-4">The Fard</h3>
          <div className="space-y-2">
            {PRAYERS.map(p => (
              <div key={p} className="p-3 rounded-2xl ring-1 ring-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{PRAYER_LABEL[p]}</span>
                  <select
                    value={(l as any)[`${p}_status`] ?? ""}
                    onChange={e => upsert.mutate({ [`${p}_status`]: e.target.value || null })}
                    disabled={!!(l as any).excused}
                    className="text-sm bg-transparent focus:outline-none disabled:opacity-50"
                  >
                    <option value="">— not logged —</option>
                    {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
                <div className="mt-2">
                  <PrayerPlaceToggles
                    congregation={!!(l as any)[`${p}_congregation`]}
                    masjid={!!(l as any)[`${p}_masjid`]}
                    onToggleCongregation={v => upsert.mutate({ [`${p}_congregation`]: v })}
                    onToggleMasjid={v => upsert.mutate({ [`${p}_masjid`]: v })}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl mb-4">The Nafl</h3>
          <div className="space-y-2">
            {NAFL_PRAYERS.map(n => (
              <div key={n.v} className="p-3 rounded-2xl ring-1 ring-border flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{n.l}</span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(l as any)[n.v]}
                    onChange={e => upsert.mutate({ [n.v]: e.target.checked })}
                  />
                  Prayed
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Optional prayers — a bonus, never a burden.</p>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl mb-4">Excused today</h3>
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!(l as any).excused} onChange={e => {
              const patch: Record<string, unknown> = { excused: e.target.checked };
              for (const p of PRAYERS) patch[`${p}_status`] = e.target.checked ? "excused" : null;
              if (!e.target.checked) patch.excuse_type = null;
              upsert.mutate(patch);
            }} />
            <span className="text-sm">Mark today as excused</span>
          </label>
          {(l as any).excused && (
            <select
              value={(l as any).excuse_type ?? ""}
              onChange={e => upsert.mutate({ excuse_type: e.target.value || null })}
              className="w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border"
            >
              <option value="">Reason...</option>
              {EXCUSE_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          )}
          <p className="text-xs text-muted-foreground mt-3">Excused days do not count against your streaks or percentages.</p>
          {(l as any).excused && ["Menstruation", "Postpartum"].includes((l as any).excuse_type) && <p className="text-xs text-muted-foreground mt-2">No missed prayers or Qada are recorded for this day.</p>}
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">Optional Prayers</h4>
          <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={!!(l as any).sunnah} onChange={e => upsert.mutate({ sunnah: e.target.checked })} /> Sunnah completed</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!(l as any).jummah} onChange={e => upsert.mutate({ jummah: e.target.checked })} /> Jummah attended</label>
        </Card>
      </div>

      <PageHeader eyebrow="History" title="Recent days" />
      <div className="grid gap-2">
        {(history.data ?? []).slice(0, 30).map((r: any) => {
          const done = PRAYERS.filter(p => r[`${p}_status`] && !["qada","missed"].includes(r[`${p}_status`])).length;
          return (
            <button key={r.id} onClick={() => setDate(r.log_date)} className="text-left flex items-center justify-between p-4 rounded-2xl ring-1 ring-border hover:bg-muted transition">
              <div>
                <p className="text-sm font-medium">{r.log_date}</p>
                <p className="text-xs text-muted-foreground">{r.excused ? "Excused" : `${done}/5 prayers`} · {r.quran_pages ?? 0}pp Quran · {r.dhikr_count ?? 0} dhikr</p>
              </div>
              <span className="text-xs text-muted-foreground">Open</span>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
