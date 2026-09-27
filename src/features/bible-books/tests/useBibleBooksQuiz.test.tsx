import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { BIBLE_BOOKS_BY_LANGUAGE } from "../data/bibleBooks.registry";
import { useBibleBooksQuiz } from "../hooks/useBibleBooksQuiz";

describe("useBibleBooksQuiz language state", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("uses the selected dataset and preserves the selection when returning to setup", () => {
    const { result } = renderHook(() => useBibleBooksQuiz());

    act(() => result.current.actions.setSelectedBibleLanguage("ru"));
    act(() => result.current.actions.startRound());

    const russianNames = new Set(BIBLE_BOOKS_BY_LANGUAGE.ru.map((book) => book.name));
    expect(result.current.state.selectedBibleLanguage).toBe("ru");
    expect(russianNames.has(result.current.state.currentQuestion?.currentBook.name ?? "")).toBe(true);

    act(() => result.current.actions.changePracticeSet());

    expect(result.current.state.phase).toBe("setup");
    expect(result.current.state.selectedBibleLanguage).toBe("ru");
  });
});
