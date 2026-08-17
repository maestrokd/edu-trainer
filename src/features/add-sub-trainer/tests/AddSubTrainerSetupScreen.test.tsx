import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AddSubTrainerSetupScreen } from "../components/AddSubTrainerSetupScreen";
import { DEFAULT_CONFIG } from "../model/trainer.constants";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "addSubT.start": "Start",
        "addSubT.setup.intro": "Choose operations and practice settings.",
        "addSubT.setup.operations": "Operations",
        "addSubT.setup.addition": "Addition",
        "addSubT.setup.subtraction": "Subtraction",
        "addSubT.setup.oneRequired": "Select at least one operation.",
        "addSubT.setup.range": "Exercise range",
        "addSubT.setup.rangeHint": "Addition sums stay within this range.",
        "addSubT.setup.min": "Minimum",
        "addSubT.setup.max": "Maximum",
        "addSubT.setup.answerMode": "Answer mode",
        "addSubT.setup.mode": "Problem mode",
        "addSubT.setup.timer": "Timer (minutes)",
        "addSubT.setup.timerHint": "Leave empty for unlimited session time.",
        "addSubT.setup.maxExercises": "Max exercises",
        "addSubT.setup.maxExercisesHint": "Leave empty for unlimited questions.",
        "addSubT.setup.sounds": "Sound feedback",
        "addSubT.setup.soundsHint": "Voice feedback for answers",
        "addSubT.mode.quiz": "Quiz",
        "addSubT.mode.input": "Manual input",
        "addSubT.mode.result": "Type the result",
        "addSubT.mode.missing": "Find the missing number",
        "addSubT.aria.add": "Include addition",
        "addSubT.aria.sub": "Include subtraction",
        "addSubT.aria.timer": "Timer minutes",
        "addSubT.aria.maxExercises": "Maximum exercises",
        "addSubT.aria.sounds": "Enable sounds",
        "menu.mainMenuLabel": "Main Menu",
      };

      if (key === "addSubT.aria.moreInfo") return `More information about ${String(vars?.field)}`;
      return translations[key] ?? key;
    },
  }),
}));

function renderSetup(canStart = true) {
  const updateConfig = vi.fn();
  const startGame = vi.fn();
  const controller = {
    state: { config: { ...DEFAULT_CONFIG } },
    canStart,
    actions: { updateConfig, startGame },
  };

  const view = render(
    <MemoryRouter>
      <AddSubTrainerSetupScreen controller={controller} />
    </MemoryRouter>
  );

  return { ...view, updateConfig, startGame };
}

describe("AddSubTrainerSetupScreen", () => {
  it("uses one responsive surface without nested cards", () => {
    const { container } = renderSetup();
    const setup = container.firstElementChild;

    expect(setup).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50", "sm:p-5", "md:p-8");
    expect(setup).not.toHaveClass("bg-muted/50", "p-5");
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    expect(screen.getByText("Choose operations and practice settings.")).toHaveClass("hidden", "sm:block");
    expect(screen.getByRole("button", { name: "Start" }).parentElement).toHaveClass("grid-cols-2");
  });

  it.each([
    ["Exercise range", "Addition sums stay within this range."],
    ["Timer (minutes)", "Leave empty for unlimited session time."],
    ["Max exercises", "Leave empty for unlimited questions."],
    ["Sound feedback", "Voice feedback for answers"],
  ])("shows the %s hint from its info popup", (field, hint) => {
    renderSetup();

    fireEvent.keyDown(screen.getByRole("button", { name: `More information about ${field}` }), { key: "Enter" });

    expect(screen.getByText(hint)).toBeVisible();
  });

  it("keeps setup controls connected to trainer actions", () => {
    const { updateConfig, startGame } = renderSetup();

    fireEvent.click(screen.getByRole("checkbox", { name: "Include subtraction" }));
    expect(updateConfig).toHaveBeenCalledWith({ includeSub: false });

    fireEvent.change(screen.getByRole("textbox", { name: "Minimum" }), { target: { value: "-7" } });
    expect(updateConfig).toHaveBeenCalledWith({ minVal: -7 });

    fireEvent.click(screen.getByRole("switch", { name: "Sound feedback" }));
    expect(updateConfig).toHaveBeenCalledWith({ enableSounds: true });

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(startGame).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Main Menu" })).toHaveAttribute("href", "/");
  });

  it("orders generation, modes, limits, and feedback and selects quiz by default", () => {
    const { container } = renderSetup();
    const controls = ["#op-add", "#min-input", "#play-mode", "#timer-min", "#sounds-toggle"].map((selector) =>
      container.querySelector(selector)
    );

    expect(controls.every(Boolean)).toBe(true);
    for (let index = 0; index < controls.length - 1; index += 1) {
      expect(
        controls[index]!.compareDocumentPosition(controls[index + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
    expect(container.querySelector("#play-mode")).toHaveTextContent("Quiz");
  });
});
