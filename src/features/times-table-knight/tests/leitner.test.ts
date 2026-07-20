import { describe, it, expect } from "vitest";
import { boostFor, demote, dueEntries, findEntry, promote } from "../lib/leitner";
import { LEITNER_BOOSTS, LEITNER_INTERVALS, LEITNER_MAX_BOX } from "../model/game.constants";
import type { LeitnerEntry } from "../model/game.types";

const fact = { a: 7, b: 8 };

describe("leitner trouble pool", () => {
  it("demote puts a missed fact into box 0, due soon", () => {
    const pool = demote([], fact, 100);
    expect(pool).toHaveLength(1);
    expect(pool[0].box).toBe(0);
    expect(pool[0].dueAt).toBe(100 + LEITNER_INTERVALS[0]);
  });

  it("demote resets an already-promoted fact back to box 0", () => {
    let pool: LeitnerEntry[] = demote([], fact, 0);
    pool = promote(pool, fact, 10);
    expect(findEntry(pool, fact)?.box).toBe(1);
    pool = demote(pool, fact, 20);
    expect(pool).toHaveLength(1);
    expect(findEntry(pool, fact)?.box).toBe(0);
  });

  it("promote raises the box and pushes dueAt out by the box interval", () => {
    let pool = demote([], fact, 0);
    pool = promote(pool, fact, 5);
    const entry = findEntry(pool, fact);
    expect(entry?.box).toBe(1);
    expect(entry?.dueAt).toBe(5 + LEITNER_INTERVALS[1]);
  });

  it("promote graduates a fact out of the pool past the last box", () => {
    let pool = demote([], fact, 0);
    for (let i = 0; i < LEITNER_MAX_BOX; i++) pool = promote(pool, fact, i);
    expect(findEntry(pool, fact)?.box).toBe(LEITNER_MAX_BOX);
    pool = promote(pool, fact, 99);
    expect(pool).toHaveLength(0);
  });

  it("promote of an unknown fact is a no-op (only missed facts live in the pool)", () => {
    expect(promote([], fact, 0)).toHaveLength(0);
  });

  it("boostFor gives fresh misses the highest resurface weight", () => {
    const fresh: LeitnerEntry = { fact, box: 0, dueAt: 0 };
    const learned: LeitnerEntry = { fact, box: LEITNER_MAX_BOX, dueAt: 0 };
    expect(boostFor(fresh)).toBe(LEITNER_BOOSTS[0]);
    expect(boostFor(learned)).toBe(LEITNER_BOOSTS[LEITNER_MAX_BOX]);
    expect(boostFor(fresh)).toBeGreaterThan(boostFor(learned));
  });

  it("dueEntries returns only entries whose dueAt has passed", () => {
    const pool: LeitnerEntry[] = [
      { fact: { a: 2, b: 3 }, box: 0, dueAt: 5 },
      { fact: { a: 4, b: 5 }, box: 1, dueAt: 50 },
    ];
    expect(dueEntries(pool, 10)).toHaveLength(1);
    expect(dueEntries(pool, 100)).toHaveLength(2);
  });
});
