import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RabbitQuizPanel } from "../components/RabbitQuizPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key === "rabbitGame.quiz.progress"
        ? `Question ${values?.current} of ${values?.total}`
        : key === "rabbitGame.quiz.answerAria"
          ? `Answer ${values?.answer}`
          : "Choose the correct answer.",
  }),
}));

describe("RabbitQuizPanel", () => {
  it("uses progress and the equation as the straightforward prompt", () => {
    render(
      <RabbitQuizPanel
        quiz={[
          { a: 4, b: 3, options: [10, 11, 12, 13] },
          { a: 5, b: 2, options: [8, 9, 10, 11] },
        ]}
        quizIndex={0}
        onAnswer={vi.fn()}
      />
    );

    expect(screen.getByText("Question 1 of 2")).toBeVisible();
    expect(screen.getByRole("heading", { name: "4 × 3 = ?" })).toBeVisible();
    expect(screen.queryByText(/continue/i)).not.toBeInTheDocument();
  });

  it("uses readable semantic variants for normal, correct, and wrong answers", () => {
    const question = { a: 9, b: 2, options: [18, 19, 20, 21] };
    const { rerender } = render(<RabbitQuizPanel quiz={[question]} quizIndex={0} onAnswer={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Answer 19" })).toHaveClass("bg-background", "text-foreground");

    rerender(<RabbitQuizPanel quiz={[{ ...question, answer: 18, correct: true }]} quizIndex={0} onAnswer={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Answer 18" })).toHaveClass(
      "bg-emerald-100",
      "text-emerald-800",
      "dark:bg-emerald-950",
      "dark:text-emerald-200"
    );

    rerender(<RabbitQuizPanel quiz={[{ ...question, answer: 21, correct: false }]} quizIndex={0} onAnswer={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Answer 21" })).toHaveClass(
      "bg-red-100",
      "text-red-800",
      "dark:bg-red-950",
      "dark:text-red-200"
    );
  });
});
