import { useCallback } from "react";
import type { EncounterKind, Fact, GameConfig, StarCount } from "../model/game.types";
import { knightAnalyticsService } from "../services/analytics/knight.analytics.events";
import { useCapabilityAccess } from "./useCapabilityAccess";

export function useTrainerAnalytics() {
  const { tier } = useCapabilityAccess();

  const base = useCallback(
    (config: GameConfig) => ({
      source: "times_table_knight" as const,
      capabilityTier: tier,
      mode: config.mode,
      level: config.level,
    }),
    [tier]
  );

  const trackSessionStart = useCallback(
    (config: GameConfig) => {
      knightAnalyticsService.trackSessionStart({ ...base(config), hero: config.hero, format: config.format });
    },
    [base]
  );

  const trackProblemAnswered = useCallback(
    (config: GameConfig, fact: Fact, correct: boolean, stopKind: EncounterKind) => {
      knightAnalyticsService.trackProblemAnswered({ ...base(config), fact, correct, stopKind });
    },
    [base]
  );

  const trackEquipmentForged = useCallback(
    (config: GameConfig, ladder: "weapon" | "armor", tierValue: number, direction: "up" | "down") => {
      knightAnalyticsService.trackEquipmentForged({ ...base(config), ladder, tier: tierValue, direction });
    },
    [base]
  );

  const trackCheckpointReached = useCallback((config: GameConfig) => {
    knightAnalyticsService.trackCheckpointReached({ mode: config.mode, level: config.level });
  }, []);

  const trackBossDefeated = useCallback(
    (config: GameConfig, stars: StarCount, accuracy: number) => {
      knightAnalyticsService.trackBossDefeated({ ...base(config), stars, accuracy });
    },
    [base]
  );

  const trackStageUnlocked = useCallback(
    (config: GameConfig, unlockedLevel: number) => {
      knightAnalyticsService.trackStageUnlocked({ ...base(config), unlockedLevel });
    },
    [base]
  );

  const trackSessionEnd = useCallback(
    (
      config: GameConfig,
      payload: { victory: boolean; accuracy: number; stars: StarCount; answered: number; coins: number; score: number }
    ) => {
      knightAnalyticsService.trackSessionEnd({ ...base(config), ...payload });
    },
    [base]
  );

  return {
    trackSessionStart,
    trackProblemAnswered,
    trackEquipmentForged,
    trackCheckpointReached,
    trackBossDefeated,
    trackStageUnlocked,
    trackSessionEnd,
  };
}
