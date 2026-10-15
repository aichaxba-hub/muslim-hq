import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ReviewInsights = { praise: string[]; insights: string[]; recommendations: string[]; encouragement: string };

const EMPTY: ReviewInsights = { praise: [], insights: [], recommendations: [], encouragement: "" };

export const getReviewInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ period: z.string().regex(/^(week of \d{4}-\d{2}-\d{2}|month \d{4}-\d{2}|year \d{4}|lifetime)$/), stats: z.record(z.string(), z.any()) }).parse(d))
  .handler(async ({ data }): Promise<{ insights: ReviewInsights; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { insights: EMPTY, error: "Insights aren't configured yet." };
    const statsJson = JSON.stringify(data.stats).slice(0, 9000);

    const prompt = `You are a warm, gentle Muslim companion inside the "Muslim HQ" app. Its motto: "your deen, your pace". Review the user's worship numbers for ${data.period} and respond with care.
Rules: never guilt, shame, threaten or compare to others. Excused days (menstruation, postpartum, illness, travel) are never a shortcoming — never mention them negatively. Celebrate real effort specifically, citing numbers. Recommendations must be small, concrete and doable (e.g. "pair one Qada with Fajr"). You may briefly reference a well-known authentic hadith or ayah meaning, without inventing sources. Personalise deeply: the "journey" object is this person's real long-term habit profile (strongest prayer, prayer needing care, weekday rhythm, favourite dhikr, current streak, last 30 vs previous 30 days, active goals, Quran/Khatm targets). Ground every point in it or the period stats — name their actual prayers, phrases, goals and trends; never give generic advice that ignores their data. Compare to their own past only. If data is sparse, encourage a gentle beginning.
Reply ONLY with JSON: {"praise":["..."],"insights":["..."],"recommendations":["..."],"encouragement":"..."} — 1-3 items each, each under 35 words; encouragement one or two sentences.

Stats: ${statsJson}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { insights: EMPTY, error: "Too many requests right now — please try again in a moment." };
      if (res.status === 402) return { insights: EMPTY, error: "AI credits have run out. Please add credits to continue." };
      if (res.status === 403) return { insights: EMPTY, error: "AI access is currently blocked for this workspace." };
      return { insights: EMPTY, error: "Insights couldn't load. Please try again." };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch { /* ignore */ }
      }
    }

    try {
      const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      const list = (v: unknown) => (Array.isArray(v) ? v : []).map((s) => String(s).slice(0, 400)).filter(Boolean).slice(0, 3);
      return { insights: { praise: list(j.praise), insights: list(j.insights), recommendations: list(j.recommendations), encouragement: String(j.encouragement ?? "").slice(0, 500) } };
    } catch {
      return { insights: EMPTY, error: "Couldn't read the insights. Please try again." };
    }
  });
