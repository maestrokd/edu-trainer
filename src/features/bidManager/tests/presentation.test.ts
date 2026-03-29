import { describe, expect, it } from "vitest";
import {
  DASH_PLACEHOLDER,
  toAddressValue,
  toBooleanValue,
  toConfidenceValue,
  toDisplayValue,
  toListValue,
  toNumberValue,
} from "../utils/presentation";

describe("bidManager presentation helpers", () => {
  it("returns dash for empty values", () => {
    expect(toDisplayValue(null)).toBe(DASH_PLACEHOLDER);
    expect(toDisplayValue(undefined)).toBe(DASH_PLACEHOLDER);
    expect(toDisplayValue("")).toBe(DASH_PLACEHOLDER);
    expect(toDisplayValue("   ")).toBe(DASH_PLACEHOLDER);
  });

  it("normalizes boolean values", () => {
    expect(toBooleanValue(true)).toBe("Yes");
    expect(toBooleanValue(false)).toBe("No");
    expect(toBooleanValue(null)).toBe(DASH_PLACEHOLDER);
  });

  it("normalizes lists", () => {
    expect(toListValue(["A", "B"])).toBe("A, B");
    expect(toListValue(["", null])).toBe(DASH_PLACEHOLDER);
    expect(toListValue([])).toBe(DASH_PLACEHOLDER);
  });

  it("formats numeric values", () => {
    expect(toNumberValue(42)).toBe("42");
    expect(toNumberValue(null)).toBe(DASH_PLACEHOLDER);
    expect(toConfidenceValue(0.956)).toBe("96%");
  });

  it("prefers full address and falls back to address parts", () => {
    expect(
      toAddressValue({
        street: null,
        city: null,
        state: null,
        postal_code: null,
        country: null,
        full_address: "123 Main St, Los Angeles, CA",
      })
    ).toBe("123 Main St, Los Angeles, CA");

    expect(
      toAddressValue({
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        postal_code: "90012",
        country: "USA",
        full_address: null,
      })
    ).toBe("123 Main St, Los Angeles, CA, 90012, USA");
  });
});
