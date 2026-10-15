import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { SEED_DUAS } from "./dua-seed";
import { DUA_LIBRARY } from "./dua-library";

// Adds any library duas the user doesn't have yet (matched by title). Never removes or overwrites.
export const syncDuaLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing, error } = await supabase.from("duas").select("title").eq("user_id", userId);
    if (error) throw error;
    const have = new Set((existing ?? []).map(r => String(r.title).trim().toLowerCase()));
    const missing = DUA_LIBRARY.filter(d => !have.has(d.title.toLowerCase()));
    if (missing.length) {
      const { error: insErr } = await supabase.from("duas").insert(missing.map(d => ({ ...d, user_id: userId })));
      if (insErr) throw insErr;
    }
    return { added: missing.length };
  });

// ---------- Profile ----------
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { display_name?: string; latitude?: number; longitude?: number; location_label?: string; theme?: string; onboarding_complete?: boolean; calc_method?: string; madhab?: string; zakat_anniversary?: string | null; quran_daily_goal?: number | null; ramadan_fasts_owed?: number | null; khatm_target?: string | null; khatm_start?: string | null }) => d)
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
    const { data: existing, error: readError } = await context.supabase.from("worship_logs")
      .select("*").eq("user_id", context.userId).eq("log_date", data.log_date).maybeSingle();
    if (readError) throw readError;
    const payload: Record<string, any> = { ...existing, ...data, user_id: context.userId };
    if (payload.excused && ["Menstruation", "Postpartum"].includes(String(payload.excuse_type ?? ""))) {
      for (const prayer of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) payload[`${prayer}_status`] = "excused";
    }
    const { data: row, error } = await context.supabase
      .from("worship_logs").upsert(payload, { onConflict: "user_id,log_date" }).select().single();
    if (error) throw error;
    // Excused days never generate makeup obligations, even if an older status was marked missed.
    if (row.excused && ["Menstruation", "Postpartum"].includes(row.excuse_type ?? "")) {
      const { error: qErr } = await context.supabase.from("qada_prayers").delete()
        .eq("user_id", context.userId).eq("missed_date", data.log_date);
      if (qErr) throw qErr;
    }
    const labels: Record<string, string> = { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };
    let qadaAdded: string | null = null;
    for (const p of Object.keys(labels)) {
      const key = `${p}_status`;
      if (!row.excused && !(key in data)) continue;
      if (!row.excused && row[key as keyof typeof row] === "missed") {
        const { error: qErr } = await context.supabase.from("qada_prayers").insert({ user_id: context.userId, prayer: labels[p], missed_date: data.log_date, auto_logged: true, notes: "Added from Salah log" });
        if (!qErr) qadaAdded = labels[p];
      } else {
        let q = context.supabase.from("qada_prayers").delete().eq("user_id", context.userId).eq("prayer", labels[p]).eq("missed_date", data.log_date).eq("auto_logged", true);
        if (!row.excused) q = q.eq("completed", false);
        const { error: qErr } = await q;
        if (qErr) throw qErr;
      }
    }
    return { ...row, qadaAdded };
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
    if (data.missed_date) {
      const { data: log, error: readError } = await context.supabase.from("worship_logs")
        .select("excused,excuse_type").eq("user_id", context.userId).eq("log_date", data.missed_date).maybeSingle();
      if (readError) throw readError;
      if (log?.excused && ["Menstruation", "Postpartum"].includes(log.excuse_type ?? "")) {
        throw new Error("No Qada is due for prayers excused by menstruation or postpartum recovery.");
      }
    }
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
    const { data } = await context.supabase.from("quran_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(5000);
    return data ?? [];
  });

export const createQuranLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; surah?: string; juz?: number; pages?: number; minutes?: number; tafsir?: boolean; reflection?: string; verses_completed?: string; completed_at?: string; auto_logged?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("quran_logs")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

