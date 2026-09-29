import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SEED_DUAS } from "./dua-seed";

// ---------- Profile ----------
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { display_name?: string; latitude?: number; longitude?: number; location_label?: string; theme?: string; onboarding_complete?: boolean; calc_method?: string; madhab?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles").update(data).eq("id", context.userId).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Seed initial data ----------
export const ensureSeeded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("seeded").eq("id", userId).maybeSingle();
    if (prof?.seeded) return { seeded: false };

    // Seed duas
    await supabase.from("duas").insert(SEED_DUAS.map(d => ({ ...d, user_id: userId })));

    // Sample worship logs (last 5 days)
    const logs = [];
    const statuses = ["on_time", "late", "on_time", "qada", "on_time"];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      logs.push({
        user_id: userId, log_date: iso,
        fajr_status: statuses[i % 5], dhuhr_status: "on_time", asr_status: i === 3 ? "late" : "on_time",
        maghrib_status: "on_time", isha_status: i === 2 ? "qada" : "on_time",
        dhikr_count: 33 * (i + 1), quran_pages: i * 2, quran_minutes: 10 + i * 3,
        intention: i === 1 ? "Patience in speech" : null, remembered_allah: true,
      });
    }
    await supabase.from("worship_logs").insert(logs);

    // Sample goals
    await supabase.from("goals").insert([
      { user_id: userId, title: "Memorize Surah Al-Mulk", category: "Memorization", why: "Protection in the grave", quarter: "Q1", status: "In Progress" },
      { user_id: userId, title: "Pray Tahajjud 3x a week", category: "Deen", why: "Nearness to Allah in the last third of the night", quarter: "Q1", status: "Not Started" },
    ]);

    // Sample reflections
    const today = new Date();
    await supabase.from("reflections").insert([
      { user_id: userId, entry_date: today.toISOString().slice(0, 10),
        mood: "grateful", closest_to_allah: "Reading Surah Ar-Rahman in the morning.",
        fell_short: "Missed some sunnah prayers.",
        wins: "Consistent Fajr all week.", struggles: "Late Isha twice.",
        gratitude: "Health, family, and iman.", next_intention: "Sleep earlier to protect Fajr." },
    ]);

    // Sample zakat
    await supabase.from("zakat_entries").insert({
      user_id: userId, year: today.getFullYear(), asset_type: "Cash savings",
      amount: 10000, nisab: 5000, zakat_due: 250, paid: false,
    });

    // Sample qada
    const missed = new Date(); missed.setDate(missed.getDate() - 10);
    await supabase.from("qada_prayers").insert({
      user_id: userId, prayer: "Fajr", missed_date: missed.toISOString().slice(0, 10), completed: false,
    });

    await supabase.from("profiles").update({ seeded: true }).eq("id", userId);
    return { seeded: true };
  });

// ---------- Worship log ----------
export const getWorshipLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string }) => z.object({ date: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("worship_logs").select("*")
      .eq("user_id", context.userId).eq("log_date", data.date).maybeSingle();
    return row;
  });

export const listWorshipLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from?: string; to?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("worship_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false });
    if (data.from) q = q.gte("log_date", data.from);
    if (data.to) q = q.lte("log_date", data.to);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const upsertWorshipLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown> & { log_date: string }) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    const { data: row, error } = await context.supabase
      .from("worship_logs").upsert(payload, { onConflict: "user_id,log_date" }).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Qada ----------
export const listQada = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("qada_prayers").select("*").eq("user_id", context.userId).order("missed_date", { ascending: false });
    return data ?? [];
  });

export const createQada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prayer: string; missed_date?: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("qada_prayers")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

export const updateQada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; completed?: boolean; made_up_date?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { data: row, error } = await context.supabase.from("qada_prayers")
      .update(rest).eq("id", id).eq("user_id", context.userId).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Quran ----------
export const listQuranLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("quran_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(100);
    return data ?? [];
  });

export const createQuranLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; surah?: string; juz?: number; pages?: number; minutes?: number; tafsir?: boolean; reflection?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("quran_logs")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Fasting ----------
export const listFasting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("fasting_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(200);
    return data ?? [];
  });

export const upsertFasting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; fast_type?: string; completed?: boolean; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("fasting_logs")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,log_date" }).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Dhikr ----------
export const listDhikr = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("dhikr_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(200);
    return data ?? [];
  });

export const createDhikr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; category: string; count: number; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("dhikr_logs")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Duas ----------
export const listDuas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("duas").select("*").eq("user_id", context.userId).order("category").order("title");
    return data ?? [];
  });

export const upsertDua = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; title: string; arabic?: string; transliteration?: string; translation?: string; source?: string; category?: string; when_to_recite?: string; favorited?: boolean; personal_note?: string }) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("duas").update(payload).eq("id", data.id).eq("user_id", context.userId).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase.from("duas").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

export const toggleDuaFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; favorited: boolean }) => d)
  .handler(async ({ data, context }) => {
    await context.supabase.from("duas").update({ favorited: data.favorited }).eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- Reflections ----------
export const listReflections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("reflections").select("*").eq("user_id", context.userId).order("entry_date", { ascending: false });
    return data ?? [];
  });

export const createReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown> & { entry_date: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("reflections")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Goals ----------
export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("goals").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
    return data ?? [];
  });

export const upsertGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown> & { title: string; id?: string }) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { data: row, error } = await context.supabase.from("goals").update(payload).eq("id", data.id).eq("user_id", context.userId).select().single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase.from("goals").insert(payload).select().single();
    if (error) throw error;
    return row;
  });

// ---------- Zakat / Sadaqah ----------
export const listZakat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("zakat_entries").select("*").eq("user_id", context.userId).order("year", { ascending: false });
    return data ?? [];
  });

export const createZakat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { year: number; asset_type?: string; amount?: number; nisab?: number; zakat_due?: number; paid?: boolean; date_paid?: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("zakat_entries")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

export const listSadaqah = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("sadaqah_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(200);
    return data ?? [];
  });

export const createSadaqah = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; amount: number; cause?: string; notes?: string; ramadan?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("sadaqah_logs")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });
