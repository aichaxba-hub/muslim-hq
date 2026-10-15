/** Consecutive days with a logged dhikr session (same source as Review). Today may still be pending. */
export function dhikrStreak(sessions: { log_date: string; count?: number | null }[], now = new Date()) {
  const days = new Set(sessions.filter(s => (s.count ?? 0) > 0).map(s => s.log_date));
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) count++;
    else if (i > 0) break;
  }
  return count;
}
