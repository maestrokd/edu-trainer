import { describe, it, expect } from "vitest";
import {
  accuracyPct,
  scoreForCorrect,
  starsForClearedStage,
  streakMultiplier,
} from "../lib/scoring";

describe("streakMultiplier", () => {
  it.each([
    [0, 1],
    [2, 1],
    [3, 1.5],
    [5, 1.5],
    [6, 2],
    [9, 2],
    [10, 3],
    [50, 3],
  ])("streak %i → ×%s", (streak, mult) => {
    expect(streakMultiplier(streak)).toBe(mult);
  });

  it("scales the correct-answer score", () => {
    expect(scoreForCorrect(0)).toBe(100);
    expect(scoreForCorrect(10)).toBe(300);
  });
});

describe("accuracyPct", () => {
  it("rounds and handles the zero-answers edge", () => {
    expect(accuracyPct(0, 0)).toBe(100);
    expect(accuracyPct(2, 3)).toBe(67);
    expect(accuracyPct(3, 3)).toBe(100);
  });
});

describe("starsForClearedStage (§14 thresholds)", () => {
  it("3★ needs ≥90% accuracy and ≥2 hearts", () => {
    expect(starsForClearedStage(90, 2)).toBe(3);
    expect(starsForClearedStage(95, 3)).toBe(3);
    expect(starsForClearedStage(90, 1)).toBe(2);
    expect(starsForClearedStage(89, 3)).toBe(2);
  });

  it("2★ needs ≥75%, otherwise clearing gives 1★", () => {
    expect(starsForClearedStage(75, 1)).toBe(2);
    expect(starsForClearedStage(74, 3)).toBe(1);
    expect(starsForClearedStage(0, 1)).toBe(1);
  });
});
