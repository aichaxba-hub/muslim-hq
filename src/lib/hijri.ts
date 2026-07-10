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
