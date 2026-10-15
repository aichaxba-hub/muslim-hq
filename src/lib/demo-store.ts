// Fictional sample data + fake handlers used in demo mode instead of server functions.
import * as D from "./data.functions";
import { findDuas } from "./dua-finder.functions";
import { getReviewInsights } from "./review-insights.functions";
import { autocompletePlaces } from "./places.functions";
import { DUA_LIBRARY } from "./dua-library";
import { SEED_DUAS } from "./dua-seed";
import { DemoBlockedError, DEMO_USER } from "./demo-mode";

type Row = Record<string, any>;
type Store = Record<string, Row[]> & { profile: Row[] };

let store: Store | null = null;
let seq = 0;
const uid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };
const now = () => new Date().toISOString();
const base = () => ({ id: uid(), user_id: DEMO_USER.id, created_at: now(), updated_at: now() });

function build(): Store {
  const P = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const worship: Row[] = [];
  for (let i = 1; i <= 21; i++) {
    const r: Row = { ...base(), log_date: iso(i), excused: false, excuse_type: null, dhikr_count: 0, duha: i % 3 === 0, tahajjud: i % 5 === 0, witr: i % 2 === 0, istikhara: false, fajr_sunnah_before: i % 2 === 0, dhuhr_sunnah_before: i % 3 === 0, dhuhr_sunnah_after: i % 2 === 1, maghrib_sunnah_after: true, isha_sunnah_after: i % 4 !== 0, jummah: new Date(iso(i)).getDay() === 5, sunnah: true, nafl: i % 3 === 0 };
    for (const p of P) {
      r[`${p}_status`] = i === 4 && p === "fajr" ? "missed" : "on_time";
      r[`${p}_congregation`] = p === "maghrib" || (p === "isha" && i % 2 === 0);
      r[`${p}_masjid`] = p === "maghrib" && i % 3 === 0;
    }
    if (i === 9 || i === 10) { r.excused = true; r.excuse_type = "Travel"; }
    worship.push(r);
  }
  return {
    profile: [{ id: DEMO_USER.id, display_name: "Demo Visitor", location_label: "Sampleton (fictional)", latitude: 21.4225, longitude: 39.8262, calc_method: "MoonsightingCommittee", madhab: "shafi", onboarding_complete: true, seeded: true, quran_daily_goal: 10, ramadan_fasts_owed: 3, zakat_anniversary: iso(-40), theme: null, khatm_start: null, khatm_target: null, created_at: now(), updated_at: now() }],
    worship_logs: worship,
    qada_prayers: [
      { ...base(), prayer: "Fajr", missed_date: iso(4), completed: false, made_up_date: null, auto_logged: true, notes: "Added from Salah log" },
      { ...base(), prayer: "Asr", missed_date: iso(30), completed: true, made_up_date: iso(25), auto_logged: false, notes: null },
      { ...base(), prayer: "Isha", missed_date: iso(35), completed: false, made_up_date: null, auto_logged: false, notes: null },
    ],
    quran_logs: [
      { ...base(), log_date: iso(1), surah: "1. Al-Fatihah", verses_completed: "Ayat 1-7", pages: 1, juz: 1, tafsir: true, reflection: "Sample reflection on seeking guidance.", minutes: null, auto_logged: false, completed_at: null },
      { ...base(), log_date: iso(3), surah: "67. Al-Mulk", verses_completed: "Ayat 1-15", pages: 2, juz: 29, tafsir: false, reflection: null, minutes: null, auto_logged: false, completed_at: null },
      { ...base(), log_date: iso(6), surah: "36. Ya-Sin", verses_completed: "Ayat 1-30", pages: 3, juz: 22, tafsir: false, reflection: null, minutes: null, auto_logged: false, completed_at: null },
    ],
    quran_study_goals: [],
    fasting_logs: [
      { ...base(), log_date: iso(5), fast_type: "Monday/Thursday", completed: true, notes: null },
      { ...base(), log_date: iso(12), fast_type: "Ramadan Makeup", completed: true, notes: null },
    ],
    dhikr_logs: [
      { ...base(), log_date: iso(0), category: "SubhanAllah", count: 33, notes: null },
      { ...base(), log_date: iso(1), category: "Alhamdulillah", count: 100, notes: null },
      { ...base(), log_date: iso(2), category: "Astaghfirullah", count: 70, notes: null },
    ],
    duas: [...SEED_DUAS, ...DUA_LIBRARY].filter((d, i, a) => a.findIndex(x => x.title === d.title) === i)
      .map((d: Row) => ({ ...base(), favorited: false, is_custom: false, personal_note: null, ...d })),
    answered_duas: [{ ...base(), title: "Sample: ease in exams", category: "Studies", dua_text: null, answered_date: iso(14), reflection: "A fictional example entry." }],
    reflections: [{ ...base(), entry_date: iso(2), week_start: null, mood: "grateful", closest_to_allah: "Quiet dhikr after Fajr (sample).", fell_short: "Rushed Asr once.", distraction: null, sincere_dua: null, one_change: null, wins: "Prayed Maghrib in jama'ah most days.", struggles: null, gratitude: "Family and health.", next_intention: "Sleep earlier for Fajr." }],
    goals: [
      { ...base(), title: "Pray consistently", category: "Salah", why: "Sample goal", quarter: "Q4", status: "In Progress", target_date: null, linked_habits: null },
      { ...base(), title: "Read more Qur'an", category: "Quran", why: "Sample goal", quarter: "Q4", status: "Completed", target_date: null, linked_habits: null },
    ],
    zakat_entries: [{ ...base(), year: new Date().getFullYear(), asset_type: "Cash savings", amount: 8000, nisab: 5000, zakat_due: 200, paid: false, date_paid: null, notes: "Sample entry" }],
    zakat_payments: [],
    sadaqah_logs: [
      { ...base(), log_date: iso(3), amount: 25, cause: "Sample food bank", kind: "sadaqah", ramadan: false, notes: null, zakat_payment_id: null },
      { ...base(), log_date: iso(10), amount: 10, cause: "Sample masjid fund", kind: "sadaqah", ramadan: false, notes: null, zakat_payment_id: null },
    ],
  } as Store;
}

