// Drop-in for useServerFn: in demo mode, calls are answered from the in-memory
// demo store and never reach the server.
import { useServerFn as useRealServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { toast } from "sonner";
import { DemoBlockedError, isDemoMode } from "./demo-mode";
import { runDemoServerFn } from "./demo-store";

export function useServerFn<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  const real = useRealServerFn(fn as any) as unknown as T;
  return useCallback(async (opts?: { data?: unknown }) => {
    if (!isDemoMode()) return real(opts as any);
    try {
      return await runDemoServerFn(fn, opts?.data);
    } catch (e) {
      if (e instanceof DemoBlockedError) toast.info(e.message);
      throw e;
    }
  }, [real, fn]) as unknown as T;
}
