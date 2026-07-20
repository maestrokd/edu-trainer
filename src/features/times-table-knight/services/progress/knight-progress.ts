import type { Hero, LeitnerEntry, SkinId, StageProgress, StarCount } from "../../model/game.types";
import { MAX_LEVEL, MIN_LEVEL, SKIN_PRICES } from "../../model/game.constants";

// Per-device persistence via localStorage (guest flow, like the other trainers).
// The API below is the seam: when profile-scoped backend storage arrives, only
// load/save change — callers stay untouched.

const STORAGE_KEY = "times-table-knight.progress.v1";

export interface KnightProgress {
  stages: Record<number, StageProgress>;
  /** spendable coin wallet — session coins are banked here at results */
  wallet: number;
  ownedSkins: SkinId[];
  hero: Hero;
  skin: SkinId;
  troublePool: LeitnerEntry[];
  leitnerClock: number;
  gameCompleted: boolean;
}

export interface SessionOutcome {
  mode: "practice" | "adventure";
  level: number;
  victory: boolean;
  stars: StarCount;
  score: number;
  coins: number;
  troublePool: LeitnerEntry[];
  leitnerClock: number;
  gameCompleted: boolean;
}

export function defaultProgress(): KnightProgress {
  const stages: Record<number, StageProgress> = {};
  for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
    stages[level] = { level, unlocked: level === MIN_LEVEL, stars: 0, bestScore: 0 };
  }
  return {
    stages,
    wallet: 0,
    ownedSkins: ["steel"],
    hero: "dame",
    skin: "steel",
    troublePool: [],
    leitnerClock: 0,
    gameCompleted: false,
  };
}

export function loadProgress(): KnightProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<KnightProgress>;
    const base = defaultProgress();
    return {
      ...base,
      ...parsed,
      stages: { ...base.stages, ...(parsed.stages ?? {}) },
      ownedSkins: parsed.ownedSkins?.length ? parsed.ownedSkins : base.ownedSkins,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: KnightProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage full/blocked — progress simply stays in memory for this session
  }
}

/** merge a finished session into long-term progress (called once per results) */
export function bankSession(progress: KnightProgress, outcome: SessionOutcome): KnightProgress {
  const next: KnightProgress = {
    ...progress,
    wallet: progress.wallet + outcome.coins,
    troublePool: outcome.troublePool,
    leitnerClock: outcome.leitnerClock,
    gameCompleted: progress.gameCompleted || outcome.gameCompleted,
    stages: { ...progress.stages },
  };

  if (outcome.mode === "adventure" && outcome.victory) {
    const stage = next.stages[outcome.level] ?? {
      level: outcome.level,
      unlocked: true,
      stars: 0 as StarCount,
      bestScore: 0,
    };
    next.stages[outcome.level] = {
      ...stage,
      unlocked: true,
      stars: Math.max(stage.stars, outcome.stars) as StarCount,
      bestScore: Math.max(stage.bestScore, outcome.score),
    };
    if (outcome.level < MAX_LEVEL) {
      const following = next.stages[outcome.level + 1];
      next.stages[outcome.level + 1] = { ...following, unlocked: true };
    }
  }

  return next;
}

export function buySkin(progress: KnightProgress, skin: SkinId): KnightProgress | null {
  if (progress.ownedSkins.includes(skin)) return progress;
  const price = SKIN_PRICES[skin];
  if (progress.wallet < price) return null;
  return {
    ...progress,
    wallet: progress.wallet - price,
    ownedSkins: [...progress.ownedSkins, skin],
    skin,
  };
}
