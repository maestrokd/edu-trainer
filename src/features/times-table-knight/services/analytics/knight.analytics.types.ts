import type { EncounterKind, Fact, GameMode, StarCount } from "../../model/game.types";

export type KnightAnalyticsEventName =
  | "times_table_knight_session_start"
  | "times_table_knight_problem_answered"
  | "times_table_knight_equipment_forged"
  | "times_table_knight_checkpoint_reached"
  | "times_table_knight_boss_defeated"
  | "times_table_knight_stage_unlocked"
  | "times_table_knight_session_end";

export interface KnightAnalyticsBasePayload {
  source: "times_table_knight";
  capabilityTier: string;
  mode: GameMode;
  level: number;
}

export interface SessionStartPayload extends KnightAnalyticsBasePayload {
  hero: string;
  format: string;
}

export interface ProblemAnsweredPayload extends KnightAnalyticsBasePayload {
  fact: Fact;
  correct: boolean;
  stopKind: EncounterKind;
}

export interface EquipmentForgedPayload extends KnightAnalyticsBasePayload {
  ladder: "weapon" | "armor";
  tier: number;
  direction: "up" | "down";
}

export interface BossDefeatedPayload extends KnightAnalyticsBasePayload {
  stars: StarCount;
  accuracy: number;
}

export interface StageUnlockedPayload extends KnightAnalyticsBasePayload {
  unlockedLevel: number;
}

export interface SessionEndPayload extends KnightAnalyticsBasePayload {
  victory: boolean;
  accuracy: number;
  stars: StarCount;
  answered: number;
  coins: number;
  score: number;
}
