import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

type AutocompleteSuggestion = { placeId: string; text: string };

export const autocompletePlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        input: z.string().trim().min(2).max(120),
        sessionToken: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ suggestions: AutocompleteSuggestion[] }> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) {
      throw new Error("Location search is not configured yet.");
    }

    const response = await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": mapsKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: data.input,
        sessionToken: data.sessionToken,
        includedPrimaryTypes: ["locality", "administrative_area_level_1", "country", "postal_code"],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Places autocomplete failed [${response.status}]: ${errorBody}`);
      throw new Error(`Location search failed [${response.status}]`);
    }

    const json = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: { placeId?: string; text?: { text?: string } };
      }>;
    };

    const suggestions = (json.suggestions ?? [])
      .map((s) => ({
        placeId: s.placePrediction?.placeId ?? "",
        text: s.placePrediction?.text?.text ?? "",
      }))
      .filter((s) => s.placeId && s.text)
      .slice(0, 6);

    return { suggestions };
  });
