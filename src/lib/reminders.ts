// In-app reminders: scheduled in the open app with browser notifications (plus a toast fallback).
export type ReminderSettings = {
  adhan: boolean;
  preAdhan: boolean;
  preAdhanOffset: number;
  iqamah: boolean;
  iqamahOffset: number;
  evening: boolean;
  eveningTime: string;
  hawl: boolean;
  quran: boolean;
  qada: boolean;
  events: boolean;
  streak: boolean;
  gentle: boolean;
};
export const DEFAULT_REMINDERS: ReminderSettings = {
  adhan: false,
  preAdhan: true,
  preAdhanOffset: 15,
  iqamah: false,
  iqamahOffset: 15,
  evening: false,
  eveningTime: "21:00",
  hawl: true,
  quran: true,
  qada: true,
  events: true,
  streak: true,
  gentle: true,
};
const KEY = "mhq-reminders";

export function loadReminders(): ReminderSettings {
  try { return { ...DEFAULT_REMINDERS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULT_REMINDERS; }
}
export function saveReminders(s: ReminderSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("mhq-reminders"));
}

export async function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(title, { body, icon: "/icon-192.png", tag: title });
    else new Notification(title, { body, icon: "/icon-192.png", tag: title });
    return true;
  } catch { return false; }
}

// Fire at most once per key per day.
export function onceToday(key: string) {
  const k = `mhq-fired-${key}-${new Date().toDateString()}`;
  if (localStorage.getItem(k)) return false;
  localStorage.setItem(k, "1");
  return true;
}
