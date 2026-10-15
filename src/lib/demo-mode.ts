// Demo mode: an in-memory, per-tab sandbox with fictional sample data.
// Nothing here touches the backend; state lives only in this module and is
// lost on refresh or exit by design.
import { useSyncExternalStore } from "react";

let active = false;
const listeners = new Set<() => void>();

export const DEMO_USER = { id: "00000000-0000-4000-8000-00000000demo".slice(0, 36), email: "demo@example.invalid" };

export function isDemoMode() {
  return active;
}

export function setDemoMode(on: boolean) {
  active = on;
  listeners.forEach((l) => l());
}

export function useDemoMode() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => active,
    () => false,
  );
}

export class DemoBlockedError extends Error {
  constructor(action = "This action") {
    super(`${action} isn't available in demo mode — sample data only.`);
  }
}
