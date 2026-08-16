import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CompareNumbersSetupScreen } from "../components/CompareNumbersSetupScreen";
import { DEFAULT_SETUP_STATE } from "../model/trainer.constants";
import type { CompareNumbersSetupState } from "../model/trainer.types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "cmpNmbrGm.setup.title": "Setup",
        "cmpNmbrGm.setup.intro": "Choose number types and practice settings.",
        "cmpNmbrGm.setup.start": "Start training",
        "menu.mainMenuLabel": "Main Menu",
        "cmpNmbrGm.errors.unavailable": "Enable at least one valid number type.",
        "cmpNmbrGm.types.nonNegative.title": "Whole numbers",
        "cmpNmbrGm.types.nonNegative.desc": "Practice non-negative integers.",
        "cmpNmbrGm.types.signed.title": "Signed integers",
        "cmpNmbrGm.types.signed.desc": "Practice negative and positive integers.",
        "cmpNmbrGm.types.decimal.title": "Decimals",
        "cmpNmbrGm.types.decimal.desc": "Practice decimals.",
        "cmpNmbrGm.types.fraction.title": "Fractions",
        "cmpNmbrGm.types.fraction.desc": "Practice fractions.",
        "cmpNmbrGm.ranges.min": "Minimum",
        "cmpNmbrGm.ranges.max": "Maximum",
        "cmpNmbrGm.gap.min": "Minimum gap",
        "cmpNmbrGm.gap.max": "Maximum gap",
        "cmpNmbrGm.equal.label": "Equal answers ratio",
        "cmpNmbrGm.equal.hint": "Controls how often tasks use equals.",
        "cmpNmbrGm.history.order.label": "History order",
        "cmpNmbrGm.history.order.hint": "Choose where new answers appear.",
        "cmpNmbrGm.history.order.oldest": "Oldest first",
        "cmpNmbrGm.history.order.newest": "Newest first",
        "cmpNmbrGm.session.timer": "Timer (minutes)",
        "cmpNmbrGm.session.timerHint": "Leave empty for unlimited session time.",
        "cmpNmbrGm.session.maxExercises": "Max exercises",
        "cmpNmbrGm.session.maxExercisesHint": "Leave empty for unlimited comparisons.",
        "cmpNmbrGm.feedback.sound": "Sound feedback",
        "cmpNmbrGm.feedback.soundDesc": "Play a short tone after each answer.",
        "cmpNmbrGm.feedback.vibration": "Vibration feedback",
        "cmpNmbrGm.feedback.vibrationDesc": "Vibrate on supported devices.",
        "cmpNmbrGm.precision.mode": "Precision mode",
        "cmpNmbrGm.precision.exact": "Exact",
        "cmpNmbrGm.precision.upTo": "Up to",
        "cmpNmbrGm.precision.exactValue": "Decimal places",
        "cmpNmbrGm.precision.maxValue": "Maximum decimal places",
      };

      if (key === "cmpNmbrGm.aria.moreInfo") return `More information about ${String(vars?.field)}`;
      return translations[key] ?? key;
    },
  }),
}));

function renderSetup({
  setup = DEFAULT_SETUP_STATE,
  canUseCoreFeature = true,
}: {
  setup?: CompareNumbersSetupState;
  canUseCoreFeature?: boolean;
} = {}) {
  const callbacks = {
    onOpenModeChange: vi.fn(),
    onNonNegativeConfigChange: vi.fn(),
    onSignedConfigChange: vi.fn(),
    onDecimalConfigChange: vi.fn(),
    onFractionConfigChange: vi.fn(),
    onEqualRatioChange: vi.fn(),
    onHistoryOrderChange: vi.fn(),
    onTimerMinutesChange: vi.fn(),
    onMaxExercisesChange: vi.fn(),
    onEnableSoundChange: vi.fn(),
    onEnableVibrationChange: vi.fn(),
    onStartSession: vi.fn(),
  };

  const view = render(
    <MemoryRouter>
      <CompareNumbersSetupScreen
        setup={setup}
        typeAvailableMap={{ nonNegativeInt: true, signedInt: true, decimal: true, fraction: true }}
        canStart
        canUseCoreFeature={canUseCoreFeature}
        {...callbacks}
      />
    </MemoryRouter>
  );

  return { ...view, callbacks };
}

