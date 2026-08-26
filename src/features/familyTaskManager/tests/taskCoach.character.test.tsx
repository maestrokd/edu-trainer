import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCoachCharacter, type AssistantCharacterState } from "../components/taskCoach/TaskCoachCharacter";

const riveMocks = vi.hoisted(() => ({
  input: { value: 0 },
  play: vi.fn(),
  pause: vi.fn(),
}));

vi.mock("@rive-app/react-canvas", () => ({
  Alignment: { Center: "center" },
  Fit: { Contain: "contain" },
  Layout: class Layout {},
  RuntimeLoader: { setWasmUrl: vi.fn(), setWasmFallbackUrl: vi.fn() },
  useRive: () => ({
    rive: { play: riveMocks.play, pause: riveMocks.pause },
    RiveComponent: () => <div data-testid="rive-cat" />,
  }),
  useStateMachineInput: () => riveMocks.input,
}));

describe("TaskCoachCharacter", () => {
  it("keeps asset-specific input values behind semantic character states", () => {
    const { rerender } = render(<TaskCoachCharacter state="IDLE" />);
    expect(riveMocks.input.value).toBe(0);
    expect(screen.getByTestId("rive-cat")).toBeInTheDocument();

    const cases: Array<[AssistantCharacterState, number]> = [
      ["LISTENING", 1],
      ["THINKING", 0],
      ["SPEAKING", 1],
      ["SUCCESS", 2],
      ["ERROR", 0],
    ];

    for (const [state, expectedInput] of cases) {
      rerender(<TaskCoachCharacter state={state} />);
      expect(riveMocks.input.value).toBe(expectedInput);
    }
  });
});
