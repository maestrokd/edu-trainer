import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { MultiplicationTrainerSetupScreen } from "../components/MultiplicationTrainerSetupScreen";

function renderSetup(isInteractable = true) {
  const callbacks = {
    onMinChange: vi.fn(),
    onMaxChange: vi.fn(),
    onModeChange: vi.fn(),
    onMulChange: vi.fn(),
    onDivChange: vi.fn(),
    onTimerChange: vi.fn(),
    onMaxExercisesChange: vi.fn(),
    onStartClick: vi.fn(),
  };

  const view = render(
    <MemoryRouter>
      <MultiplicationTrainerSetupScreen
        minVal={4}
        maxVal={9}
        mode="quiz"
        includeMul
        includeDiv
        timerMinutes={0}
        maxExercises={0}
        {...callbacks}
        labels={{
          introText: (
            <>
              Choose the range of factors, e.g. <b>4…9</b>.
            </>
          ),
          range: "Factor range",
          rangeHint: "The range is automatically ordered and limited to 2…12.",
          min: "Minimum",
          max: "Maximum",
          mode: "Mode",
          modeQuiz: "Quiz",
          modeInput: "Keyboard input",
          exercises: "Exercises",
          mul: "Multiplication",
          div: "Division",
          timer: "Timer (minutes)",
          timerHint: "Leave empty for unlimited session time.",
          maxExercises: "Max exercises",
          maxExercisesHint: "Leave empty for unlimited number of exercises.",
          start: "Start",
          menu: "Main Menu",
          ariaBackToMenu: "Back to menu",
          ariaMin: "Minimum value of the range",
          ariaMax: "Maximum value of the range",
          ariaMode: "Trainer mode",
          ariaMul: "Include multiplication exercises",
          ariaDiv: "Include division exercises",
          ariaTimer: "Timer minutes",
          ariaMaxExercises: "Maximum exercises",
          moreInfo: (field) => `More information about ${field}`,
        }}
        isInteractable={isInteractable}
      />
    </MemoryRouter>
  );

  return { ...view, callbacks };
}

describe("MultiplicationTrainerSetupScreen", () => {
  it("uses one responsive surface without nested cards", () => {
    const { container } = renderSetup();
    const setup = container.firstElementChild;

    expect(setup).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50", "sm:p-5", "md:p-8");
    expect(setup).not.toHaveClass("bg-muted/50", "p-5");
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    expect(screen.getByText(/Choose the range of factors/)).toHaveClass("hidden", "sm:block");
    expect(screen.getByRole("button", { name: "Start" }).parentElement).toHaveClass("grid-cols-2");
  });

  it.each([
    ["Factor range", "The range is automatically ordered and limited to 2…12."],
    ["Timer (minutes)", "Leave empty for unlimited session time."],
    ["Max exercises", "Leave empty for unlimited number of exercises."],
  ])("shows the %s hint from its info popup", (field, hint) => {
    renderSetup();

    fireEvent.keyDown(screen.getByRole("button", { name: `More information about ${field}` }), { key: "Enter" });

    expect(screen.getByText(hint)).toBeVisible();
  });

  it("keeps setup controls connected to trainer actions", () => {
    const { callbacks } = renderSetup();

    fireEvent.click(screen.getByRole("checkbox", { name: "Include multiplication exercises" }));
    expect(callbacks.onMulChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("checkbox", { name: "Include division exercises" }));
    expect(callbacks.onDivChange).toHaveBeenCalledWith(false);

    fireEvent.change(screen.getByRole("textbox", { name: "Timer minutes" }), { target: { value: "5" } });
    expect(callbacks.onTimerChange).toHaveBeenCalledWith(5);

    fireEvent.change(screen.getByRole("textbox", { name: "Maximum exercises" }), { target: { value: "12" } });
    expect(callbacks.onMaxExercisesChange).toHaveBeenCalledWith(12);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(callbacks.onStartClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Back to menu" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Main Menu")).toBeVisible();
  });

  it("orders ranges, exercise types, mode, and limits and selects quiz by default", () => {
    const { container } = renderSetup();
    const controls = ["#min-select", "#mul-check", "#mode-select", "#timer-min"].map((selector) =>
      container.querySelector(selector)
    );

    expect(controls.every(Boolean)).toBe(true);
    for (let index = 0; index < controls.length - 1; index += 1) {
      expect(
        controls[index]!.compareDocumentPosition(controls[index + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
    expect(container.querySelector("#mode-select")).toHaveTextContent("Quiz");
  });

  it("disables starting when the configuration is not interactable", () => {
    renderSetup(false);

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  });
});
