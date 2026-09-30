/** A Hawl is one lunar year (approximately 354.367 days). */
export function hawlProgress(anniversary: string, now = new Date()) {
  const start = new Date(`${anniversary}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const lunarYear = 354.367 * 86400000;
  const elapsed = now.getTime() - start.getTime();
  if (elapsed < 0) return { due: start, percent: 0, daysRemaining: Math.ceil(-elapsed / 86400000) };
  const cycles = Math.max(0, Math.ceil(elapsed / lunarYear));
  const due = new Date(start.getTime() + cycles * lunarYear);
  const previous = new Date(due.getTime() - lunarYear);
  const percent = Math.max(0, Math.min(100, Math.round((now.getTime() - previous.getTime()) / lunarYear * 100)));
  const daysRemaining = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
  return { due, percent, daysRemaining };
}

/** In-app reminder derived from the saved anniversary; no background job required. */
export function hawlReminder(anniversary: string, now = new Date()) {
  const progress = hawlProgress(anniversary, now);
  if (!progress || progress.daysRemaining > 30) return null;
  return {
    ...progress,
    message: progress.daysRemaining === 0
      ? "Your Zakat anniversary is today. Review your wealth and what you owe."
      : `Your Zakat anniversary is in ${progress.daysRemaining} ${progress.daysRemaining === 1 ? "day" : "days"}. Review your wealth and prepare to give.`,
  };
}