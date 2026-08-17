import { describe, expect, it, vi } from "vitest";
import { buildPrompt, generateTask } from "../lib/task-generator";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { SessionConfig } from "../model/trainer.types";

function generateTasks(config: SessionConfig, count = 100) {
  return Array.from({ length: count }, () => generateTask(config, 41));
}

describe("task-generator", () => {
  it("should build prompt correctly for missing result", () => {
    const prompt = buildPrompt(5, 3, "add", "result");
    expect(prompt).toBe("5 + 3 = ?");
  });

  it("should build prompt correctly for missing a", () => {
    const prompt = buildPrompt(5, 3, "sub", "a");
    expect(prompt).toBe("? - 3 = 2");
  });

  it("should build prompt correctly for missing b", () => {
    const prompt = buildPrompt(5, 3, "add", "b");
    expect(prompt).toBe("5 + ? = 8");
  });

  it.each([
    { minVal: 10, maxVal: 20 },
    { minVal: -20, maxVal: -10 },
    { minVal: -10, maxVal: 10 },
    { minVal: 20, maxVal: -5 },
    { minVal: 0, maxVal: 0 },
  ])("keeps addition sums in the normalized $minVal–$maxVal range", ({ minVal, maxVal }) => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeSub: false,
      minVal,
      maxVal,
      problemMode: "result",
    };
    const min = Math.min(minVal, maxVal);
    const max = Math.max(minVal, maxVal);

    for (const task of generateTasks(config)) {
      const result = task.a + task.b;
      const operandMin = Math.min(0, result);
      const operandMax = Math.max(0, result);

      expect(task.op).toBe("add");
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
      expect(task.a).toBeGreaterThanOrEqual(operandMin);
      expect(task.a).toBeLessThanOrEqual(operandMax);
      expect(task.b).toBeGreaterThanOrEqual(operandMin);
      expect(task.b).toBeLessThanOrEqual(operandMax);
      expect(task.correctAnswer).toBe(result);
      expect(task.missing).toBe("result");
      expect(task.prompt).toBe(`${task.a} + ${task.b} = ?`);
      expect(task.taskId).toBe(42);
    }
  });

  it.each([
    { minVal: 10, maxVal: 20 },
    { minVal: -20, maxVal: -10 },
    { minVal: -10, maxVal: 10 },
    { minVal: 20, maxVal: -5 },
    { minVal: 0, maxVal: 0 },
  ])("keeps subtraction minuends in the normalized $minVal–$maxVal range", ({ minVal, maxVal }) => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeAdd: false,
      minVal,
      maxVal,
      problemMode: "result",
    };
    const min = Math.min(minVal, maxVal);
    const max = Math.max(minVal, maxVal);
    const operandMin = Math.min(0, min);

    for (const task of generateTasks(config)) {
      expect(task.op).toBe("sub");
      expect(task.a).toBeGreaterThanOrEqual(min);
      expect(task.a).toBeLessThanOrEqual(max);
      expect(task.b).toBeGreaterThanOrEqual(operandMin);
      expect(task.b).toBeLessThanOrEqual(task.a);
      expect(task.correctAnswer).toBe(task.a - task.b);
      expect(task.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(task.prompt).toBe(`${task.a} - ${task.b} = ?`);
      expect(task.taskId).toBe(42);
    }
  });

  it.each(["add", "sub"] as const)("keeps generated %s answers and prompts correct in missing-number mode", (op) => {
    const config: SessionConfig = {
      ...DEFAULT_CONFIG,
      includeAdd: op === "add",
      includeSub: op === "sub",
      minVal: -10,
      maxVal: 20,
      problemMode: "missing",
    };

    for (const [missingRandom, expectedMissing] of [
      [0, "a"],
      [0.75, "b"],
    ] as const) {
      const random = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(missingRandom);
      const task = generateTask(config, 41);
      random.mockRestore();

      expect(task.op).toBe(op);
      expect(task.missing).toBe(expectedMissing);
      expect(task.correctAnswer).toBe(expectedMissing === "a" ? task.a : task.b);
      expect(task.prompt).toBe(buildPrompt(task.a, task.b, task.op, task.missing));
      const target = op === "add" ? task.a + task.b : task.a;
      expect(target).toBeGreaterThanOrEqual(config.minVal);
      expect(target).toBeLessThanOrEqual(config.maxVal);
    }
  });

  it("falls back to addition when no operation is selected", () => {
    const task = generateTask(
      {
        ...DEFAULT_CONFIG,
        includeAdd: false,
        includeSub: false,
      },
      0
    );

    expect(task.op).toBe("add");
  });
});
