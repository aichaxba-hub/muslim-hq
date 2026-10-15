// Yearly Zakat al-Fitr price refresh schedule. Pure and client-safe.
// Prices refresh REFRESH_DAYS_BEFORE days ahead of 1 Ramadan (Umm al-Qura calendar).

export const REFRESH_DAYS_BEFORE = 30;
export const LB_PER_KG = 1 / 0.45359237;

const hijriFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });

function hijriParts(d: Date) {
  const parts = hijriFmt.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, ""));
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** Next (or current) 1 Ramadan on/after `from`, with its Hijri year. */
export function nextRamadanStart(from: Date = new Date()): { date: Date; hijriYear: number } {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 0; i < 400; i++) {
    const h = hijriParts(d);
    if (h.month === 9 && h.day === 1) return { date: new Date(d), hijriYear: h.year };
    d.setUTCDate(d.getUTCDate() + 1);
  }
  throw new Error("Ramadan not found");
}

/** Refresh date for the upcoming Ramadan. */
export function refreshSchedule(from: Date = new Date()) {
  const ramadan = nextRamadanStart(from);
  const refreshOn = new Date(ramadan.date);
  refreshOn.setUTCDate(refreshOn.getUTCDate() - REFRESH_DAYS_BEFORE);
  return { ramadan: ramadan.date, hijriYear: ramadan.hijriYear, refreshOn };
}

/** True when prices last refreshed for an older Ramadan and the refresh window has opened. */
export function isRefreshDue(storedHijriYear: number, now: Date = new Date()) {
  const s = refreshSchedule(now);
  return storedHijriYear < s.hijriYear && now.getTime() >= s.refreshOn.getTime();
}

/** Barley has no official retail series; scale its baseline by the cereals CPI change. */
export function scaleByIndex(baselinePrice: number, baselineIndex: number, latestIndex: number) {
  return Math.round(baselinePrice * (latestIndex / baselineIndex) * 100) / 100;
}

export const perLbToPerKg = (perLb: number) => Math.round(perLb * LB_PER_KG * 100) / 100;
