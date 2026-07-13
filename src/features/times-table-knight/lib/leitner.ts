import type { Fact, LeitnerEntry } from "../model/game.types";
import { LEITNER_BOOSTS, LEITNER_INTERVALS, LEITNER_MAX_BOX } from "../model/game.constants";

// The Leitner "clock" is the all-time count of answered problems, not wall time —
// the game itself has no clock, and practice cadence varies wildly per child.

export function factKey(fact: Fact): string {
  return `${fact.a}x${fact.b}`;
}

export function findEntry(pool: readonly LeitnerEntry[], fact: Fact): LeitnerEntry | undefined {
  return pool.find((e) => factKey(e.fact) === factKey(fact));
}

/** Wrong answer: (re-)enter the pool at box 0 so the fact resurfaces soon */
export function demote(pool: readonly LeitnerEntry[], fact: Fact, now: number): LeitnerEntry[] {
  const rest = pool.filter((e) => factKey(e.fact) !== factKey(fact));
  return [...rest, { fact, box: 0, dueAt: now + LEITNER_INTERVALS[0] }];
}

/**
 * Correct answer: promote one box; a fact promoted past the last box has been
 * re-learned and graduates out of the trouble pool.
 */
export function promote(pool: readonly LeitnerEntry[], fact: Fact, now: number): LeitnerEntry[] {
  const entry = findEntry(pool, fact);
  if (!entry) return [...pool];
  const rest = pool.filter((e) => e !== entry);
  if (entry.box >= LEITNER_MAX_BOX) return rest;
  const box = entry.box + 1;
  return [...rest, { fact, box, dueAt: now + LEITNER_INTERVALS[box] }];
}

/** Selection-weight boost: low boxes (fresh misses) resurface much more often */
export function boostFor(entry: LeitnerEntry): number {
  return LEITNER_BOOSTS[Math.min(entry.box, LEITNER_MAX_BOX)];
}

export function dueEntries(pool: readonly LeitnerEntry[], now: number): LeitnerEntry[] {
  return pool.filter((e) => e.dueAt <= now);
}
