import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMetalPrices = createServerFn({ method: "GET" })
  .inputValidator((input: { currency: string }) => z.object({ currency: z.string().regex(/^[A-Z]{3}$/) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env['GOLDAPI_KEY'];
    if (!key) return { error: "Connect a GoldAPI key to load live prices." };
    try {
      const fetchPrice = async (metal: "XAU" | "XAG") => {
        const response = await fetch(`https://www.goldapi.io/api/${metal}/${data.currency}`, {
          headers: { "x-access-token": key, "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`GoldAPI returned ${response.status}`);
        const value: { price_gram_24k?: number; price?: number; timestamp?: number } = await response.json();
        const gram = metal === "XAU" ? value.price_gram_24k ?? (value.price ? value.price / 31.1034768 : 0) : (value.price ? value.price / 31.1034768 : 0);
        if (!Number.isFinite(gram) || gram <= 0) throw new Error("No valid metal price returned");
        return { gram, timestamp: value.timestamp };
      };
      const [gold, silver] = await Promise.all([fetchPrice("XAU"), fetchPrice("XAG")]);
      return { gold: gold.gram, silver: silver.gram, timestamp: gold.timestamp ?? silver.timestamp ?? Math.floor(Date.now() / 1000) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Live prices are unavailable." };
    }
  });