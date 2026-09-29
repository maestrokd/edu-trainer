import { describe, expect, it, vi } from "vitest";
import { decimalEquals, decimalToNumber, shiftDecimal } from "../lib/decimal";
import { buildCombinationDeck, generateTask } from "../lib/task-generator";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { DrillCombination, SessionConfig } from "../model/trainer.types";

describe("powers-of-ten task generator", () => {
  it("covers every selected operation, power, notation, and number type once per deck", () => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeDivide: true,
      includeDecimals: true,
      notationMode: "mixed",
      powers: { 1: true, 2: true, 3: false, 4: false, 5: false },
    };
    const deck = buildCombinationDeck(config);
    const keys = new Set(deck.map((item) => `${item.operation}:${item.power}:${item.notation}:${item.numberType}`));
    expect(deck).toHaveLength(16);
    expect(keys.size).toBe(16);
  });

  it("does not repeat the previous combination at a new deck boundary", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const previous: DrillCombination = { operation: "multiply", power: 1, notation: "numeric", numberType: "whole" };
    const deck = buildCombinationDeck(
      { ...DEFAULT_CONFIG, powers: { 1: true, 2: true, 3: false, 4: false, 5: false } },
      previous
    );
    random.mockRestore();
    expect(deck[0]).not.toEqual(previous);
  });

  it.each([1, 2, 3, 4, 5] as const)("generates exact multiplication by 10^%s", (power) => {
    const combination: DrillCombination = { operation: "multiply", power, notation: "power", numberType: "decimal" };
    const task = generateTask({ ...DEFAULT_CONFIG, includeDecimals: true, decimalPlaces: 3 }, combination, 4);
    expect(decimalEquals(task.correctAnswer, shiftDecimal(task.base, power))).toBe(true);
    expect(task.taskId).toBe(5);
    expect(task.options).toHaveLength(4);
    expect(task.options.some((option) => decimalEquals(option, task.correctAnswer))).toBe(true);
    expect(new Set(task.options.map((option) => `${option.coefficient}:${option.scale}`)).size).toBe(4);
  });

  it("generates exact inverse division with the configured base as the answer", () => {
    const combination: DrillCombination = { operation: "divide", power: 3, notation: "numeric", numberType: "decimal" };
    const task = generateTask({ ...DEFAULT_CONFIG, includeDecimals: true, decimalPlaces: 2 }, combination, 0);
    expect(decimalEquals(task.left, shiftDecimal(task.base, 3))).toBe(true);
    expect(decimalEquals(task.correctAnswer, task.base)).toBe(true);
  });

  it("omits options in keyboard input mode and respects explicit ranges", () => {
    const task = generateTask(
      { ...DEFAULT_CONFIG, answerMode: "input", magnitudeMode: "range", minValue: 12, maxValue: 12 },
      { operation: "multiply", power: 1, notation: "numeric", numberType: "whole" },
      0
    );
    expect(decimalToNumber(task.base)).toBe(12);
    expect(task.options).toEqual([]);
  });
});
