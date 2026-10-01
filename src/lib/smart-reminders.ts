// Pure logic for smart, encouraging reminders. No DOM/browser access so it stays testable.
import type { ReminderSettings } from "./reminders";
import type { IslamicEvent } from "./hijri";

export type SmartReminder = { key: string; title: string; body: string };

export interface SmartReminderInput {
  settings: ReminderSettings;
  /** Daily digest window open (e.g. from the evening check-in time onwards). */
  digestOpen: boolean;
  quran: { ayatToday: number; goal: number };
  qada: { plannedPerDay: number; doneToday: number; remaining: number };
  events: IslamicEvent[];
  /** Consecutive days of dhikr, counting today or yesterday as the latest. */
  dhikrStreak: number;
  /** Days since the last logged prayer day, or null when nothing is logged yet. */
  daysSinceWorship: number | null;
}

/**
 * Builds today's gentle nudges. Language stays warm and non-judgmental —
 * progress is named, never withheld or threatened.
 */
export function buildSmartReminders(input: SmartReminderInput): SmartReminder[] {
  const { settings, quran, qada, events, dhikrStreak, daysSinceWorship, digestOpen } = input;
  const out: SmartReminder[] = [];

  // Islamic calendar events — the evening before, and on the day.
  if (settings.events) {
    for (const e of events) {
      if (e.daysUntil === 1) out.push({ key: `event-soon-${e.name}`, title: `${e.name} begins tomorrow`, body: e.note });
      else if (e.daysUntil === 0) out.push({ key: `event-today-${e.name}`, title: `${e.name} — today`, body: e.note });
    }
  }

  if (!digestOpen) return out;

  if (settings.quran && quran.goal > 0) {
    const left = quran.goal - quran.ayatToday;
    if (left > 0 && quran.ayatToday > 0) out.push({ key: "quran-left", title: "A little more Qur'an", body: `You have ${left} ${left === 1 ? "ayah" : "ayat"} left to reach today's Qur'an goal.` });
    else if (left > 0) out.push({ key: "quran-start", title: "Your Qur'an goal is waiting", body: `${quran.goal} ${quran.goal === 1 ? "ayah" : "ayat"} today — even a few lines count.` });
    else out.push({ key: "quran-done", title: "Qur'an goal reached", body: `${quran.ayatToday} ayat today, masha'Allah. May Allah accept it.` });
  }

  if (settings.qada && qada.remaining > 0 && qada.plannedPerDay > 0 && qada.doneToday < qada.plannedPerDay) {
    const left = qada.plannedPerDay - qada.doneToday;
    out.push({
      key: "qada-plan",
      title: left === 1 ? "You planned one Qada prayer today" : `You planned ${left} Qada prayers today`,
      body: "Make it up whenever you can — Allah is Most Merciful.",
    });
  }

  if (settings.streak && dhikrStreak >= 3) {
    out.push({ key: `streak-${dhikrStreak}`, title: "Your dhikr rhythm is holding", body: `You've kept your adhkar ${dhikrStreak} days in a row. Keep it gentle and steady.` });
  }

  if (settings.gentle && daysSinceWorship !== null && daysSinceWorship >= 3) {
    out.push({ key: "gentle-reset", title: "Begin again today", body: "It's been a few days since you logged your worship. There's no catching up to do — just start again today." });
  }

  return out;
}

/** Longest run of consecutive days ending today or yesterday. */
export function consecutiveDayStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  const day = (iso: string, delta: number) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  };
  let cursor = set.has(today) ? today : day(today, -1);
  if (!set.has(cursor)) return 0;
  let n = 0;
  while (set.has(cursor)) { n++; cursor = day(cursor, -1); }
  return n;
}

/** Whole days between two ISO dates (later - earlier). */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T12:00:00`).getTime();
  const b = new Date(`${toISO}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}