export function resetDemoStore() { store = null; }
function S() { return (store ??= build()); }
const sortDesc = (k: string) => (a: Row, b: Row) => String(b[k] ?? "").localeCompare(String(a[k] ?? ""));
const list = (t: string, k?: string) => { const r = [...S()[t]]; return k ? r.sort(sortDesc(k)) : r; };
const insert = (t: string, data: Row) => { const row = { ...base(), ...data }; S()[t].push(row); return row; };
const update = (t: string, id: string, patch: Row) => {
  const row = S()[t].find(r => r.id === id);
  if (!row) throw new Error("Not found");
  Object.assign(row, patch, { updated_at: now() });
  return row;
};
const blocked = (label: string) => () => { throw new DemoBlockedError(label); };

const handlers: Map<unknown, (data: any) => unknown> = new Map<unknown, (data: any) => unknown>([
  [D.syncDuaLibrary, () => ({ added: 0 })],
  [D.getProfile, () => S().profile[0]],
  [D.updateProfile, (d) => Object.assign(S().profile[0], d)],
  [D.ensureSeeded, () => ({ seeded: false })],
  [D.getWorshipLog, (d) => S().worship_logs.find(r => r.log_date === d.date) ?? null],
  [D.listWorshipLogs, (d = {}) => {
    let r = list("worship_logs", "log_date");
    if (d.from) r = r.filter(x => x.log_date >= d.from);
    if (d.to) r = r.filter(x => x.log_date <= d.to);
    return d.limit ? r.slice(0, d.limit) : r;
  }],
  [D.upsertWorshipLog, (d) => {
    const existing = S().worship_logs.find(r => r.log_date === d.log_date);
    const row = existing ? Object.assign(existing, d) : insert("worship_logs", d);
    if (row.excused && ["Menstruation", "Postpartum"].includes(row.excuse_type ?? "")) {
      for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) row[`${p}_status`] = "excused";
      S().qada_prayers = S().qada_prayers.filter(q => q.missed_date !== d.log_date);
    }
    let qadaAdded: string | null = null;
    for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
      if (!(`${p}_status` in d)) continue;
      const label = p[0].toUpperCase() + p.slice(1);
      S().qada_prayers = S().qada_prayers.filter(q => !(q.auto_logged && !q.completed && q.prayer === label && q.missed_date === d.log_date));
      if (!row.excused && row[`${p}_status`] === "missed") { insert("qada_prayers", { prayer: label, missed_date: d.log_date, auto_logged: true, completed: false, made_up_date: null, notes: "Added from Salah log" }); qadaAdded = label; }
    }
    return { ...row, qadaAdded };
  }],
  [D.listQada, () => list("qada_prayers", "missed_date")],
  [D.createQada, (d) => insert("qada_prayers", { completed: false, made_up_date: null, auto_logged: false, notes: null, ...d })],
  [D.updateQada, ({ id, ...rest }) => update("qada_prayers", id, rest)],
  [D.listQuranLogs, () => list("quran_logs", "log_date")],
  [D.createQuranLog, (d) => insert("quran_logs", { auto_logged: false, ...d })],
  [D.listQuranStudyGoals, () => list("quran_study_goals")],
  [D.createQuranStudyGoal, (d) => insert("quran_study_goals", { ...d, last_completed_ayah: 0, completed: false })],
  [D.updateQuranStudyProgress, (d) => { const g = S().quran_study_goals.find(r => r.id === d.id)!; const p = Math.max(g.last_completed_ayah, d.ayah); return update("quran_study_goals", d.id, { last_completed_ayah: p, completed: p >= g.end_ayah }); }],
  [D.setQuranStudyGoalComplete, (d) => { const g = S().quran_study_goals.find(r => r.id === d.id)!; return update("quran_study_goals", d.id, { completed: d.completed, last_completed_ayah: d.completed ? g.end_ayah : 0 }); }],
  [D.deleteQuranStudyGoal, (d) => { S().quran_study_goals = S().quran_study_goals.filter(r => r.id !== d.id); return { ok: true }; }],
  [D.listFasting, () => list("fasting_logs", "log_date")],
  [D.upsertFasting, (d) => { const e = S().fasting_logs.find(r => r.log_date === d.log_date); return e ? Object.assign(e, d) : insert("fasting_logs", d); }],
  [D.listDhikr, () => list("dhikr_logs", "log_date")],
  [D.createDhikr, (d) => insert("dhikr_logs", d)],
  [D.listDuas, () => list("duas").sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.title).localeCompare(String(b.title)))],
  [D.upsertDua, ({ id, ...rest }) => id ? update("duas", id, rest) : insert("duas", { favorited: false, is_custom: false, ...rest })],
  [D.toggleDuaFavorite, (d) => { update("duas", d.id, { favorited: d.favorited }); return { ok: true }; }],
  [D.listAnsweredDuas, () => list("answered_duas", "answered_date")],
  [D.createAnsweredDua, (d) => insert("answered_duas", d)],
  [D.listReflections, () => list("reflections", "entry_date")],
  [D.createReflection, (d) => insert("reflections", d)],
  [D.listGoals, () => list("goals", "created_at")],
  [D.upsertGoal, ({ id, ...rest }) => id ? update("goals", id, rest) : insert("goals", rest)],
  [D.listZakat, () => list("zakat_entries", "year")],
  [D.createZakat, (d) => insert("zakat_entries", d)],
  [D.listZakatPayments, () => list("zakat_payments", "paid_on")],
  [D.recordZakatPayment, (d) => {
    const p = insert("zakat_payments", d);
    const e = S().zakat_entries.find(r => r.id === d.zakat_entry_id);
    const paid = S().zakat_payments.filter(x => x.zakat_entry_id === d.zakat_entry_id).reduce((s, x) => s + Number(x.amount), 0);
    if (e && paid >= Number(e.zakat_due ?? 0) - 0.001) Object.assign(e, { paid: true, date_paid: d.paid_on });
    return p;
  }],
  [D.listSadaqah, () => list("sadaqah_logs", "log_date")],
  [D.createSadaqah, ({ zakat_entry_id, ...rest }) => {
    let zakat_payment_id: string | null = null;
    if (rest.kind === "zakat" && zakat_entry_id) zakat_payment_id = ((handlers.get(D.recordZakatPayment) as (d: any) => unknown)({ zakat_entry_id, amount: rest.amount, paid_on: rest.log_date, note: rest.cause ?? null }) as Row).id;
    return insert("sadaqah_logs", { ...rest, kind: rest.kind ?? "sadaqah", zakat_payment_id });
  }],
  [D.listWorshipBackups, () => []],
  [D.createWorshipBackup, blocked("Backups")],
  [D.restoreWorshipBackup, blocked("Restoring backups")],
  [D.deleteWorshipBackup, blocked("Deleting backups")],
  [D.exportAllData, blocked("Exporting data")],
  [D.resetAllData, blocked("Resetting data")],
  [D.deleteAccount, blocked("Deleting an account")],
  [findDuas, () => ({ matches: [], error: "The AI dua finder is turned off in demo mode — browse the categories instead." })],
  [getReviewInsights, () => ({ insights: { praise: ["Sample: you kept Maghrib in jama'ah most days."], insights: ["Sample: Fajr is your most-missed prayer this period."], recommendations: ["Sample: set a gentle Fajr reminder."], encouragement: "This is demo text. With an account, insights are written from your own data." } })],
  [autocompletePlaces, () => ({ suggestions: [] })],
]);

export async function runDemoServerFn(fn: unknown, data: unknown) {
  const h = handlers.get(fn);
  if (!h) throw new DemoBlockedError("This action");
  // Clone so React Query sees fresh objects and callers can't mutate the store.
  return structuredClone(await h(data));
}
