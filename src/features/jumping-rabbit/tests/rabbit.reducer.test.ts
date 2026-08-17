import { describe, expect, it } from "vitest";
import { canAdvanceRabbitWorld } from "../lib/game-loop";
import { getInitialRabbitState, rabbitGameReducer } from "../model/rabbit.reducer";
import type { RabbitQuizQuestion } from "../model/rabbit.types";

const quiz: RabbitQuizQuestion[] = [
  { a: 9, b: 2, options: [18, 21, 24, 27] },
  { a: 9, b: 3, options: [18, 21, 24, 27] },
];

describe("jumping rabbit state", () => {
  it("starts and restarts a clean run with the current configuration", () => {
    let state = getInitialRabbitState();
    state = rabbitGameReducer(state, { type: "configUpdated", payload: { quizCount: 5, effectsEnabled: false } });
    state = rabbitGameReducer(state, { type: "runStarted" });
    state = rabbitGameReducer(state, { type: "scoreChanged", payload: 8 });
    const firstRunId = state.runId;
    state = rabbitGameReducer(state, { type: "runStarted" });

    expect(state).toMatchObject({
      phase: "playing",
      score: 0,
      quiz: null,
      menuOpen: false,
      config: { quizCount: 5, effectsEnabled: false },
    });
    expect(state.runId).toBe(firstRunId + 1);
  });

  it("clamps factor values and orders the range when a run starts", () => {
    let state = getInitialRabbitState();
    state = rabbitGameReducer(state, { type: "configUpdated", payload: { minVal: 15, maxVal: 3 } });

    expect(state.config).toMatchObject({ minVal: 12, maxVal: 3 });

    state = rabbitGameReducer(state, { type: "runStarted" });
    expect(state.config).toMatchObject({ minVal: 3, maxVal: 12 });
  });

  it("keeps the current run intact while the pause menu is open", () => {
    let state = rabbitGameReducer(getInitialRabbitState(), { type: "runStarted" });
    state = rabbitGameReducer(state, { type: "scoreChanged", payload: 6 });
    state = rabbitGameReducer(state, { type: "menuOpenChanged", payload: true });

    expect(state).toMatchObject({ phase: "playing", score: 6, menuOpen: true });
    expect(canAdvanceRabbitWorld(state.phase === "playing", state.menuOpen, false)).toBe(false);

    state = rabbitGameReducer(state, { type: "menuOpenChanged", payload: false });
    expect(state).toMatchObject({ phase: "playing", score: 6, menuOpen: false });
    expect(canAdvanceRabbitWorld(state.phase === "playing", state.menuOpen, false)).toBe(true);
  });

  it("advances only correct quiz answers and resumes after the final answer", () => {
    let state = rabbitGameReducer(getInitialRabbitState(), { type: "runStarted" });
    state = rabbitGameReducer(state, { type: "quizStarted", payload: quiz });
    state = rabbitGameReducer(state, {
      type: "answerSubmitted",
      payload: { value: 21, correct: false, isLast: false },
    });
    expect(state).toMatchObject({ phase: "quiz", quizIndex: 0 });
    expect(state.quiz?.[0]).toMatchObject({ answer: 21, correct: false });

    state = rabbitGameReducer(state, {
      type: "answerSubmitted",
      payload: { value: 18, correct: true, isLast: false },
    });
    expect(state).toMatchObject({ phase: "quiz", quizIndex: 1 });

    state = rabbitGameReducer(state, {
      type: "answerSubmitted",
      payload: { value: 27, correct: true, isLast: true },
    });
    expect(state).toMatchObject({ phase: "playing", quiz: null, quizIndex: 0 });
  });

  it("returns to setup without losing the selected configuration", () => {
    let state = getInitialRabbitState();
    state = rabbitGameReducer(state, { type: "configUpdated", payload: { askOnHit: false, quizCount: 4 } });
    state = rabbitGameReducer(state, { type: "runStarted" });
    state = rabbitGameReducer(state, { type: "returnedToSetup" });

    expect(state).toMatchObject({
      phase: "setup",
      score: 0,
      menuOpen: false,
      config: { askOnHit: false, quizCount: 4 },
    });
  });
});
