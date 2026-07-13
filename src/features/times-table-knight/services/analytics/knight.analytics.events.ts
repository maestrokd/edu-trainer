import type {
  BossDefeatedPayload,
  EquipmentForgedPayload,
  KnightAnalyticsEventName,
  ProblemAnsweredPayload,
  SessionEndPayload,
  SessionStartPayload,
  StageUnlockedPayload,
} from "./knight.analytics.types";

/**
 * No-op analytics adapter, same seam as the other trainers: swap trackEvent
 * for a real provider without touching call sites. Payloads stay minimal and
 * aggregate — appropriate for children (§13).
 */
export const knightAnalyticsService = {
  trackEvent(eventName: KnightAnalyticsEventName, payload?: unknown): void {
    // intentionally empty — a real provider plugs in here
    void eventName;
    void payload;
  },

  trackSessionStart(payload: SessionStartPayload) {
    this.trackEvent("times_table_knight_session_start", payload);
  },

  trackProblemAnswered(payload: ProblemAnsweredPayload) {
    this.trackEvent("times_table_knight_problem_answered", payload);
  },

  trackEquipmentForged(payload: EquipmentForgedPayload) {
    this.trackEvent("times_table_knight_equipment_forged", payload);
  },

  trackCheckpointReached(payload: { mode: string; level: number }) {
    this.trackEvent("times_table_knight_checkpoint_reached", payload);
  },

  trackBossDefeated(payload: BossDefeatedPayload) {
    this.trackEvent("times_table_knight_boss_defeated", payload);
  },

  trackStageUnlocked(payload: StageUnlockedPayload) {
    this.trackEvent("times_table_knight_stage_unlocked", payload);
  },

  trackSessionEnd(payload: SessionEndPayload) {
    this.trackEvent("times_table_knight_session_end", payload);
  },
};
