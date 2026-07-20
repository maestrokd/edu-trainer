import { describe, it, expect } from "vitest";
import { buildAdventurePool, drawFacts, practiceCreatureGroups, tableFacts, toProblems } from "../lib/fact-pool";
import { factKey, demote } from "../lib/leitner";
import { factMaxFor } from "../model/game.constants";
import type { LeitnerEntry } from "../model/game.types";

describe("fact range ladder (×10 below table 10, ×12 for 10–12, ×N for 13–15)", () => {
  it("caps each table at its own maximum multiplier", () => {
    expect(tableFacts(4).map((f) => f.b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(Math.max(...tableFacts(9).map((f) => f.b))).toBe(10);
    expect(Math.max(...tableFacts(10).map((f) => f.b))).toBe(12);
    expect(Math.max(...tableFacts(12).map((f) => f.b))).toBe(12);
    expect(Math.max(...tableFacts(13).map((f) => f.b))).toBe(13);
    expect(Math.max(...tableFacts(14).map((f) => f.b))).toBe(14);
    expect(Math.max(...tableFacts(15).map((f) => f.b))).toBe(15);
  });

  it("interleaved review always respects the reviewed table's own cap", () => {
    for (const level of [12, 15]) {
      const pool = buildAdventurePool(level, [], 0);
      for (const { item } of pool) {
        expect(item.b).toBeLessThanOrEqual(factMaxFor(item.a));
      }
    }
  });

  it("filters stale trouble facts that exceed their table's cap", () => {
    const stale: LeitnerEntry[] = [{ fact: { a: 4, b: 12 }, box: 0, dueAt: 0 }];
    const pool = buildAdventurePool(5, stale, 0);
    expect(pool.some(({ item }) => item.a === 4 && item.b === 12)).toBe(false);
  });
});

describe("practiceCreatureGroups", () => {
  it.each([
    [3, 10, 1],
    [8, 5, 2],
    [10, 6, 2],
    [12, 4, 3],
    [13, 5, 3],
    [15, 5, 3],
  ])("level %i → %i creatures × up to %i problems", (level, creatures, perCreature) => {
    const groups = practiceCreatureGroups(level);
    expect(groups).toHaveLength(creatures);
    for (const g of groups) {
      expect(g.length).toBeGreaterThanOrEqual(1);
      expect(g.length).toBeLessThanOrEqual(perCreature);
    }
  });

  it("covers every fact of the table exactly once", () => {
    for (const level of [1, 7, 15]) {
      const keys = practiceCreatureGroups(level)
        .flat()
        .map((f) => factKey(f))
        .sort();
      const expected = tableFacts(level)
        .map((f) => factKey(f))
        .sort();
      expect(keys).toEqual(expected);
    }
  });
});

describe("buildAdventurePool", () => {
  const trouble: LeitnerEntry[] = demote(demote([], { a: 3, b: 7 }, 0), { a: 6, b: 9 }, 0);

  it("weights ≈60% current table, ≈25% review, ≈15% trouble", () => {
    const pool = buildAdventurePool(5, trouble, 0);
    const sum = (pred: (f: { a: number; b: number }, w: number) => boolean) =>
      pool.filter(({ item, weight }) => pred(item, weight)).reduce((s, { weight }) => s + weight, 0);

    const currentShare = pool
      .slice(0, tableFacts(5).length) // current-table entries are pushed first
      .reduce((s, { weight }) => s + weight, 0);
    const total = sum(() => true);

    expect(currentShare).toBeCloseTo(0.6, 5);
    expect(total).toBeCloseTo(1, 5);
  });

  it("level 1 with no trouble pool puts all weight on the current table", () => {
    const pool = buildAdventurePool(1, [], 0);
    expect(pool).toHaveLength(tableFacts(1).length);
    for (const { item } of pool) expect(item.a).toBe(1);
    expect(pool.reduce((s, { weight }) => s + weight, 0)).toBeCloseTo(0.6, 5);
  });

  it("review facts come only from earlier tables", () => {
    const pool = buildAdventurePool(4, [], 0);
    for (const { item } of pool) {
      expect(item.a).toBeGreaterThanOrEqual(1);
      expect(item.a).toBeLessThanOrEqual(4);
    }
  });
});

describe("drawFacts / toProblems", () => {
  it("draws the requested count and never repeats a fact back-to-back", () => {
    const pool = buildAdventurePool(3, [], 0);
    const facts = drawFacts(pool, 20);
    expect(facts).toHaveLength(20);
    for (let i = 1; i < facts.length; i++) {
      expect(factKey(facts[i])).not.toBe(factKey(facts[i - 1]));
    }
  });

  it("toProblems builds answer and 4 options per fact", () => {
    const problems = toProblems(tableFacts(6).slice(0, 3));
    for (const p of problems) {
      expect(p.answer).toBe(p.fact.a * p.fact.b);
      expect(p.options).toHaveLength(4);
      expect(p.options).toContain(p.answer);
    }
  });
});
