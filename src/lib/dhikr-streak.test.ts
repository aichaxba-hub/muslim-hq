import { expect, test } from "vitest";
import { dhikrStreak } from "./dhikr-streak";

const now = new Date(2026, 9, 15, 12);
const iso = (daysAgo: number) => { const d = new Date(2026, 9, 15); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };

test("counts consecutive days of logged dhikr sessions", () => {
  expect(dhikrStreak([{ log_date: iso(0), count: 33 }, { log_date: iso(1), count: 10 }, { log_date: iso(3), count: 5 }], now)).toBe(2);
});

test("today without a session doesn't break yesterday's streak", () => {
  expect(dhikrStreak([{ log_date: iso(1), count: 33 }, { log_date: iso(2), count: 33 }], now)).toBe(2);
});
