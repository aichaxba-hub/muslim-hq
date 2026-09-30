import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, PageHeader } from "@/components/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWorshipLog, listWorshipLogs, upsertWorshipLog } from "@/lib/data.functions";
import { FAST_TYPES } from "@/lib/fasting";
import { PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { todayISO } from "@/lib/hijri";
import { useState } from "react";


export const Route = createFileRoute("/_authenticated/worship")({
  head: () => ({ meta: [{ title: "Worship Log — Muslim HQ" }] }),
  component: WorshipHub,
});

const STATUSES = [
  { v: "on_time", l: "On time" },
  { v: "late", l: "Late" },
  { v: "qada", l: "Qada" },
  { v: "excused", l: "Excused" },
];

const EXCUSE_TYPES = ["Menstruation", "Postpartum", "Illness", "Travel", "Other"];


function WorshipHub() {
  const [date, setDate] = useState(todayISO());
  const qc = useQueryClient();
  const getFn = useServerFn(getWorshipLog);
  const upsertFn = useServerFn(upsertWorshipLog);
  const listFn = useServerFn(listWorshipLogs);

  const log = useQuery({ queryKey: ["worship", date], queryFn: () => getFn({ data: { date } }) });
  const history = useQuery({ queryKey: ["worship-history-all"], queryFn: () => listFn({ data: { limit: 90 } }) });

  const upsert = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upsertFn({ data: { log_date: date, ...patch } as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["worship", date] }),
  });

  const l = log.data ?? {};

  return (
    <AppShell>
      <PageHeader eyebrow="Worship Hub" title="Daily Worship Log" subtitle="Track what softens the heart. Excused days protect your streak — not break it." />

      <div className="flex items-center gap-3 mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-2 rounded-full ring-1 ring-border bg-background text-sm" />
        <span className="text-xs text-muted-foreground">Viewing {date}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-serif text-2xl mb-4">The Five</h3>
          <div className="space-y-2">
            {PRAYERS.map(p => (
              <div key={p} className="p-3 rounded-2xl ring-1 ring-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{PRAYER_LABEL[p]}</span>
                  <select
                    value={(l as any)[`${p}_status`] ?? ""}
                    onChange={e => upsert.mutate({ [`${p}_status`]: e.target.value || null })}
                    className="text-sm bg-transparent focus:outline-none"
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
          <h3 className="font-serif text-2xl mb-4">Excused today</h3>
          <label className="flex items-center gap-3 mb-3">
            <input type="checkbox" checked={!!(l as any).excused} onChange={e => upsert.mutate({ excused: e.target.checked })} />
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
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">Optional Prayers</h4>
          <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={!!(l as any).sunnah} onChange={e => upsert.mutate({ sunnah: e.target.checked })} /> Sunnah completed</label>
          <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={!!(l as any).nafl} onChange={e => upsert.mutate({ nafl: e.target.checked })} /> Nafl completed</label>
          <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={!!(l as any).congregation} onChange={e => upsert.mutate({ congregation: e.target.checked })} /> Prayed in congregation</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!(l as any).jummah} onChange={e => upsert.mutate({ jummah: e.target.checked })} /> Jummah attended</label>
        </Card>
        <Card>
          <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">Fasting</h4>
          <label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={!!(l as any).fasted} onChange={e => upsert.mutate({ fasted: e.target.checked })} /> Fasted today</label>
          {(l as any).fasted && (
            <select value={(l as any).fast_type ?? ""} onChange={e => upsert.mutate({ fast_type: e.target.value || null })} className="w-full px-3 py-2 rounded-xl bg-background ring-1 ring-border text-sm">
              <option value="">Type...</option>
              {FAST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </Card>
        <Card>
          <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">Quran & Dhikr</h4>
          <div className="space-y-2 text-sm">
            <label className="flex items-center justify-between gap-2">Pages<input type="number" min={0} defaultValue={(l as any).quran_pages ?? 0} onBlur={e => upsert.mutate({ quran_pages: +e.target.value })} className="w-20 px-2 py-1 rounded-lg bg-background ring-1 ring-border" /></label>
            <label className="flex items-center justify-between gap-2">Minutes<input type="number" min={0} defaultValue={(l as any).quran_minutes ?? 0} onBlur={e => upsert.mutate({ quran_minutes: +e.target.value })} className="w-20 px-2 py-1 rounded-lg bg-background ring-1 ring-border" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!(l as any).tafsir} onChange={e => upsert.mutate({ tafsir: e.target.checked })} /> Tafsir studied</label>
            <label className="flex items-center justify-between gap-2">Dhikr count<input type="number" min={0} defaultValue={(l as any).dhikr_count ?? 0} onBlur={e => upsert.mutate({ dhikr_count: +e.target.value })} className="w-20 px-2 py-1 rounded-lg bg-background ring-1 ring-border" /></label>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide mb-3">Intention & Notes</h4>
        <input defaultValue={(l as any).intention ?? ""} onBlur={e => upsert.mutate({ intention: e.target.value })} placeholder="Today's intention..." className="w-full mb-3 px-4 py-2.5 rounded-xl bg-background ring-1 ring-border" />
        <textarea defaultValue={(l as any).notes ?? ""} onBlur={e => upsert.mutate({ notes: e.target.value })} placeholder="Notes..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border" />
      </Card>

      <PageHeader eyebrow="History" title="Recent days" />
      <div className="grid gap-2">
        {(history.data ?? []).slice(0, 30).map((r: any) => {
          const done = PRAYERS.filter(p => r[`${p}_status`] && r[`${p}_status`] !== "qada").length;
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
