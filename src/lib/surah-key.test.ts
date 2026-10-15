import { expect, test } from "vitest";
import { surahKey } from "./surah-key";

test("numbered and plain Al-Fatihah labels are the same surah", () => {
  expect(surahKey("1. Al-Fatihah")).toBe(surahKey("Al-Fatihah"));
});

test("different surahs stay different", () => {
  expect(surahKey("2. Al-Baqarah")).not.toBe(surahKey("Al-Fatihah"));
});
