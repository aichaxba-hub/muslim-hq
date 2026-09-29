import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type DuaMatch = { id: string; reason: string };

export const findDuas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ need: z.string().trim().min(3).max(1000) }).parse(d))
  .handler(async ({ data, context }): Promise<{ matches: DuaMatch[]; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { matches: [], error: "The dua finder isn't configured yet." };

    const { data: duas } = await context.supabase
      .from("duas").select("id,title,category,translation,when_to_recite,personal_note")
      .eq("user_id", context.userId).limit(300);
    if (!duas?.length) return { matches: [], error: "Your Dua Vault is empty — add some duas first." };

    const catalog = duas.map((d) => ({ id: d.id, title: d.title, category: d.category, meaning: d.translation?.slice(0, 300), when: d.when_to_recite, note: d.personal_note?.slice(0, 200) }));
    const prompt = `A Muslim describes what they need support with. From THEIR saved duas below, choose up to 5 that best fit, most relevant first. For each, give a short, gentle, non-judgmental reason (max 25 words). Only use ids from the list. Reply ONLY with JSON: {"matches":[{"id":"...","reason":"..."}]}. If none fit, return {"matches":[]}.

Need: """${data.need}"""

Saved duas: ${JSON.stringify(catalog)}`;

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
      if (res.status === 429) return { matches: [], error: "Too many requests right now — please try again in a moment." };
      if (res.status === 402) return { matches: [], error: "AI credits have run out. Please add credits to continue." };
      if (res.status === 403) return { matches: [], error: "AI access is currently blocked for this workspace." };
      return { matches: [], error: "The dua finder couldn't respond. Please try again." };
    }

    // Consume SSE stream server-side
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

    const ids = new Set(duas.map((d) => d.id));
    try {
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      const matches = (Array.isArray(json.matches) ? json.matches : [])
        .filter((m: any) => m && ids.has(m.id))
        .slice(0, 5)
        .map((m: any) => ({ id: String(m.id), reason: String(m.reason ?? "").slice(0, 300) }));
      return { matches };
    } catch {
      return { matches: [], error: "Couldn't read the suggestions. Please try again." };
    }
  });
