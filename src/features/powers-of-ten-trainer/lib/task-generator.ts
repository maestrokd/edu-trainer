import { decimalEquals, decimalKey, decimalToNumber, normalizeDecimal, shiftDecimal } from "./decimal";
import { randInt, shuffle } from "./random";
import { selectedPowers } from "./config";
import type {
  DecimalValue,
  DrillCombination,
  NumberType,
  Operation,
  SessionConfig,
  TaskNotation,
  TaskState,
} from "../model/trainer.types";

function combinationKey(value: DrillCombination): string {
  return `${value.operation}:${value.power}:${value.notation}:${value.numberType}`;
}

export function buildCombinationDeck(
  config: SessionConfig,
  previousCombination: DrillCombination | null = null
): DrillCombination[] {
  const operations: Operation[] = [];
  if (config.includeMultiply) operations.push("multiply");
  if (config.includeDivide) operations.push("divide");
  const notations: TaskNotation[] = config.notationMode === "mixed" ? ["numeric", "power"] : [config.notationMode];
  const numberTypes: NumberType[] = [];
  if (config.includeWhole) numberTypes.push("whole");
  if (config.includeDecimals) numberTypes.push("decimal");

  const combinations = operations.flatMap((operation) =>
    selectedPowers(config).flatMap((power) =>
      notations.flatMap((notation) => numberTypes.map((numberType) => ({ operation, power, notation, numberType })))
    )
  );
  const deck = shuffle(combinations);
  if (previousCombination && deck.length > 1 && combinationKey(deck[0]) === combinationKey(previousCombination)) {
    [deck[0], deck[1]] = [deck[1], deck[0]];
  }
  return deck;
}

function makeWhole(config: SessionConfig): DecimalValue {
  if (config.magnitudeMode === "digits") {
    const digits = randInt(config.minDigits, config.maxDigits);
    return { coefficient: randInt(10 ** (digits - 1), 10 ** digits - 1), scale: 0 };
  }
  return {
    coefficient: randInt(Math.ceil(config.minValue), Math.max(Math.ceil(config.minValue), Math.floor(config.maxValue))),
    scale: 0,
  };
}

function makeDecimal(config: SessionConfig): DecimalValue {
  const scale = config.decimalPlaces;
  const factor = 10 ** scale;
  let minCoefficient: number;
  let maxCoefficient: number;
  if (config.magnitudeMode === "digits") {
    const digits = randInt(config.minDigits, config.maxDigits);
    minCoefficient = 10 ** (digits - 1) * factor;
    maxCoefficient = (10 ** digits - 1) * factor + factor - 1;
  } else {
    minCoefficient = Math.ceil(config.minValue * factor - Number.EPSILON);
    maxCoefficient = Math.floor(config.maxValue * factor + Number.EPSILON);
  }
  minCoefficient = Math.max(1, minCoefficient);
  maxCoefficient = Math.max(minCoefficient, maxCoefficient);
  let coefficient = randInt(minCoefficient, maxCoefficient);
  if (coefficient % factor === 0) {
    coefficient = coefficient < maxCoefficient ? coefficient + 1 : Math.max(minCoefficient, coefficient - 1);
  }
  return { coefficient, scale };
}

export function generateQuizOptions(left: DecimalValue, operation: Operation, power: number): DecimalValue[] {
  const direction = operation === "multiply" ? 1 : -1;
  const candidates = [
    shiftDecimal(left, direction * power),
    shiftDecimal(left, direction * Math.max(0, power - 1)),
    shiftDecimal(left, direction * (power + 1)),
    shiftDecimal(left, -direction * power),
    normalizeDecimal(left),
    shiftDecimal(left, direction * (power + 2)),
  ];
  const unique = new Map<string, DecimalValue>();
  for (const candidate of candidates) {
    if (decimalToNumber(candidate) >= 0) unique.set(decimalKey(candidate), candidate);
    if (unique.size === 4) break;
  }
  return shuffle(Array.from(unique.values()).slice(0, 4));
}

export function generateTask(config: SessionConfig, combination: DrillCombination, previousTaskId: number): TaskState {
  const base = combination.numberType === "whole" ? makeWhole(config) : makeDecimal(config);
  const left = combination.operation === "multiply" ? base : shiftDecimal(base, combination.power);
  const correctAnswer = combination.operation === "multiply" ? shiftDecimal(base, combination.power) : base;
  const generatedOptions =
    config.answerMode === "quiz" ? generateQuizOptions(left, combination.operation, combination.power) : [];
  return {
    ...combination,
    base,
    left,
    correctAnswer,
    options: generatedOptions.map((option) => (decimalEquals(option, correctAnswer) ? correctAnswer : option)),
    taskId: previousTaskId + 1,
  };
}
