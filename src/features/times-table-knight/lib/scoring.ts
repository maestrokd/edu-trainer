import type { StarCount } from "../model/game.types";
import {
  SCORE_COIN,
  SCORE_CORRECT_BASE,
  SCORE_CREATURE_SLAIN,
  STAR_2_MIN_ACCURACY,
  STAR_3_MIN_ACCURACY,
  STAR_3_MIN_HEARTS,
  STREAK_MULTIPLIERS,
  STREAK_THRESHOLDS,
} from "../model/game.constants";

/** ×1 / ×1.5 / ×2 / ×3 at streaks of 0 / 3 / 6 / 10 (§14) */
export function streakMultiplier(streak: number): number {
  let idx = 0;
  for (let i = 0; i < STREAK_THRESHOLDS.length; i++) {
    if (streak >= STREAK_THRESHOLDS[i]) idx = i + 1;
  }
  return STREAK_MULTIPLIERS[idx];
}

export function scoreForCorrect(streak: number): number {
  return Math.round(SCORE_CORRECT_BASE * streakMultiplier(streak));
}

export function scoreForCreatureSlain(streak: number): number {
  return Math.round(SCORE_CREATURE_SLAIN * streakMultiplier(streak));
}

export function scoreForCoin(): number {
  return SCORE_COIN;
}

export function accuracyPct(correct: number, answered: number): number {
  if (answered === 0) return 100;
  return Math.round((correct / answered) * 100);
}

/** Stars for a cleared stage (§14): 3★ ≥90% acc & ≥2 hearts, 2★ ≥75%, 1★ cleared */
export function starsForClearedStage(accuracy: number, hearts: number): StarCount {
  if (accuracy >= STAR_3_MIN_ACCURACY && hearts >= STAR_3_MIN_HEARTS) return 3;
  if (accuracy >= STAR_2_MIN_ACCURACY) return 2;
  return 1;
}
