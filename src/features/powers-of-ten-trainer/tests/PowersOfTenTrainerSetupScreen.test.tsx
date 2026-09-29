import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import { PowersOfTenTrainerSetupScreen } from "../components/PowersOfTenTrainerSetupScreen";
import { DEFAULT_CONFIG } from "../model/trainer.constants";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

describe("PowersOfTenTrainerSetupScreen", () => {
  it("renders beginner defaults in the standard responsive setup surface", () => {
    const { container } = render(
      <MemoryRouter>
        <PowersOfTenTrainerSetupScreen config={DEFAULT_CONFIG} canStart onConfigChange={vi.fn()} onStart={vi.fn()} />
      </MemoryRouter>
    );
    expect(container.firstElementChild).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50", "md:p-8");
    expect(container.querySelector('[data-slot="card"]')).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Multiplication" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Division" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include ten to the power of 3" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include ten to the power of 4" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  });

  it("connects operation, decimal, hint, and session controls", () => {
    const onConfigChange = vi.fn();
    render(
      <MemoryRouter>
        <PowersOfTenTrainerSetupScreen
          config={DEFAULT_CONFIG}
          canStart
          onConfigChange={onConfigChange}
          onStart={vi.fn()}
        />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Division" }));
    expect(onConfigChange).toHaveBeenCalledWith({ includeDivide: true });
    fireEvent.click(screen.getByRole("checkbox", { name: "Decimals" }));
    expect(onConfigChange).toHaveBeenCalledWith({ includeDecimals: true });
    fireEvent.click(screen.getByRole("switch", { name: "Show place-value hint" }));
    expect(onConfigChange).toHaveBeenCalledWith({ showHint: true });
    fireEvent.change(screen.getByRole("textbox", { name: "Timer minutes" }), { target: { value: "5" } });
    expect(onConfigChange).toHaveBeenCalledWith({ timerMinutes: 5 });
  });

  it("shows selection errors and disables start for an invalid setup", () => {
    render(
      <MemoryRouter>
        <PowersOfTenTrainerSetupScreen
          config={{
            ...DEFAULT_CONFIG,
            includeMultiply: false,
            includeWhole: false,
            powers: { 1: false, 2: false, 3: false, 4: false, 5: false },
          }}
          canStart={false}
          onConfigChange={vi.fn()}
          onStart={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Select at least one operation.")).toBeVisible();
    expect(screen.getByText("Select at least one number type.")).toBeVisible();
    expect(screen.getByText("Select at least one power.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  });
});
