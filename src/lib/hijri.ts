// Hijri date via Intl (Umm al-Qura calendar, widely supported).
export function formatHijri(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatGregorian(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekStartISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // week starts Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hijriParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { month: get("month"), year: get("year") };
}

/** Ramadan (Umm al-Qura) start/end in the given Gregorian year. */
export function ramadanRange(gregYear = new Date().getFullYear()) {
  let start: Date | null = null, end: Date | null = null, hYear = 0;
  for (let d = new Date(gregYear, 0, 1, 12); d.getFullYear() === gregYear; d.setDate(d.getDate() + 1)) {
    const h = hijriParts(d);
    if (h.month === 9) {
      if (!start) { start = new Date(d); hYear = h.year; }
      end = new Date(d);
    } else if (start) break;
  }
  if (!start || !end) return null;
  return { start: isoOf(start), end: isoOf(end), hijriYear: hYear, days: Math.round((end.getTime() - start.getTime()) / 86400000) + 1 };
}
