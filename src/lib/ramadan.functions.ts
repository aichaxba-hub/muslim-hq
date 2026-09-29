import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sb = (c: any) => c.supabase as any;

export const getRamadanPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await sb(context).from("ramadan_plans").select("*").eq("user_id", context.userId).maybeSingle();
    return data as any;
  });

export const saveRamadanPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    salah_goal: z.string().max(500).nullable(), quran_goal: z.string().max(500).nullable(),
    fasting_goal: z.string().max(500).nullable(), dua_goal: z.string().max(500).nullable(),
    intention: z.string().max(1000).nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await sb(context).from("ramadan_plans").upsert({ ...data, user_id: context.userId }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const listRamadanChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await sb(context).from("ramadan_checklist").select("log_date,items").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(60);
    return (data ?? []) as { log_date: string; items: Record<string, boolean> }[];
  });

export const saveRamadanChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), items: z.record(z.string(), z.boolean()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await sb(context).from("ramadan_checklist").upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,log_date" });
    if (error) throw error;
    return { ok: true };
  });
