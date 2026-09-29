import { describe, expect, it } from "vitest";
import { decimalEquals, formatDecimal, parseDecimalInput, shiftDecimal } from "../lib/decimal";

describe("powers-of-ten decimal arithmetic", () => {
  it("shifts decimal values exactly in both directions", () => {
    expect(shiftDecimal({ coefficient: 1234, scale: 2 }, 3)).toEqual({ coefficient: 12340, scale: 0 });
    expect(shiftDecimal({ coefficient: 1234, scale: 2 }, -2)).toEqual({ coefficient: 1234, scale: 4 });
  });

  it("accepts dot and comma input and compares normalized values", () => {
    expect(parseDecimalInput("12,340")).toEqual({ coefficient: 1234, scale: 2 });
    expect(parseDecimalInput("12.34")).toEqual({ coefficient: 1234, scale: 2 });
    expect(decimalEquals({ coefficient: 120, scale: 2 }, { coefficient: 12, scale: 1 })).toBe(true);
    expect(parseDecimalInput("12,3.4")).toBeNull();
  });

  it("preserves generated precision when requested", () => {
    expect(formatDecimal({ coefficient: 1234, scale: 2 }, "en", true)).toBe("12.34");
    expect(formatDecimal({ coefficient: 120, scale: 2 }, "en", true)).toBe("1.20");
  });
});
