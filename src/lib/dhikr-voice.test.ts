import { describe, expect, it } from "vitest";
import { findDhikrMatches, normalizeDhikrTranscript } from "./dhikr-voice";

const categories = (value: string) => findDhikrMatches(value).map(match => match.category);

describe("dhikr voice phrase matching", () => {
  it("recognizes Arabic with diacritics and repeated recitations", () => {
    expect(categories("سُبْحَانَ اللَّهِ، سُبْحَانَ اللَّهِ")).toEqual(["SubhanAllah", "SubhanAllah"]);
  });

  it("recognizes common transliteration variants", () => {
    expect(categories("Astaghfirullah. Allahu Akbar. Alhamdulillah")).toEqual([
      "Astaghfirullah",
      "Allahu Akbar",
      "Alhamdulillah",
    ]);
  });

  it("recognizes longer common adhkar", () => {
    expect(categories("لا حول ولا قوة إلا بالله حسبنا الله ونعم الوكيل")).toEqual([
      "La hawla wa la quwwata illa billah",
      "HasbunAllahu wa ni'mal wakeel",
    ]);
  });

  it("rejects partial phrases and unrelated speech", () => {
    expect(categories("سبحان random words الحمد weather today الله")).toEqual([]);
    expect(categories("allah is mentioned but this is not a complete dhikr phrase")).toEqual([]);
  });

  it("normalizes Arabic letter and punctuation variants", () => {
    expect(normalizeDhikrTranscript("إِلَّا اللّٰهُ—قُوَّةٌ")).toBe("الا الله قوه");
  });
});