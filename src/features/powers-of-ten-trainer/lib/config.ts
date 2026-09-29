import { ALL_POWERS, MAX_SAFE_BASE_VALUE } from "../model/trainer.constants";
import type { Power, SessionConfig } from "../model/trainer.types";

export function selectedPowers(config: SessionConfig): Power[] {
  return ALL_POWERS.filter((power) => config.powers[power]);
}

export function isConfigValid(config: SessionConfig): boolean {
  return (
    (config.includeMultiply || config.includeDivide) &&
    (config.includeWhole || config.includeDecimals) &&
    selectedPowers(config).length > 0 &&
    isMagnitudeValid(config)
  );
}

export function isMagnitudeValid(config: SessionConfig): boolean {
  if (config.magnitudeMode === "digits") return true;
  const min = Math.min(config.minValue, config.maxValue);
  const max = Math.max(config.minValue, config.maxValue);
  const wholeValid = !config.includeWhole || Math.ceil(min) <= Math.floor(max);
  const factor = 10 ** config.decimalPlaces;
  const firstDecimal = Math.ceil(min * factor - Number.EPSILON);
  const lastDecimal = Math.floor(max * factor + Number.EPSILON);
  const firstFractional = firstDecimal % factor === 0 ? firstDecimal + 1 : firstDecimal;
  const decimalValid = !config.includeDecimals || firstFractional <= lastDecimal;
  return wholeValid && decimalValid;
}

export function sanitizeConfig(config: SessionConfig): SessionConfig {
  const minDigits = Math.max(1, Math.min(7, Math.min(config.minDigits, config.maxDigits)));
  const maxDigits = Math.max(minDigits, Math.min(7, Math.max(config.minDigits, config.maxDigits)));
  const minValue = Math.max(0.001, Math.min(MAX_SAFE_BASE_VALUE, Math.min(config.minValue, config.maxValue)));
  const maxValue = Math.max(minValue, Math.min(MAX_SAFE_BASE_VALUE, Math.max(config.minValue, config.maxValue)));
  return {
    ...config,
    minDigits,
    maxDigits,
    minValue,
    maxValue,
    timerMinutes: Math.max(0, config.timerMinutes),
    maxExercises: Math.max(0, Math.trunc(config.maxExercises)),
  };
}