export const listQuranStudyGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("quran_study_goals")
      .select("*").eq("user_id", context.userId)
      .order("completed", { ascending: true }).order("goal_date", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const createQuranStudyGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goal_date: string; surah_number: number; surah_name: string; start_ayah: number; end_ayah: number; note?: string }) =>
    z.object({
      goal_date: z.string().date(),
      surah_number: z.number().int().min(1).max(114),
      surah_name: z.string().trim().min(1).max(100),
      start_ayah: z.number().int().positive(),
      end_ayah: z.number().int().positive(),
      note: z.string().trim().max(500).optional(),
    }).refine(value => value.end_ayah >= value.start_ayah, { message: "The ending ayah must come after the starting ayah." }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("quran_study_goals")
      .insert({ ...data, last_completed_ayah: 0, completed: false, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

export const updateQuranStudyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; ayah: number }) => z.object({ id: z.string().uuid(), ayah: z.number().int().positive() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: goal, error: readError } = await context.supabase.from("quran_study_goals")
      .select("start_ayah,end_ayah,last_completed_ayah").eq("id", data.id).eq("user_id", context.userId).single();
    if (readError) throw readError;
    if (data.ayah < goal.start_ayah || data.ayah > goal.end_ayah) return goal;
    const progress = Math.max(goal.last_completed_ayah, data.ayah);
    const { data: row, error } = await context.supabase.from("quran_study_goals")
      .update({ last_completed_ayah: progress, completed: progress >= goal.end_ayah })
      .eq("id", data.id).eq("user_id", context.userId).select().single();
    if (error) throw error;
    return row;
  });

export const setQuranStudyGoalComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; completed: boolean }) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: goal, error: readError } = await context.supabase.from("quran_study_goals")
      .select("start_ayah,end_ayah").eq("id", data.id).eq("user_id", context.userId).single();
    if (readError) throw readError;
    const { data: row, error } = await context.supabase.from("quran_study_goals")
      .update({ completed: data.completed, last_completed_ayah: data.completed ? goal.end_ayah : 0 })
      .eq("id", data.id).eq("user_id", context.userId).select().single();
    if (error) throw error;
    return row;
  });

