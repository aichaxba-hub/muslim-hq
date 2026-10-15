import { expect, test } from "vitest";
import { refreshSchedule, isRefreshDue } from "./fitr-refresh";
test("refresh is 30 days before Ramadan 1448", () => { const s = refreshSchedule(new Date("2026-10-15")); console.log(s); expect(s.hijriYear).toBe(1448); expect((s.ramadan.getTime()-s.refreshOn.getTime())/864e5).toBe(30); });
test("not due before window, due after", () => { expect(isRefreshDue(1447, new Date("2026-10-15"))).toBe(false); expect(isRefreshDue(1447, new Date("2027-02-05"))).toBe(true); expect(isRefreshDue(1448, new Date("2027-02-05"))).toBe(false); });
