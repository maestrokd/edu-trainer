import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAddSubTrainerController } from "../hooks/useAddSubTrainerController";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import { getInitialState } from "../model/trainer.reducer";
import { trackEvent } from "../services/analytics/trainer.analytics.events";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../services/analytics/trainer.analytics.events", () => ({
  trackEvent: vi.fn(),
}));

describe("useAddSubTrainerController", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("normalizes reversed bounds before starting the session", () => {
    const initialState = getInitialState({
      config: {
        ...DEFAULT_CONFIG,
        includeSub: false,
        minVal: 20,
        maxVal: -5,
      },
    });
    const { result } = renderHook(() => useAddSubTrainerController(initialState));

    act(() => result.current.actions.startGame());

    expect(result.current.state.screen).toBe("play");
    expect(result.current.state.config.minVal).toBe(-5);
    expect(result.current.state.config.maxVal).toBe(20);
    expect(result.current.state.currentTask).not.toBeNull();
    expect(result.current.state.currentTask!.a + result.current.state.currentTask!.b).toBeGreaterThanOrEqual(-5);
    expect(result.current.state.currentTask!.a + result.current.state.currentTask!.b).toBeLessThanOrEqual(20);
    expect(trackEvent).toHaveBeenCalledWith({
      name: "add_sub_trainer_session_started",
      payload: { config: { ...initialState.config, minVal: -5, maxVal: 20 } },
    });
  });
});
