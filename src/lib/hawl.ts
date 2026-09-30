/** A Hawl is one lunar year (approximately 354.367 days). */
export function hawlProgress(anniversary: string, now = new Date()) {
  const start = new Date(`${anniversary}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const lunarYear = 354.367 * 86400000;
  const elapsed = now.getTime() - start.getTime();
  const cycles = Math.max(0, Math.ceil(elapsed / lunarYear));
  const due = new Date(start.getTime() + cycles * lunarYear);
  const previous = new Date(due.getTime() - lunarYear);
  const percent = Math.max(0, Math.min(100, Math.round((now.getTime() - previous.getTime()) / lunarYear * 100)));
  const daysRemaining = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
  return { due, percent, daysRemaining };
}