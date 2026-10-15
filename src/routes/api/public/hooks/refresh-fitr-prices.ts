import { createFileRoute } from "@tanstack/react-router";
import { isRefreshDue, perLbToPerKg, refreshSchedule, scaleByIndex } from "@/lib/fitr-refresh";

// Barley baseline: ~$5.05/kg store-brand when cereals CPI was 369.585 (Sep 2026).
const BARLEY_BASE = { price: 5.05, index: 369.585 };

async function latestBls(series: string) {
  const res = await fetch(`https://api.bls.gov/publicAPI/v1/timeseries/data/${series}`);
  const json = (await res.json()) as { status: string; Results?: { series: { data: { year: string; periodName: string; value: string }[] }[] } };
  const row = json.Results?.series?.[0]?.data?.[0];
  if (json.status !== "REQUEST_SUCCEEDED" || !row) throw new Error(`BLS ${series} unavailable`);
  return { value: Number(row.value), asOf: `${row.periodName} ${row.year}` };
}

// Takes no input: prices come only from BLS, and it updates at most once per Hijri year.
export const Route = createFileRoute("/api/public/hooks/refresh-fitr-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Private token lives in a table only the server and the scheduler can read.
        const { data: secret } = await supabaseAdmin.from("cron_tokens").select("token").eq("name", "fitr").maybeSingle();
        if (!secret?.token || secret.token !== token) return new Response("Unauthorized", { status: 401 });
        const { data: rows } = await supabaseAdmin.from("fitr_prices").select("hijri_year");
        const stored = Math.min(...(rows ?? []).map((r) => r.hijri_year), Infinity);
        const sched = refreshSchedule();
        if (!isRefreshDue(stored === Infinity ? 0 : stored)) {
          return Response.json({ refreshed: false, nextRefresh: sched.refreshOn.toISOString().slice(0, 10) });
        }
        const [flour, beans, cereals] = await Promise.all([latestBls("APU0000701111"), latestBls("APU0000714233"), latestBls("CUUR0000SAF111")]);
        const now = new Date().toISOString();
        const upd = [
          { food: "Wheat flour", price_per_kg: perLbToPerKg(flour.value), as_of: flour.asOf, source: "BLS APU0000701111", hijri_year: sched.hijriYear, updated_at: now },
          { food: "Black beans", price_per_kg: perLbToPerKg(beans.value), as_of: beans.asOf, source: "BLS APU0000714233", hijri_year: sched.hijriYear, updated_at: now },
          { food: "Barley", price_per_kg: scaleByIndex(BARLEY_BASE.price, BARLEY_BASE.index, cereals.value), as_of: cereals.asOf, source: `Store-brand baseline adjusted by BLS cereals CPI (CUUR0000SAF111 = ${cereals.value})`, hijri_year: sched.hijriYear, updated_at: now },
        ];
        const { error } = await supabaseAdmin.from("fitr_prices").upsert(upd);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ refreshed: true, hijriYear: sched.hijriYear });
      },
    },
  },
});
