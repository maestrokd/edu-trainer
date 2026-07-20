import type { Fact, LeitnerEntry, Problem } from "../model/game.types";
import {
  BLEND_CURRENT_TABLE,
  BLEND_REVIEW,
  BLEND_TROUBLE,
  densityTierFor,
  FACT_MIN,
  factMaxFor,
  factsPerTable,
  MIN_LEVEL,
} from "../model/game.constants";
import { boostFor, factKey } from "./leitner";
import { buildOptions } from "./distractors";
import { shuffle, weightedPick, type Rng, type Weighted } from "./random";

export function tableFacts(table: number): Fact[] {
  return Array.from({ length: factsPerTable(table) }, (_, i) => ({ a: table, b: FACT_MIN + i }));
}

/** a stored fact may predate the ×10 cap for tables below 10 — never re-serve those */
function withinTableRange(fact: Fact): boolean {
  return fact.b <= factMaxFor(fact.a);
}

/**
 * Practice stage plan (§3): every fact of the table exactly once, grouped into
 * creatures by density tier — e.g. 10×1 / 5×2 for capped tables (below 10),
 * 12×1 / 6×2 / 4×3 for full-range tables.
 */
export function practiceCreatureGroups(level: number, rng: Rng = Math.random): Fact[][] {
  const { problemsPerStop } = densityTierFor(level);
  const facts = shuffle(tableFacts(level), rng);
  const groups: Fact[][] = [];
  for (let i = 0; i < facts.length; i += problemsPerStop) {
    groups.push(facts.slice(i, i + problemsPerStop));
  }
  return groups;
}

/**
 * Adventure stage pool (§7): ~60% current table, ~25% interleaved review of
 * earlier tables, ~15% trouble facts boosted by their Leitner box.
 */
export function buildAdventurePool(
  level: number,
  troublePool: readonly LeitnerEntry[],
  now: number
): Weighted<Fact>[] {
  const pool: Weighted<Fact>[] = [];

  const current = tableFacts(level);
  for (const fact of current) {
    pool.push({ item: fact, weight: BLEND_CURRENT_TABLE / current.length });
  }

  const reviewFacts: Fact[] = [];
  for (let t = MIN_LEVEL; t < level; t++) reviewFacts.push(...tableFacts(t));
  for (const fact of reviewFacts) {
    pool.push({ item: fact, weight: BLEND_REVIEW / reviewFacts.length });
  }

  // Not-yet-due entries stay in the blend at half boost so a short stage
  // still reaches them, but due facts dominate the trouble share.
  const servableTrouble = troublePool.filter((e) => withinTableRange(e.fact));
  const effectiveBoost = (e: LeitnerEntry) => (e.dueAt <= now ? boostFor(e) : boostFor(e) / 2);
  const totalBoost = servableTrouble.reduce((sum, e) => sum + effectiveBoost(e), 0);
  if (totalBoost > 0) {
    for (const entry of servableTrouble) {
      pool.push({ item: entry.fact, weight: (BLEND_TROUBLE * effectiveBoost(entry)) / totalBoost });
    }
  }

  return pool;
}

/** Draw `count` facts, avoiding back-to-back repeats of the same fact */
export function drawFacts(pool: readonly Weighted<Fact>[], count: number, rng: Rng = Math.random): Fact[] {
  const drawn: Fact[] = [];
  for (let i = 0; i < count; i++) {
    let fact = weightedPick(pool, rng);
    let attempts = 0;
    while (drawn.length > 0 && factKey(fact) === factKey(drawn[drawn.length - 1]) && attempts < 10) {
      fact = weightedPick(pool, rng);
      attempts++;
    }
    drawn.push(fact);
  }
  return drawn;
}

export function toProblem(fact: Fact, rng: Rng = Math.random): Problem {
  return { fact, answer: fact.a * fact.b, options: buildOptions(fact, rng) };
}

export function toProblems(facts: readonly Fact[], rng: Rng = Math.random): Problem[] {
  return facts.map((f) => toProblem(f, rng));
}

/** Facts within the given table currently sitting in the trouble pool */
export function troubleFactsForTable(troublePool: readonly LeitnerEntry[], table: number): Fact[] {
  return troublePool.filter((e) => e.fact.a === table && withinTableRange(e.fact)).map((e) => e.fact);
}
