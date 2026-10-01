// Hijri date via Intl (Umm al-Qura calendar, widely supported).
export function formatHijri(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatGregorian(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekStartISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // week starts Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hijriParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { month: get("month"), year: get("year") };
}

/** Ramadan (Umm al-Qura) start/end in the given Gregorian year. */
export function ramadanRange(gregYear = new Date().getFullYear()) {
  let start: Date | null = null, end: Date | null = null, hYear = 0;
  for (let d = new Date(gregYear, 0, 1, 12); d.getFullYear() === gregYear; d.setDate(d.getDate() + 1)) {
    const h = hijriParts(d);
    if (h.month === 9) {
      if (!start) { start = new Date(d); hYear = h.year; }
      end = new Date(d);
    } else if (start) break;
  }
  if (!start || !end) return null;
  return { start: isoOf(start), end: isoOf(end), hijriYear: hYear, days: Math.round((end.getTime() - start.getTime()) / 86400000) + 1 };
}

// ---- Hijri adjustment (local moon sighting) + Islamic events ----
export const HIJRI_OFFSET_KEY = "mhq-hijri-offset";
export const HIJRI_MONTHS = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qa'dah", "Dhul Hijjah"];

function shift(d: Date, days: number) { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + days); return x; }

export function hijriDay(d: Date, offset = 0) {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(shift(d, offset));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { day: get("day"), month: get("month"), year: get("year") };
}

export function formatHijriAdjusted(date = new Date(), offset = 0) {
  try { const h = hijriDay(date, offset); return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}`; } catch { return formatHijri(date); }
}

type EventDef = { name: string; month: number; from: number; to: number; note: string };
const EVENTS: EventDef[] = [
  { name: "White Days", month: 0, from: 13, to: 15, note: "Sunnah fasts on the 13th–15th" },
  { name: "Islamic New Year", month: 1, from: 1, to: 1, note: "1 Muharram" },
  { name: "Ashura", month: 1, from: 10, to: 10, note: "Fast the 10th (with the 9th or 11th)" },
  { name: "Ramadan", month: 9, from: 1, to: 30, note: "The month of fasting begins" },
  { name: "Laylat al-Qadr nights", month: 9, from: 21, to: 29, note: "Seek it in the last ten nights" },
  { name: "Eid al-Fitr", month: 10, from: 1, to: 1, note: "1 Shawwal" },
  { name: "Six days of Shawwal", month: 10, from: 2, to: 29, note: "Fast any six days after Eid" },
  { name: "First ten days of Dhul Hijjah", month: 12, from: 1, to: 10, note: "The best days of the year" },
  { name: "Day of Arafah", month: 12, from: 9, to: 9, note: "Fasting expiates two years of sins" },
  { name: "Eid al-Adha", month: 12, from: 10, to: 10, note: "10 Dhul Hijjah" },
];

export type IslamicEvent = { name: string; note: string; start: Date; daysUntil: number; ongoing: boolean; label: string };

function eventSpanDays(e: IslamicEvent): [number, number] {
  const def = EVENTS.find(d => d.name === e.name);
  const duration = def ? def.to - def.from : 0; // "month begins" reminder is a single day
  return [e.daysUntil, e.daysUntil + duration];
}

/** Upcoming/ongoing events within `horizon` days, using the adjusted Hijri calendar. */
export function upcomingIslamicEvents(now = new Date(), offset = 0, horizon = 400): IslamicEvent[] {
  const found = new Map<string, IslamicEvent>();
  const today = hijriDay(now, offset);
  for (let i = 0; i <= horizon; i++) {
    const d = shift(now, i);
    const h = hijriDay(d, offset);
    for (const e of EVENTS) {
      if (found.has(e.name)) continue;
      if (e.month !== 0 && h.month !== e.month) continue;
      if (h.day < e.from || h.day > e.to) continue;
      const ongoing = i === 0;
      if (!ongoing && h.day !== e.from) continue;
      const mName = HIJRI_MONTHS[(e.month || h.month) - 1];
      const range = e.from === e.to ? `${e.from} ${mName}` : `${e.from}–${e.to} ${mName}`;
      found.set(e.name, { name: e.name, note: e.note, start: d, daysUntil: i, ongoing, label: range });
    }
  }
  // Islamic month reminder: next 1st of month
  for (let i = 1; i <= 31; i++) {
    const h = hijriDay(shift(now, i), offset);
    if (h.day === 1 && h.month !== today.month) {
      found.set("month", { name: `${HIJRI_MONTHS[h.month - 1]} begins`, note: "New Islamic month — look out for the moon", start: shift(now, i), daysUntil: i, ongoing: false, label: `1 ${HIJRI_MONTHS[h.month - 1]}` });
      break;
    }
  }
  return [...found.values()].sort((a, b) => a.daysUntil - b.daysUntil);
}
