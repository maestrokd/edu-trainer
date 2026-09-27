import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import { BibleBooksGame } from "../components/BibleBooksGame";

const NEXT_BOOK_BY_NAME: Record<string, string> = {
  Genesis: "Exodus",
  Exodus: "Leviticus",
  Leviticus: "Numbers",
  Numbers: "Deuteronomy",
};

const RUSSIAN_NEXT_BOOK_BY_NAME: Record<string, string> = {
  Бытие: "Исход",
  Исход: "Левит",
  Левит: "Числа",
  Числа: "Второзаконие",
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
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

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

  it("uses the green success palette for a correct answer and feedback", () => {
    startFirstFiveRound();

    const currentBook = screen.getByTestId("current-book").textContent ?? "";
    const correctBook = NEXT_BOOK_BY_NAME[currentBook];
    fireEvent.click(screen.getByRole("button", { name: correctBook }));

    expect(screen.getByRole("button", { name: `${correctBook} — Correct answer` })).toHaveClass(
      "border-emerald-500",
      "bg-emerald-100",
      "text-emerald-800"
    );
    expect(screen.getByRole("alert")).toHaveClass("border-emerald-500/40", "bg-emerald-500/10", "text-emerald-800");
  });

  it("switches Bible books to Russian without changing the English application locale", async () => {
    render(
      <MemoryRouter>
        <BibleBooksGame />
      </MemoryRouter>
    );
    const changeLanguageSpy = vi.spyOn(i18n, "changeLanguage");
    const languageSelect = screen.getByRole("combobox", { name: "Bible book language" });

    fireEvent.keyDown(languageSelect, { key: "р" });

    await waitFor(() => expect(languageSelect).toHaveTextContent("Русский"));
    expect(changeLanguageSpy).not.toHaveBeenCalled();
    expect(i18n.resolvedLanguage).toBe("en");
    expect(screen.getByRole("heading", { name: "What Comes Next?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start Practice" }));
    expect(screen.queryByRole("combobox", { name: "Bible book language" })).not.toBeInTheDocument();
    expect(Object.keys(RUSSIAN_NEXT_BOOK_BY_NAME)).toContain(screen.getByTestId("current-book").textContent);

    changeLanguageSpy.mockRestore();
  });

  it("preserves a local Russian book-language selection when playing again", async () => {
    render(
      <MemoryRouter>
        <BibleBooksGame />
      </MemoryRouter>
    );
    const languageSelect = screen.getByRole("combobox", { name: "Bible book language" });
    fireEvent.keyDown(languageSelect, { key: "р" });
    await waitFor(() => expect(languageSelect).toHaveTextContent("Русский"));
    fireEvent.click(screen.getByRole("button", { name: "Start Practice" }));

    for (let questionNumber = 1; questionNumber <= 4; questionNumber += 1) {
      const currentBook = screen.getByTestId("current-book").textContent ?? "";
      fireEvent.click(screen.getByRole("button", { name: RUSSIAN_NEXT_BOOK_BY_NAME[currentBook] }));
      fireEvent.click(screen.getByRole("button", { name: questionNumber === 4 ? "See Results" : "Next Question" }));
    }

    fireEvent.click(screen.getByRole("button", { name: "Play Again" }));
    expect(Object.keys(RUSSIAN_NEXT_BOOK_BY_NAME)).toContain(screen.getByTestId("current-book").textContent);
  });

  it("defaults book language and all interface copy from a Ukrainian application locale", async () => {
    await i18n.changeLanguage("uk-UA");

    render(
      <MemoryRouter>
        <BibleBooksGame />
      </MemoryRouter>
    );

    expect(screen.getByRole("combobox", { name: "Мова назв книг Біблії" })).toHaveTextContent("Українська");
    expect(screen.getByRole("heading", { name: "Що далі?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Почати практику" })).toBeInTheDocument();
  });
});
