import { hijriDay } from "@/lib/hijri";

type QuranEntry = { log_date: string; pages?: number | null };
type QadaEntry = { completed: boolean | null; made_up_date?: string | null };
type DhikrEntry = { log_date: string; category: string | null };

export function pagesLeftToday(logs: QuranEntry[], target: string | null, start: string | null, now: Date): number {
  if (!target || !start) return 0;
  const today = localISO(now);
  const [year, month] = target.split("-").map(Number);
  if (!year || !month || today < start || today > localISO(new Date(year, month, 0, 12))) return 0;
  const read = logs.filter(row => row.log_date >= start).reduce((sum, row) => sum + Math.max(0, Number(row.pages) || 0), 0);
  const readToday = logs.filter(row => row.log_date === today).reduce((sum, row) => sum + Math.max(0, Number(row.pages) || 0), 0);
  const end = Date.UTC(year, month, 0);
  const current = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.max(1, Math.round((end - current) / 86400000) + 1);
  return Math.max(0, Math.ceil(Math.max(0, 604 - read + readToday) / daysLeft) - readToday);
}

export function qadaLeftToday(rows: QadaEntry[], dailyPlan: number, today: string): number {
  const pending = rows.filter(row => !row.completed).length;
  const completedToday = rows.filter(row => row.completed && row.made_up_date === today).length;
  return Math.min(pending, Math.max(0, dailyPlan - completedToday));
}

export function isWhiteDayTomorrow(now: Date, offset: number): boolean {
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  return hijriDay(tomorrow, offset).day === 13;
}

export function localISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function morningAdhkarStreak(rows: DhikrEntry[], now: Date): number {
  const dates = new Set(rows.filter(row => row.category?.toLowerCase() === "morning adhkar").map(row => row.log_date));
  const day = new Date(now); day.setHours(12, 0, 0, 0);
  if (!dates.has(localISO(day))) return 0;
  let count = 0;
  while (dates.has(localISO(day))) { count++; day.setDate(day.getDate() - 1); }
  return count;
}

export function daysSinceActivity(dates: string[], now: Date): number | null {
  const today = localISO(now);
  const latest = dates.filter(date => date <= today).sort().at(-1);
  if (!latest) return null;
  const last = new Date(`${latest}T12:00:00`);
  if (Number.isNaN(last.getTime())) return null;
  return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(last.getFullYear(), last.getMonth(), last.getDate())) / 86400000);
}