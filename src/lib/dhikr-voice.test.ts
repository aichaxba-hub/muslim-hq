import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findDhikrMatches, normalizeDhikrTranscript } from "./dhikr-voice";

const categories = (value: string) => findDhikrMatches(value).map(match => match.category);

describe("dhikr voice phrase matching", () => {
  it("recognizes Arabic with diacritics and repeated recitations", () => {
    assert.deepEqual(categories("سُبْحَانَ اللَّهِ، سُبْحَانَ اللَّهِ"), ["SubhanAllah", "SubhanAllah"]);
  });

  it("recognizes common transliteration variants", () => {
    assert.deepEqual(categories("Astaghfirullah. Allahu Akbar. Alhamdulillah"), [
      "Astaghfirullah",
      "Allahu Akbar",
      "Alhamdulillah",
    ]);
  });

  it("recognizes longer common adhkar", () => {
    assert.deepEqual(categories("لا حول ولا قوة إلا بالله حسبنا الله ونعم الوكيل"), [
      "La hawla wa la quwwata illa billah",
      "HasbunAllahu wa ni'mal wakeel",
    ]);
  });

  it("rejects partial phrases and unrelated speech", () => {
    assert.deepEqual(categories("سبحان random words الحمد weather today الله"), []);
    assert.deepEqual(categories("allah is mentioned but this is not a complete dhikr phrase"), []);
  });

  it("normalizes Arabic letter and punctuation variants", () => {
    assert.equal(normalizeDhikrTranscript("إِلَّا اللّٰهُ—قُوَّةٌ"), "الا الله قوه");
  });
});