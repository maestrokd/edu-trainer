import type { ArmorTier, GameConfig, SkinId, WeaponTier } from "./game.types";

// ---------------------------------------------------------------------------
// Every tuning value of Times Table Knight lives here (§14 of the game plan).
// There is deliberately NO timer constant anywhere: the game has no clock.
// ---------------------------------------------------------------------------

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 15;

/** multiplier range of every table: b in FACT_MIN..FACT_MAX */
export const FACT_MIN = 1;
export const FACT_MAX = 12;
export const FACTS_PER_TABLE = FACT_MAX - FACT_MIN + 1;

export const HEARTS_START = 3;

/** Density tiers: problems per question stop & Practice mini-boss hits by level band */
export interface DensityTier {
  minLevel: number;
  maxLevel: number;
  problemsPerStop: 1 | 2 | 3;
  practiceBossHits: number;
  /** Adventure boss HP in weapon-damage points */
  adventureBossHp: number;
}

export const DENSITY_TIERS: DensityTier[] = [
  { minLevel: 1, maxLevel: 5, problemsPerStop: 1, practiceBossHits: 3, adventureBossHp: 6 },
  { minLevel: 6, maxLevel: 10, problemsPerStop: 2, practiceBossHits: 4, adventureBossHp: 8 },
  { minLevel: 11, maxLevel: 15, problemsPerStop: 3, practiceBossHits: 5, adventureBossHp: 10 },
];

export function densityTierFor(level: number): DensityTier {
  return DENSITY_TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) ?? DENSITY_TIERS[0];
}

/** Typed answers are auto-suggested from this level up */
export const TYPED_SUGGESTED_FROM_LEVEL = 11;

// --- Equipment ladders (§5) -------------------------------------------------

export interface WeaponSpec {
  tier: WeaponTier;
  key: "dagger" | "sword" | "longbow" | "holy";
  damage: number;
  /** melee reach in world px; ranged/smite ignore it */
  reachPx: number;
  attack: "melee" | "ranged" | "smite";
}

export const WEAPONS: WeaponSpec[] = [
  { tier: 0, key: "dagger", damage: 1, reachPx: 34, attack: "melee" },
  { tier: 1, key: "sword", damage: 2, reachPx: 52, attack: "melee" },
  { tier: 2, key: "longbow", damage: 3, reachPx: 0, attack: "ranged" },
  { tier: 3, key: "holy", damage: 5, reachPx: 0, attack: "smite" },
];

export interface ArmorSpec {
  tier: ArmorTier;
  key: "cloth" | "leather" | "chainmail" | "plate";
  /** hits absorbed before hearts are touched; refilled at checkpoint & boss gate */
  absorbs: number;
}

export const ARMORS: ArmorSpec[] = [
  { tier: 0, key: "cloth", absorbs: 0 },
  { tier: 1, key: "leather", absorbs: 1 },
  { tier: 2, key: "chainmail", absorbs: 2 },
  { tier: 3, key: "plate", absorbs: 3 },
];

export const MAX_TIER = 3;

// --- Scoring, streaks, coins, stars (§14) -----------------------------------

export const STREAK_THRESHOLDS = [3, 6, 10] as const;
export const STREAK_MULTIPLIERS = [1, 1.5, 2, 3] as const;

export const SCORE_CORRECT_BASE = 100;
export const SCORE_CREATURE_SLAIN = 50;
export const SCORE_COIN = 10;

export const COINS_PER_CORRECT = 2;
export const COINS_PER_CREATURE = 2;
export const COIN_PICKUP_VALUE = 1;

export const STAR_3_MIN_ACCURACY = 90;
export const STAR_3_MIN_HEARTS = 2;
export const STAR_2_MIN_ACCURACY = 75;

export const SKIN_PRICES: Record<SkinId, number> = {
  steel: 0,
  crimson: 50,
  azure: 150,
  gold: 300,
};

// --- Adventure fact-pool blend (§7) -----------------------------------------

export const BLEND_CURRENT_TABLE = 0.6;
export const BLEND_REVIEW = 0.25;
export const BLEND_TROUBLE = 0.15;

/** Leitner boxes: weight boost per box (box 0 = just missed → resurfaces soon) */
export const LEITNER_BOOSTS = [8, 4, 2, 1, 0.5] as const;
export const LEITNER_MAX_BOX = LEITNER_BOOSTS.length - 1;
/** dueAt intervals per box, in answered-problems counted across sessions */
export const LEITNER_INTERVALS = [2, 6, 14, 30, 60] as const;

// --- Stage composition (§14) --------------------------------------------------

export const ADVENTURE_CREATURE_COUNT = 8;
export const ADVENTURE_ANVIL_COUNT = 3;
export const ADVENTURE_SCROLL_COUNT = 3;
/** the boss drops a scroll roughly every N attack cycles */
export const BOSS_SCROLL_EVERY_CYCLES = 2;

// --- Physics & engine tuning (game/ imports from here — no magic numbers) ----

/** logical viewport height in world px; width follows the canvas aspect */
export const VIEW_HEIGHT = 360;

export const GRAVITY = 2200;
export const MOVE_SPEED = 230;
export const JUMP_VELOCITY = 760;
export const KNIGHT_WIDTH = 28;
export const KNIGHT_HEIGHT = 46;
/** seconds of invulnerability after taking a reflex hit */
export const INVULN_SECONDS = 1.2;
export const KNOCKBACK_SPEED = 260;
export const ATTACK_COOLDOWN_SECONDS = 0.38;
export const ARROW_SPEED = 520;
/** fixed-timestep of the simulation; frame delta is clamped to avoid spiral-of-death */
export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.1;

export const DEFAULT_CONFIG: GameConfig = {
  mode: "practice",
  level: 2,
  hero: "dame",
  skin: "steel",
  format: "mcq",
  effects: { sound: true, haptics: true, reducedMotion: false },
};
