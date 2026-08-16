import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RabbitSetupScreen } from "../components/RabbitSetupScreen";
import { DEFAULT_RABBIT_CONFIG } from "../model/rabbit.constants";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "rabbitGame.title": "Jumping Rabbit ×9",
        "rabbitGame.setup.description": "Jump over flowers and answer questions.",
        "rabbitGame.setup.questions": "Questions after a hit",
        "rabbitGame.setup.questionsHint": "Choose the question count.",
        "rabbitGame.setup.askQuiz": "Ask a multiplication quiz after a hit",
        "rabbitGame.setup.effects": "Sound and vibration effects",
        "rabbitGame.setup.start": "Start game",
        "rabbitGame.aria.questions": "Number of questions after a hit",
        "rabbitGame.aria.backToMenu": "Back to main menu",
        "menu.mainMenuLabel": "Main Menu",
      })[key] ?? key,
  }),
}));

describe("RabbitSetupScreen", () => {
  it("shows a dedicated responsive configuration surface", () => {
    const { container } = render(
      <MemoryRouter>
        <RabbitSetupScreen config={DEFAULT_RABBIT_CONFIG} onConfigChange={vi.fn()} onStart={vi.fn()} />
      </MemoryRouter>
    );

    expect(container.firstElementChild).toHaveClass("flex-1", "overflow-y-auto", "sm:bg-muted/50");
    expect(screen.getByRole("heading", { name: "Jumping Rabbit ×9" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Number of questions after a hit" })).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: "Back to main menu" })).toHaveAttribute("href", "/");
  });

  it("connects settings and start controls to their callbacks", () => {
    const onConfigChange = vi.fn();
    const onStart = vi.fn();
    render(
      <MemoryRouter>
        <RabbitSetupScreen config={DEFAULT_RABBIT_CONFIG} onConfigChange={onConfigChange} onStart={onStart} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Ask a multiplication quiz after a hit" }));
    expect(onConfigChange).toHaveBeenCalledWith({ askOnHit: false });

    fireEvent.click(screen.getByRole("checkbox", { name: "Sound and vibration effects" }));
    expect(onConfigChange).toHaveBeenCalledWith({ effectsEnabled: false });

    fireEvent.click(screen.getByRole("button", { name: "Start game" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
