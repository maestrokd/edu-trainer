import type { RabbitConfig } from "./rabbit.types";

export const DEFAULT_RABBIT_CONFIG: RabbitConfig = {
  minVal: 4,
  maxVal: 9,
  quizCount: 3,
  askOnHit: true,
  effectsEnabled: true,
};

export const MIN_QUIZ_COUNT = 1;
export const MAX_QUIZ_COUNT = 5;
export const MIN_FACTOR = 2;
export const MAX_FACTOR = 12;

export function clampQuizCount(value: number) {
  return Math.max(MIN_QUIZ_COUNT, Math.min(MAX_QUIZ_COUNT, Math.round(value)));
}

export function clampFactor(value: number) {
  return Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, Math.round(value)));
}

export function normalizeFactorRange(minVal: number, maxVal: number) {
  const clampedMin = clampFactor(minVal);
  const clampedMax = clampFactor(maxVal);
  return {
    minVal: Math.min(clampedMin, clampedMax),
    maxVal: Math.max(clampedMin, clampedMax),
  };
}
