import type { Power, SessionConfig } from "./trainer.types";

export const ALL_POWERS: Power[] = [1, 2, 3, 4, 5];
export const DIGIT_CHOICES = [1, 2, 3, 4, 5, 6, 7] as const;
export const MAX_SAFE_BASE_VALUE = 9_999_999.999;
export const MAX_HISTORY_ITEMS = 100;

export const DEFAULT_CONFIG: SessionConfig = {
  includeMultiply: true,
  includeDivide: false,
  includeWhole: true,
  includeDecimals: false,
  decimalPlaces: 1,
  magnitudeMode: "digits",
  minDigits: 1,
  maxDigits: 3,
  minValue: 1,
  maxValue: 999,
  powers: { 1: true, 2: true, 3: true, 4: false, 5: false },
  notationMode: "numeric",
  answerMode: "quiz",
  showHint: false,
  soundsEnabled: false,
  timerMinutes: 0,
  maxExercises: 0,
};