describe("CompareNumbersSetupScreen", () => {
  it("uses a compact responsive surface while retaining the type accordions", () => {
    const { container } = renderSetup();
    const setup = container.firstElementChild;

    expect(setup).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50", "sm:p-5", "md:p-8");
    expect(setup).not.toHaveClass("bg-muted/50", "p-5");
    expect(screen.queryByRole("heading", { name: "Setup" })).not.toBeInTheDocument();
    expect(screen.getByText("Choose number types and practice settings.")).toHaveClass("hidden", "sm:block");
    expect(screen.getByText("Practice non-negative integers.")).toHaveClass("sr-only", "sm:not-sr-only");
    expect(screen.getAllByRole("button", { name: /Whole numbers|Signed integers|Decimals|Fractions/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Start training" }).parentElement).toHaveClass("grid-cols-2");
  });

  it.each([
    ["Equal answers ratio", "Controls how often tasks use equals."],
    ["Timer (minutes)", "Leave empty for unlimited session time."],
    ["Sound feedback", "Play a short tone after each answer."],
  ])("shows the %s explanation in an info popup", (field, hint) => {
    renderSetup();

    fireEvent.keyDown(screen.getByRole("button", { name: `More information about ${field}` }), { key: "Enter" });

    expect(screen.getByText(hint)).toBeVisible();
  });

  it("maps empty session limits to null and displays infinity", () => {
    const { callbacks } = renderSetup();
    const timer = screen.getByRole("textbox", { name: "Timer (minutes)" });
    const maxExercises = screen.getByRole("textbox", { name: "Max exercises" });

    expect(timer).toHaveValue("");
    expect(timer).toHaveAttribute("placeholder", "∞");
    expect(maxExercises).toHaveAttribute("placeholder", "∞");

    fireEvent.change(timer, { target: { value: "5" } });
    expect(callbacks.onTimerMinutesChange).toHaveBeenLastCalledWith(5);
    fireEvent.change(timer, { target: { value: "" } });
    expect(callbacks.onTimerMinutesChange).toHaveBeenLastCalledWith(null);
  });

  it("allows fixed values to be cleared and replaced while preserving nullable maximum gaps", () => {
    const setup = {
      ...DEFAULT_SETUP_STATE,
      openMode: "nonNegative" as const,
      nonNegativeConfig: {
        ...DEFAULT_SETUP_STATE.nonNegativeConfig,
        min: 10,
        max: 99,
        gap: { min: 0, max: 5 },
      },
    };
    const { callbacks } = renderSetup({ setup });
    const minimum = screen.getByRole("textbox", { name: "Minimum" });
    const maximumGap = screen.getByRole("spinbutton", { name: "Maximum gap" });

    fireEvent.change(minimum, { target: { value: "" } });
    expect(minimum).toHaveValue("");
    expect(callbacks.onNonNegativeConfigChange).not.toHaveBeenCalled();
    fireEvent.change(minimum, { target: { value: "42" } });
    expect(callbacks.onNonNegativeConfigChange).toHaveBeenLastCalledWith({ min: 42, max: 99 });

    expect(maximumGap).toHaveAttribute("placeholder", "∞");
    fireEvent.change(maximumGap, { target: { value: "" } });
    expect(callbacks.onNonNegativeConfigChange).toHaveBeenLastCalledWith({ gap: { min: 0, max: null } });
  });

  it("disables setup actions and feedback controls when the feature is locked", () => {
    renderSetup({ canUseCoreFeature: false });

    expect(screen.getByRole("button", { name: "Start training" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Whole numbers" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Sound feedback" })).toBeDisabled();
  });

  it("stacks decimal precision fields into separate rows", () => {
    const setup = { ...DEFAULT_SETUP_STATE, openMode: "decimal" as const };
    const { container } = renderSetup({ setup });
    const precisionMode = container.querySelector<HTMLElement>("#decimal-mode");
    const decimalPlaces = container.querySelector<HTMLElement>("#decimal-precision");
    const precisionRows = precisionMode?.closest<HTMLElement>(".grid.gap-3");

    expect(precisionRows).toContainElement(decimalPlaces);
    expect(precisionRows).not.toHaveClass("grid-cols-2");
  });

  it("orders exercise preferences, limits, and feedback and uses the canonical menu label", () => {
    const { container } = renderSetup();
    const controls = ["#equal-ratio", "#history-order", "#timer-min", "#feedback-sound"].map((selector) =>
      container.querySelector(selector)
    );

    expect(controls.every(Boolean)).toBe(true);
    for (let index = 0; index < controls.length - 1; index += 1) {
      expect(
        controls[index]!.compareDocumentPosition(controls[index + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Main Menu" })).toHaveAttribute("href", "/");
  });
});
