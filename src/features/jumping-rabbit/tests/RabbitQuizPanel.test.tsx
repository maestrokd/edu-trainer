import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RabbitQuizPanel } from "../components/RabbitQuizPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key === "rabbitGame.quiz.title"
        ? `Answer ×9 (${values?.count} total)`
        : key === "rabbitGame.quiz.answerAria"
          ? `Answer ${values?.answer}`
          : "Choose the correct answer.",
  }),
}));

describe("RabbitQuizPanel", () => {
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
