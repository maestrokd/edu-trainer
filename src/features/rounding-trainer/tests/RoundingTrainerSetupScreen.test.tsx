import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RoundingTrainerSetupScreen } from "../components/RoundingTrainerSetupScreen";
import { DEFAULT_CONFIG } from "../model/trainer.constants";
import type { SessionConfig } from "../model/trainer.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "roundT.setup.intro": "Choose numbers and rounding places.",
        "roundT.setup.mode": "Mode",
        "roundT.setup.timer": "Timer (minutes)",
        "roundT.setup.timerHint": "Leave empty for unlimited session time.",
        "roundT.setup.maxExercises": "Max exercises",
        "roundT.setup.maxExercisesHint": "Leave empty for unlimited exercises.",
        "roundT.setup.sounds": "Sound feedback",
        "roundT.setup.numberTypes": "Number types",
        "roundT.setup.filtersHint": "Empty filters include every option in that group.",
        "roundT.setup.whole": "Whole numbers",
        "roundT.setup.decimals": "Decimals",
        "roundT.setup.decimalPlaces": "Decimal places",
        "roundT.setup.signs": "Sign filters",
        "roundT.setup.positives": "Positives",
        "roundT.setup.negatives": "Negatives",
        "roundT.setup.magnitude": "Magnitude",
        "roundT.setup.digitsMode": "Digits range",
        "roundT.setup.rangeMode": "Numeric range",
        "roundT.setup.minDigits": "Min digits",
        "roundT.setup.maxDigits": "Max digits",
        "roundT.setup.minValue": "Min value",
        "roundT.setup.maxValue": "Max value",
        "roundT.setup.targets": "Round to",
        "roundT.setup.roundingOptions": "Rounding options",
        "roundT.setup.includeTie": "Include tie cases",
        "roundT.setup.includeTieHint": "Guarantee one tie case per session.",
        "roundT.setup.showHint": "Show place-value hints",
        "roundT.setup.showHintHint": "Show a hint under the exercise.",
        "roundT.mode.quiz": "Quiz",
        "roundT.mode.input": "Input",
        "roundT.targets.tens": "tens",
        "roundT.targets.hundreds": "hundreds",
        "roundT.targets.thousands": "thousands",
        "roundT.aria.timerMinutes": "Timer minutes",
        "roundT.aria.maxExercises": "Maximum exercises",
        "roundT.aria.backToMenu": "Back to menu",
        "roundT.start": "Start",
        "menu.mainMenuLabel": "Main Menu",
      };

      if (key === "roundT.aria.moreInfo") return `More information about ${String(vars?.field)}`;
      return translations[key] ?? key;
    },
  }),
}));

function renderSetup({
  config = DEFAULT_CONFIG,
  canUseCoreFeature = true,
}: {
  config?: SessionConfig;
  canUseCoreFeature?: boolean;
} = {}) {
  const onConfigChange = vi.fn();
  const onStart = vi.fn();
  const view = render(
    <MemoryRouter>
      <RoundingTrainerSetupScreen
        config={config}
        canUseCoreFeature={canUseCoreFeature}
        onConfigChange={onConfigChange}
        onStart={onStart}
      />
    </MemoryRouter>
  );

  return { ...view, onConfigChange, onStart };
}

