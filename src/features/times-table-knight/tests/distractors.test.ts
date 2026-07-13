import { describe, it, expect } from "vitest";
import { buildOptions } from "../lib/distractors";

describe("buildOptions", () => {
  it("always returns 4 unique options containing the correct answer", () => {
    for (let a = 1; a <= 15; a++) {
      for (let b = 1; b <= 12; b++) {
        const opts = buildOptions({ a, b });
        expect(opts).toHaveLength(4);
        expect(new Set(opts).size).toBe(4);
        expect(opts).toContain(a * b);
      }
    }
  });

  it("never produces options below 1", () => {
    for (let run = 0; run < 50; run++) {
      const opts = buildOptions({ a: 1, b: 1 });
      for (const o of opts) expect(o).toBeGreaterThanOrEqual(1);
    }
  });

  it("prefers meaningful distractors: off-by-one multiples and operation confusion", () => {
    const opts = buildOptions({ a: 7, b: 8 });
    // preferred candidates for 7×8=56: 7×9=63, 7×7=49, 7+8=15
    expect(opts).toContain(63);
    expect(opts).toContain(49);
    expect(opts).toContain(15);
  });

  it("falls back to unique near-misses when preferred candidates collide", () => {
    // 1×2=2: preferred are 1×3=3, 1×1=1, 1+2=3 (dup), swap=2 (same), 12, -8 (<1)
    const opts = buildOptions({ a: 1, b: 2 });
    expect(opts).toHaveLength(4);
    expect(new Set(opts).size).toBe(4);
    expect(opts).toContain(2);
  });
});
