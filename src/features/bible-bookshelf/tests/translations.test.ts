import { describe, expect, it } from "vitest";

import en from "@/locales/en/translation.json";
import ru from "@/locales/ru/translation.json";
import uk from "@/locales/uk/translation.json";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
}

describe("Bible Bookshelf translations", () => {
  it("keeps the same translation shape in every application locale", () => {
    const englishKeys = leafKeys(en.bibleBookshelf).sort();
    expect(leafKeys(uk.bibleBookshelf).sort()).toEqual(englishKeys);
    expect(leafKeys(ru.bibleBookshelf).sort()).toEqual(englishKeys);
  });
});
