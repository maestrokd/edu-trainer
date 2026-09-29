import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePowersOfTenTrainerController } from "../hooks/usePowersOfTenTrainerController";

vi.mock("../hooks/useBeeps", () => ({
  useBeeps: () => ({ beep: vi.fn() }),
}));

describe("usePowersOfTenTrainerController", () => {
  it("sanitizes setup, ends at the exercise limit, and starts a fresh session", () => {
    const { result } = renderHook(() => usePowersOfTenTrainerController());

    act(() => {
      result.current.actions.updateConfig({
        magnitudeMode: "range",
        minValue: 25,
        maxValue: 5,
        maxExercises: 1,
      });
    });
    act(() => result.current.actions.startGame());

    expect(result.current.state.screen).toBe("play");
    expect(result.current.state.config.minValue).toBe(5);
    expect(result.current.state.config.maxValue).toBe(25);
    const answer = result.current.state.currentTask!.correctAnswer;

    act(() => result.current.actions.submitAnswer(answer));
    expect(result.current.state.gameOver).toBe(true);
    expect(result.current.state.endReason).toBe("exercises");
    expect(result.current.totalAnswered).toBe(1);
    expect(result.current.accuracy).toBe(100);

    act(() => result.current.actions.newSession());
    expect(result.current.state.gameOver).toBe(false);
    expect(result.current.totalAnswered).toBe(0);
    expect(result.current.state.currentTask).not.toBeNull();
  });
});
