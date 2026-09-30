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

  it("recognizes Subhanallahi wa bihamdihi, subhanallahil azeem variants", () => {
    const phrase = "Subhanallahi wa bihamdihi, subhanallahil azeem";
    assert.deepEqual(categories("سبحان الله وبحمده سبحان الله العظيم"), [phrase]);
    assert.deepEqual(categories("Subhanallahi wa bihamdihi subhanallahil azeem"), [phrase]);
    assert.deepEqual(categories("Subhana Allahi wa bi hamdihi subhana Allahil adheem"), [phrase]);
    assert.deepEqual(categories("Astaghfirullah Subhanallahi wa bihamdihi subhanallahil azeem"), [
      "Astaghfirullah",
      phrase,
    ]);
  });

  it("counts SubhanAllah alone without matching the longer tasbih phrase", () => {
    assert.deepEqual(categories("subhan allah"), ["SubhanAllah"]);
  });

  it("rejects partial phrases and unrelated speech", () => {
    assert.deepEqual(categories("سبحان random words الحمد weather today الله"), []);
    assert.deepEqual(categories("allah is mentioned but this is not a complete dhikr phrase"), []);
  });

  it("normalizes Arabic letter and punctuation variants", () => {
    assert.equal(normalizeDhikrTranscript("إِلَّا اللّٰهُ—قُوَّةٌ"), "الا الله قوه");
  });
});
import { findStableDhikrMatches as stable } from "./dhikr-voice";
describe("interim hold for long tasbih", () => {
  it("holds trailing SubhanAllah while interim", () => {
    expect(stable("subhanallah", false)).toHaveLength(0);
    expect(stable("سبحان الله", false)).toHaveLength(0);
    expect(stable("subhanallahi wa bihamdihi", false)).toHaveLength(0);
  });
  it("counts once final or when followed by other speech", () => {
    expect(stable("subhanallah", true)).toHaveLength(1);
    expect(stable("subhanallah alhamdulillah", false)).toHaveLength(2);
    expect(stable("subhanallahi wa bihamdihi subhanallahil azeem", false)[0].category).toMatch(/bihamdihi/);
  });
});
