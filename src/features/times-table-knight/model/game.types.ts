export type GameMode = "practice" | "adventure";
export type AnswerFormat = "mcq" | "typed";
export type Hero = "dame" | "sir";
export type SkinId = "steel" | "crimson" | "azure" | "gold";

export interface EffectsConfig {
  sound: boolean;
  haptics: boolean;
  reducedMotion: boolean;
}

export interface GameConfig {
  mode: GameMode;
  /** 1..15 — level N trains the ×N times table */
  level: number;
  hero: Hero;
  skin: SkinId;
  format: AnswerFormat;
  effects: EffectsConfig;
}

/** a×b; a = the stage table in Practice — Adventure also draws from earlier tables & the trouble pool */
export interface Fact {
  a: number;
  b: number;
}

export interface Problem {
  fact: Fact;
  answer: number;
  options: number[];
}

export type EncounterKind =
  | "practice-creature"
  | "forge-anvil"
  | "armor-scroll"
  | "boss-scroll"
  | "practice-boss";

export interface Encounter {
  kind: EncounterKind;
  /** engine station/creature id that triggered the stop; -1 for boss volleys */
  stationId: number;
  /** 1..3 problems by density tier */
  problems: Problem[];
  /** current problem in the volley */
  index: number;
  results: (boolean | null)[];
}

export type WeaponTier = 0 | 1 | 2 | 3; // dagger | sword | longbow | holy blade
export type ArmorTier = 0 | 1 | 2 | 3; // cloth | leather | chainmail | plate

export type GamePhase = "setup" | "playing" | "encounter" | "boss" | "results";
export type EndReason = "boss-defeated" | "hearts-depleted";
export type StarCount = 0 | 1 | 2 | 3;

export interface LeitnerEntry {
  fact: Fact;
  box: number;
  dueAt: number;
}

export interface FactResult {
  fact: Fact;
  correct: boolean;
}

export interface SessionState {
  phase: GamePhase;
  config: GameConfig;
  /** reflex damage only in Adventure / wrong answers in Practice — never both (two-axis model) */
  hearts: number;
  score: number;
  /** coins earned during this session (banked into the wallet at results) */
  coins: number;
  streak: number;
  bestStreak: number;
  /** Adventure: real combat tier, forged at anvils */
  weapon: WeaponTier;
  /** Adventure: absorbs hits, enchanted at scrolls */
  armor: ArmorTier;
  /** remaining absorbs; refilled at checkpoint & boss gate */
  armorAbsorbLeft: number;
  answered: number;
  correct: number;
  troublePool: LeitnerEntry[];
  factLog: FactResult[];
  encounter: Encounter | null;
  /** phase to return to when the current volley closes */
  returnPhase: "playing" | "boss";
  bossHp: number;
  bossMaxHp: number;
  /** stage progress toward the boss (no clock exists anywhere in the game) */
  questionStopsCleared: number;
  endReason: EndReason | null;
  stars: StarCount;
  /** true after beating the Adventure Level 15 boss */
  gameCompleted: boolean;
}

export interface StageProgress {
  level: number;
  unlocked: boolean;
  stars: StarCount;
  bestScore: number;
}
