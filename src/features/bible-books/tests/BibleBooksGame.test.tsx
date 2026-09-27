import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { BibleBooksGame } from "../components/BibleBooksGame";

const NEXT_BOOK_BY_NAME: Record<string, string> = {
  Genesis: "Exodus",
  Exodus: "Leviticus",
  Leviticus: "Numbers",
  Numbers: "Deuteronomy",
};

function startFirstFiveRound() {
  render(
    <MemoryRouter>
      <BibleBooksGame />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: /start practice/i }));
}

describe("BibleBooksGame", () => {
  it("completes a round, reports the score, and can play again", () => {
    startFirstFiveRound();

    for (let questionNumber = 1; questionNumber <= 4; questionNumber += 1) {
      expect(screen.getByText(`Question ${questionNumber} of 4`)).toBeInTheDocument();

      const currentBook = screen.getByTestId("current-book").textContent ?? "";
      fireEvent.click(screen.getByRole("button", { name: NEXT_BOOK_BY_NAME[currentBook] }));
      expect(screen.getByText("Correct!")).toBeInTheDocument();

      const continueButton = screen.getByRole("button", {
        name: questionNumber === 4 ? /see results/i : /next question/i,
      });
      expect(continueButton).toHaveFocus();
      fireEvent.click(continueButton);
    }

    expect(screen.getByRole("heading", { name: "Great work!" })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "4 out of 4")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /play again/i }));
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
  });

  it("identifies both the correct answer and an incorrect selection", () => {
    startFirstFiveRound();

    const currentBook = screen.getByTestId("current-book").textContent ?? "";
    const correctBook = NEXT_BOOK_BY_NAME[currentBook];
    const incorrectAnswer = screen
      .getAllByRole("button")
      .find((button) => button.textContent !== correctBook && !button.textContent?.includes("Main Menu"));

    expect(incorrectAnswer).toBeDefined();
    fireEvent.click(incorrectAnswer!);

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${correctBook} — Correct answer` })).toBeDisabled();
    expect(screen.getByText("Your answer")).toBeInTheDocument();
  });
});
