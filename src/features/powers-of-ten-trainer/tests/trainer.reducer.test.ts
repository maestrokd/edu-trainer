import { describe, expect, it } from "vitest";
import { trainerReducer, initialTrainerState } from "../model/trainer.reducer";
import type { TaskState } from "../model/trainer.types";

const task: TaskState = {
  operation: "multiply",
  power: 2,
  notation: "numeric",
  numberType: "whole",
  base: { coefficient: 12, scale: 0 },
  left: { coefficient: 12, scale: 0 },
  correctAnswer: { coefficient: 1200, scale: 0 },
  options: [],
  taskId: 1,
};

describe("powers-of-ten trainer reducer", () => {
  it("merges nested power configuration", () => {
    const state = trainerReducer(initialTrainerState, { type: "configUpdated", payload: { powers: { 5: true } } });
    expect(state.config.powers[1]).toBe(true);
    expect(state.config.powers[5]).toBe(true);
  });

  it("records answers and resets progress when returning to setup", () => {
    let state = trainerReducer(initialTrainerState, { type: "sessionStarted" });
    state = trainerReducer(state, { type: "taskPrepared", payload: task });
    state = trainerReducer(state, {
      type: "answerSubmitted",
      payload: { answer: { coefficient: 1200, scale: 0 }, correct: true },
    });
    expect(state.progress.correctCount).toBe(1);
    expect(state.progress.history).toHaveLength(1);
    state = trainerReducer(state, { type: "returnedToSetup" });
    expect(state.screen).toBe("setup");
    expect(state.progress.history).toEqual([]);
  });
});
