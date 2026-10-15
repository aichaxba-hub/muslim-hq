/** Normalizes stored surah labels so "1. Al-Fatihah" and "Al-Fatihah" count as one surah. */
export function surahKey(label: string | null | undefined): string {
  return (label ?? "").replace(/^\s*\d+\s*[.:-]?\s*/, "").trim().toLowerCase();
}
