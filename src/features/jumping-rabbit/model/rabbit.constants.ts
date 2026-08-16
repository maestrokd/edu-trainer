import type { RabbitConfig } from "./rabbit.types";

export const DEFAULT_RABBIT_CONFIG: RabbitConfig = {
  quizCount: 3,
  askOnHit: true,
  effectsEnabled: true,
};

export const MIN_QUIZ_COUNT = 1;
export const MAX_QUIZ_COUNT = 5;

export function clampQuizCount(value: number) {
  return Math.max(MIN_QUIZ_COUNT, Math.min(MAX_QUIZ_COUNT, Math.round(value)));
}
