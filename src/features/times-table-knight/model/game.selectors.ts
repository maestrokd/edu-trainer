import type { Problem, SessionState } from "./game.types";
import { accuracyPct } from "../lib/scoring";
import { factKey } from "../lib/leitner";

export function selectAccuracy(state: SessionState): number {
  return accuracyPct(state.correct, state.answered);
}

export function selectCurrentProblem(state: SessionState): Problem | null {
  const enc = state.encounter;
  if (!enc) return null;
  return enc.problems[enc.index] ?? null;
}

/** the world is frozen exactly while a question is open (§1) */
export function selectWorldFrozen(state: SessionState): boolean {
  return state.phase === "encounter";
}

/** facts seen this session that were never missed */
export function selectFactsMastered(state: SessionState): number {
  const byFact = new Map<string, boolean>();
  for (const { fact, correct } of state.factLog) {
    const key = factKey(fact);
    byFact.set(key, (byFact.get(key) ?? true) && correct);
  }
  let mastered = 0;
  for (const allCorrect of byFact.values()) if (allCorrect) mastered++;
  return mastered;
}

/** facts answered wrong this session, for the Practice re-ask pass and results */
export function selectMissedFacts(state: SessionState): { a: number; b: number }[] {
  const missed = new Map<string, { a: number; b: number }>();
  for (const { fact, correct } of state.factLog) {
    if (!correct) missed.set(factKey(fact), fact);
  }
  return [...missed.values()];
}

export interface SessionSummary {
  accuracy: number;
  answered: number;
  correct: number;
  bestStreak: number;
  coins: number;
  score: number;
  stars: SessionState["stars"];
  factsMastered: number;
  victory: boolean;
  gameCompleted: boolean;
}

export function selectSummary(state: SessionState): SessionSummary {
  return {
    accuracy: selectAccuracy(state),
    answered: state.answered,
    correct: state.correct,
    bestStreak: state.bestStreak,
    coins: state.coins,
    score: state.score,
    stars: state.stars,
    factsMastered: selectFactsMastered(state),
    victory: state.endReason === "boss-defeated",
    gameCompleted: state.gameCompleted,
  };
}
