// Prayer time computation using adhan.js (browser-side).
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_LABEL: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export interface Coords { latitude: number; longitude: number; label?: string }

// Default: Mecca
export const DEFAULT_COORDS: Coords = { latitude: 21.4225, longitude: 39.8262, label: "Makkah" };

export function computeTimes(coords: Coords, date = new Date()) {
  const c = new Coordinates(coords.latitude, coords.longitude);
  const params = CalculationMethod.MoonsightingCommittee();
  const pt = new PrayerTimes(c, date, params);
  return {
    fajr: pt.fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  } as Record<PrayerName, Date>;
}

export function nextPrayer(coords: Coords, now = new Date()) {
  const today = computeTimes(coords, now);
  for (const p of PRAYERS) {
    if (today[p].getTime() > now.getTime()) {
      return { name: p, at: today[p] };
    }
  }
  // After Isha — next is tomorrow's Fajr
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const t = computeTimes(coords, tomorrow);
  return { name: "fajr" as PrayerName, at: t.fajr };
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatCountdown(ms: number) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
