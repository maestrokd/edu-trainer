import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RabbitPlayScreen } from "../components/RabbitPlayScreen";
import { getInitialRabbitState } from "../model/rabbit.reducer";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key === "rabbitGame.score" ? `Score: ${values?.score}` : key,
  }),
}));

vi.mock("../hooks/useRabbitGameEngine", () => ({
  useRabbitGameEngine: () => ({
    canvasRef: { current: null },
    gameAreaRef: { current: null },
    focusCanvas: vi.fn(),
    prepareAfterQuiz: vi.fn(),
    playQuizFeedback: vi.fn(),
  }),
}));

vi.mock("../components/RabbitSettingsMenu", () => ({
  RabbitSettingsMenu: () => <button type="button">Game settings</button>,
}));

describe("RabbitPlayScreen", () => {
  it("fills the viewport and layers score and settings over the canvas", () => {
    const state = { ...getInitialRabbitState(), phase: "playing" as const, score: 7, runId: 1 };
    const { container } = render(
      <RabbitPlayScreen
        state={state}
        onScoreChange={vi.fn()}
        onQuizRequested={vi.fn()}
        onAnswer={vi.fn()}
        onFinished={vi.fn()}
        onMessage={vi.fn()}
        onPlayAgain={vi.fn()}
        onChangeSettings={vi.fn()}
        onMenuOpenChange={vi.fn()}
      />
    );

    expect(container.firstElementChild).toHaveClass("fixed", "inset-0", "h-dvh", "w-screen", "overflow-hidden");
    expect(screen.getByText("Score: 7")).toBeVisible();
    expect(screen.getByRole("button", { name: "Game settings" })).toBeVisible();
    expect(container.querySelector("canvas")?.parentElement).toHaveClass("absolute", "inset-0");
  });
});
