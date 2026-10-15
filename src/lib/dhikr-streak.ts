/** Local calendar date (YYYY-MM-DD), matching todayISO() used for session log_date values. */
function localISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Consecutive days with a logged dhikr session (same source as Review). Today may still be pending. */
export function dhikrStreak(sessions: { log_date: string; count?: number | null }[], now = new Date()) {
  const days = new Set(sessions.filter(s => (s.count ?? 0) > 0).map(s => s.log_date));
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(localISO(d))) count++;
    else if (i > 0) break;
  }
  return count;
}