describe("RoundingTrainerSetupScreen", () => {
  it("uses one compact responsive surface without nested cards", () => {
    const { container } = renderSetup();
    const setup = container.firstElementChild;

    expect(setup).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50", "sm:p-5", "md:p-8");
    expect(setup).not.toHaveClass("bg-muted/50", "p-5");
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    expect(screen.getByText("Choose numbers and rounding places.")).toHaveClass("hidden", "sm:block");
    expect(screen.getByRole("region", { name: "Rounding options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" }).parentElement).toHaveClass("grid-cols-2");
  });

  it.each([
    ["Timer (minutes)", "Leave empty for unlimited session time."],
    ["Number types", "Empty filters include every option in that group."],
    ["Include tie cases", "Guarantee one tie case per session."],
  ])("shows the %s explanation in an info popup", (field, hint) => {
    renderSetup();

    fireEvent.keyDown(screen.getByRole("button", { name: `More information about ${field}` }), { key: "Enter" });

    expect(screen.getByText(hint)).toBeVisible();
  });

  it("uses infinity only for zero-as-unlimited session limits", () => {
    const { onConfigChange } = renderSetup();
    const timer = screen.getByRole("textbox", { name: "Timer minutes" });
    const maxExercises = screen.getByRole("textbox", { name: "Maximum exercises" });

    expect(timer).toHaveValue("");
    expect(timer).toHaveAttribute("placeholder", "∞");
    expect(maxExercises).toHaveValue("");
    expect(maxExercises).toHaveAttribute("placeholder", "∞");

    fireEvent.change(timer, { target: { value: "8" } });
    expect(onConfigChange).toHaveBeenLastCalledWith({ timerMinutes: 8 });
    fireEvent.change(timer, { target: { value: "" } });
    expect(onConfigChange).toHaveBeenLastCalledWith({ timerMinutes: 0 });
  });

  it("allows magnitude values to be cleared and replaced with safe blur fallbacks", () => {
    const config = { ...DEFAULT_CONFIG, magnitudeMode: "range" as const, minValue: 10, maxValue: 9999 };
    const { onConfigChange } = renderSetup({ config });
    const minimum = screen.getByRole("textbox", { name: "Min value" });
    const maximum = screen.getByRole("textbox", { name: "Max value" });

    expect(minimum).not.toHaveAttribute("placeholder", "∞");
    fireEvent.change(minimum, { target: { value: "" } });
    expect(minimum).toHaveValue("");
    expect(onConfigChange).not.toHaveBeenCalled();
    fireEvent.change(minimum, { target: { value: "25" } });
    expect(onConfigChange).toHaveBeenLastCalledWith({ minValue: 25 });

    fireEvent.change(maximum, { target: { value: "" } });
    fireEvent.blur(maximum);
    expect(maximum).toHaveValue("10");
    expect(onConfigChange).toHaveBeenLastCalledWith({ maxValue: 10 });
  });

  it("keeps setup controls locked when the capability is unavailable", () => {
    renderSetup({ canUseCoreFeature: false });

    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Timer minutes" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Whole numbers" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Include tie cases" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Show place-value hints" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Sound feedback" })).toBeDisabled();
  });

  it("connects rounding-option and sound switches to configuration updates", () => {
    const { onConfigChange } = renderSetup();

    fireEvent.click(screen.getByRole("switch", { name: "Include tie cases" }));
    expect(onConfigChange).toHaveBeenCalledWith({ includeTieCase: true });

    fireEvent.click(screen.getByRole("switch", { name: "Show place-value hints" }));
    expect(onConfigChange).toHaveBeenCalledWith({ showHint: true });

    fireEvent.click(screen.getByRole("switch", { name: "Sound feedback" }));
    expect(onConfigChange).toHaveBeenCalledWith({ soundsEnabled: true });
  });

  it("orders generation, targets, mode, limits, and feedback and selects quiz by default", () => {
    const { container } = renderSetup();
    const controls = [
      "#rounding-whole",
      "#rounding-positives",
      "#min-digits-select",
      "#target-10",
      "#include-tie-case",
      "#show-place-hint",
      "#rounding-mode-select",
      "#timer-minutes",
      "#rounding-sounds-switch",
    ].map((selector) => container.querySelector(selector));

    expect(controls.every(Boolean)).toBe(true);
    for (let index = 0; index < controls.length - 1; index += 1) {
      expect(
        controls[index]!.compareDocumentPosition(controls[index + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
    expect(container.querySelector("#rounding-mode-select")).toHaveTextContent("Quiz");
    expect(screen.getByText("Main Menu")).toBeVisible();
  });
});
