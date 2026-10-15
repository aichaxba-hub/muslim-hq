import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TROY_OZ_GRAMS = 31.1034768;

async function fromGoldApi(currency: string, key: string) {
  const fetchPrice = async (metal: "XAU" | "XAG") => {
    const response = await fetch(`https://www.goldapi.io/api/${metal}/${currency}`, {
      headers: { "x-access-token": key, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`GoldAPI returned ${response.status}`);
    const value: { price_gram_24k?: number; price?: number; timestamp?: number } = await response.json();
    const gram = metal === "XAU" ? value.price_gram_24k ?? (value.price ? value.price / TROY_OZ_GRAMS : 0) : (value.price ? value.price / TROY_OZ_GRAMS : 0);
    if (!Number.isFinite(gram) || gram <= 0) throw new Error("No valid metal price returned");
    return { gram, timestamp: value.timestamp };
  };
  const [gold, silver] = await Promise.all([fetchPrice("XAU"), fetchPrice("XAG")]);
  return { gold: gold.gram, silver: silver.gram, timestamp: gold.timestamp ?? silver.timestamp ?? Math.floor(Date.now() / 1000), source: "GoldAPI" };
}

// Free fallback: gold-api.com spot prices (USD per troy oz), converted per gram
// and into the requested currency via frankfurter.dev exchange rates.
async function fromFallback(currency: string) {
  const fetchPrice = async (metal: "XAU" | "XAG") => {
    const response = await fetch(`https://api.gold-api.com/price/${metal}`);
    if (!response.ok) throw new Error(`Backup price source returned ${response.status}`);
    const value: { price?: number; updatedAt?: string } = await response.json();
    if (!value.price || !Number.isFinite(value.price) || value.price <= 0) throw new Error("No valid metal price returned");
    return { gramUsd: value.price / TROY_OZ_GRAMS, updatedAt: value.updatedAt };
  };
  const [gold, silver] = await Promise.all([fetchPrice("XAU"), fetchPrice("XAG")]);
  let rate = 1;
  if (currency !== "USD") {
    const fx = await fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${currency}`);
    if (!fx.ok) throw new Error(`Exchange-rate source returned ${fx.status}`);
    const rates: { rates?: Record<string, number> } = await fx.json();
    const found = rates.rates?.[currency];
    if (!found || !Number.isFinite(found) || found <= 0) throw new Error(`No exchange rate for ${currency}`);
    rate = found;
  }
  const timestamp = gold.updatedAt ? Math.floor(new Date(gold.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000);
  return { gold: gold.gramUsd * rate, silver: silver.gramUsd * rate, timestamp, source: "backup spot prices" };
}

export const getMetalPrices = createServerFn({ method: "GET" })
  .inputValidator((input: { currency: string }) => z.object({ currency: z.string().regex(/^[A-Z]{3}$/) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env['GOLDAPI_KEY'];
    if (key) {
      try {
        return await fromGoldApi(data.currency, key);
      } catch {
        // fall through to the free backup source
      }
    }
    try {
      return await fromFallback(data.currency);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Live prices are unavailable." };
    }
  });
