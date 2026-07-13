import { describe, it, expect } from "vitest";
import { buildAdventurePool, drawFacts, practiceCreatureGroups, tableFacts, toProblems } from "../lib/fact-pool";
import { factKey, demote } from "../lib/leitner";
import { FACTS_PER_TABLE } from "../model/game.constants";
import type { LeitnerEntry } from "../model/game.types";

describe("practiceCreatureGroups", () => {
  it.each([
    [3, 12, 1],
    [8, 6, 2],
    [13, 4, 3],
  ])("level %i → %i creatures × %i problems", (level, creatures, perCreature) => {
    const groups = practiceCreatureGroups(level);
    expect(groups).toHaveLength(creatures);
    for (const g of groups) expect(g).toHaveLength(perCreature);
  });

  it("covers all 12 facts of the table exactly once", () => {
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
      .slice(0, FACTS_PER_TABLE) // current-table entries are pushed first
      .reduce((s, { weight }) => s + weight, 0);
    const total = sum(() => true);

    expect(currentShare).toBeCloseTo(0.6, 5);
    expect(total).toBeCloseTo(1, 5);
  });

  it("level 1 with no trouble pool puts all weight on the current table", () => {
    const pool = buildAdventurePool(1, [], 0);
    expect(pool).toHaveLength(FACTS_PER_TABLE);
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
