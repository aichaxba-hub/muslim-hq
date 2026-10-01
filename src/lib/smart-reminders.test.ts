import { describe, expect, it } from "vitest";
import { daysSinceActivity, isWhiteDayTomorrow, morningAdhkarStreak, pagesLeftToday, qadaLeftToday } from "./smart-reminders";

describe("activity-aware reminder decisions", () => {
  it("recalculates Khatm pages after time passes and stops when today's reading is done", () => {
    const now = new Date(2026, 9, 3, 12);
    expect(pagesLeftToday([], "2026-10-01", "2026-10-01", now)).toBe(21);
    expect(pagesLeftToday([{ log_date: "2026-10-03", pages: 21 }], "2026-10-01", "2026-10-01", now)).toBe(0);
    expect(pagesLeftToday([], null, null, now)).toBe(0);
  });
  it("only reminds for Qada still planned today", () => {
    expect(qadaLeftToday([{ completed: false }, { completed: false }, { completed: true, made_up_date: "2026-10-03" }], 2, "2026-10-03")).toBe(1);
    expect(qadaLeftToday([], 2, "2026-10-03")).toBe(0);
  });
  it("honors local sighting adjustments for the first White Day", () => {
    let found = false;
    for (let day = 1; day <= 31; day++) if (isWhiteDayTomorrow(new Date(2026, 9, day, 12), 0)) found = true;
    expect(found).toBe(true);
  });
  it("celebrates only actual consecutive logged Morning Adhkar days", () => {
    const now = new Date(2026, 9, 3, 10);
    expect(morningAdhkarStreak([{ log_date: "2026-10-03", category: "Morning Adhkar" }, { log_date: "2026-10-02", category: "Morning Adhkar" }, { log_date: "2026-09-30", category: "Morning Adhkar" }], now)).toBe(2);
    expect(morningAdhkarStreak([{ log_date: "2026-10-02", category: "Morning Adhkar" }], now)).toBe(0);
  });
  it("never calls new accounts inactive and detects a real gap", () => {
    expect(daysSinceActivity([], new Date(2026, 9, 3))).toBeNull();
    expect(daysSinceActivity(["2026-09-29"], new Date(2026, 9, 3))).toBe(4);
  });
});