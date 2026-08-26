import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCoachCharacter, type AssistantCharacterState } from "../components/taskCoach/TaskCoachCharacter";

const riveMocks = vi.hoisted(() => ({
  input: { value: 0 },
  play: vi.fn(),
  pause: vi.fn(),
  useRive: vi.fn(),
  useStateMachineInput: vi.fn(),
}));

vi.mock("@rive-app/react-canvas", () => ({
  Alignment: { Center: "center" },
  Fit: { Contain: "contain" },
  Layout: class Layout {},
  RuntimeLoader: { setWasmUrl: vi.fn(), setWasmFallbackUrl: vi.fn() },
  useRive: (parameters: unknown) => {
    riveMocks.useRive(parameters);
    return {
      rive: { play: riveMocks.play, pause: riveMocks.pause },
      RiveComponent: () => <div data-testid="rive-cat" />,
    };
  },
  useStateMachineInput: (...parameters: unknown[]) => {
    riveMocks.useStateMachineInput(...parameters);
    return riveMocks.input;
  },
}));

describe("TaskCoachCharacter", () => {
  it("loads Simple Cat with its inspected transparent artboard and input-free state machine", () => {
    render(<TaskCoachCharacter state="IDLE" characterId="simple-cat" />);

    expect(riveMocks.useRive).toHaveBeenCalledWith(
      expect.objectContaining({
        src: "/assets/task-coach/cat-simple-edit.riv",
        artboard: "Cat",
        stateMachines: "State Machine 1",
        enableRiveAssetCDN: false,
      })
    );
    expect(riveMocks.useStateMachineInput).toHaveBeenCalledWith(expect.anything(), "State Machine 1", "", undefined);
    expect(screen.getByTestId("rive-cat")).toBeInTheDocument();
  });

  it("keeps the existing cat's numeric inputs behind semantic character states", () => {
    const { rerender } = render(<TaskCoachCharacter state="IDLE" characterId="cute-character-cat" />);
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
      rerender(<TaskCoachCharacter state={state} characterId="cute-character-cat" />);
      expect(riveMocks.input.value).toBe(expectedInput);
    }
  });
});