export const deleteQuranStudyGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("quran_study_goals").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Fasting ----------
export const listFasting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("fasting_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(5000);
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
    const { data } = await context.supabase.from("dhikr_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(5000);
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
  .inputValidator((d: { id?: string; title: string; arabic?: string; transliteration?: string; translation?: string; source?: string; category?: string; when_to_recite?: string; favorited?: boolean; personal_note?: string; is_custom?: boolean }) => d)
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

export const listAnsweredDuas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("answered_duas").select("*").eq("user_id", context.userId)
      .order("answered_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createAnsweredDua = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; category: string; dua_text?: string; answered_date: string; reflection?: string }) =>
    z.object({
      title: z.string().trim().min(1).max(160),
      category: z.string().trim().min(1).max(80),
      dua_text: z.string().max(4000).optional(),
      answered_date: z.string().date(),
      reflection: z.string().max(4000).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("answered_duas")
      .insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
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

export const listZakatPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("zakat_payments").select("*").eq("user_id", context.userId).order("paid_on", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const recordZakatPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { zakat_entry_id: string; amount: number; paid_on: string; note?: string }) => z.object({
    zakat_entry_id: z.string().uuid(), amount: z.number().positive().finite(), paid_on: z.string().date(), note: z.string().max(500).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: entry, error: entryError } = await context.supabase.from("zakat_entries").select("id,zakat_due").eq("id", data.zakat_entry_id).eq("user_id", context.userId).single();
    if (entryError) throw entryError;
    const { data: previous, error: listError } = await context.supabase.from("zakat_payments").select("amount").eq("zakat_entry_id", entry.id).eq("user_id", context.userId);
    if (listError) throw listError;
    const already = (previous ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    if (already + data.amount > Number(entry.zakat_due ?? 0) + 0.001) throw new Error("Payment exceeds the amount due.");
    const { data: payment, error } = await context.supabase.from("zakat_payments").insert({ ...data, user_id: context.userId }).select().single();
    if (error) throw error;
    if (already + data.amount >= Number(entry.zakat_due ?? 0) - 0.001) {
      const { error: updateError } = await context.supabase.from("zakat_entries").update({ paid: true, date_paid: data.paid_on }).eq("id", entry.id).eq("user_id", context.userId);
      if (updateError) throw updateError;
    }
    return payment;
  });

export const listSadaqah = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("sadaqah_logs").select("*").eq("user_id", context.userId).order("log_date", { ascending: false }).limit(200);
    return data ?? [];
  });

export const createSadaqah = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { log_date: string; amount: number; cause?: string; notes?: string; ramadan?: boolean; kind?: "sadaqah" | "zakat"; zakat_entry_id?: string }) => z.object({
    log_date: z.string(), amount: z.number().positive(), cause: z.string().max(200).optional(), notes: z.string().max(1000).optional(),
    ramadan: z.boolean().optional(), kind: z.enum(["sadaqah", "zakat"]).optional(), zakat_entry_id: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { zakat_entry_id, ...rest } = data;
    let zakat_payment_id: string | null = null;
    if (rest.kind === "zakat") {
      if (!zakat_entry_id) throw new Error("Choose which Zakat entry this payment is for");
      const { data: entry } = await context.supabase.from("zakat_entries").select("id, zakat_due").eq("id", zakat_entry_id).eq("user_id", context.userId).maybeSingle();
      if (!entry) throw new Error("Zakat entry not found");
      const { data: prior } = await context.supabase.from("zakat_payments").select("amount").eq("zakat_entry_id", entry.id).eq("user_id", context.userId);
      const already = (prior ?? []).reduce((s, p) => s + Number(p.amount), 0);
      const { data: payment, error: pErr } = await context.supabase.from("zakat_payments")
        .insert({ user_id: context.userId, zakat_entry_id: entry.id, amount: rest.amount, paid_on: rest.log_date, note: rest.cause ?? null }).select().single();
      if (pErr) throw pErr;
      zakat_payment_id = payment.id;
      if (already + rest.amount >= Number(entry.zakat_due ?? 0) - 0.001) {
        await context.supabase.from("zakat_entries").update({ paid: true, date_paid: rest.log_date }).eq("id", entry.id).eq("user_id", context.userId);
      }
    }
    const { data: row, error } = await context.supabase.from("sadaqah_logs")
      .insert({ ...rest, kind: rest.kind ?? "sadaqah", zakat_payment_id, user_id: context.userId }).select().single();
    if (error) throw error;
    return row;
  });

const USER_DATA_TABLES = [
  "worship_logs", "qada_prayers", "quran_logs", "fasting_logs", "dhikr_logs",
  "duas", "answered_duas", "reflections", "goals",
  "zakat_payments", "zakat_entries", "sadaqah_logs", "quran_study_goals",
] as const;

const WORSHIP_BACKUP_TABLES = ["worship_logs", "qada_prayers", "quran_logs", "fasting_logs", "dhikr_logs"] as const;

export const listWorshipBackups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("worship_backups")
      .select("id,label,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createWorshipBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const snapshot: Record<string, unknown[]> = {};
    for (const table of WORSHIP_BACKUP_TABLES) {
      const rows: unknown[] = [];
      for (let from = 0; ; from += 500) {
        const { data, error } = await context.supabase.from(table).select("*")
          .eq("user_id", context.userId).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, from + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) break;
      }
      snapshot[table] = rows;
    }
    const { data, error } = await context.supabase.from("worship_backups")
      .insert({ user_id: context.userId, label: `Worship backup · ${new Date().toISOString().slice(0, 10)}`, snapshot: snapshot as Json }).select("id,label,created_at").single();
    if (error) throw error;
    return data;
  });

export const restoreWorshipBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("restore_worship_backup", { backup_id: data.id });
    if (error) throw error;
    return result;
  });

export const deleteWorshipBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("worship_backups")
      .delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const exportAllData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- export bundle mixes table shapes
    const out: Record<string, any> = {
      app: "Muslim HQ",
      exported_at: new Date().toISOString(),
      user_id: context.userId,
    };
    const { data: profile, error: pErr } = await context.supabase
      .from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (pErr) throw pErr;
    out.profile = profile ?? null;
    for (const table of USER_DATA_TABLES) {
      const { data, error } = await context.supabase
        .from(table as any).select("*").eq("user_id", context.userId);
      if (error) throw error;
      out[table] = data ?? [];
    }
    return out;
  });

export const resetAllData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tables = [...USER_DATA_TABLES, "worship_backups"];
    for (const table of tables) {
      const { error } = await context.supabase.from(table as any).delete().eq("user_id", context.userId);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw error;
    return { ok: true };
  });
