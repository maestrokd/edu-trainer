import { describe, expect, it } from "vitest";

import en from "@/locales/en/translation.json";
import ru from "@/locales/ru/translation.json";
import uk from "@/locales/uk/translation.json";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];

  return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
}

function normalizedLeafKeys(value: unknown): string[] {
  return [...new Set(leafKeys(value).map((key) => key.replace(/_(one|few|many|other)$/, "_plural")))].sort();
}

describe("Bible Books UI translations", () => {
  it("keeps the same complete translation shape in every application locale", () => {
    const englishKeys = normalizedLeafKeys(en.bibleBooksGame);

    expect(normalizedLeafKeys(uk.bibleBooksGame)).toEqual(englishKeys);
    expect(normalizedLeafKeys(ru.bibleBooksGame)).toEqual(englishKeys);
  });
});
