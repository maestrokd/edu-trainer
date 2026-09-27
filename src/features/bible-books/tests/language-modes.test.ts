import { describe, expect, it } from "vitest";

import { BIBLE_BOOKS_BY_LANGUAGE, resolveBibleBookLanguage } from "../data/bibleBooks.registry";
import { generateBibleBooksRound, getBooksForPracticeSet, getTransitionsForPracticeSet } from "../lib/quiz-generator";
import type { BibleBookLanguage, PracticeSetId } from "../model/bible-books.types";

const LANGUAGES: readonly BibleBookLanguage[] = ["en", "uk", "ru"];
const PRACTICE_SETS: readonly PracticeSetId[] = ["FIRST_FIVE", "OLD_TESTAMENT", "NEW_TESTAMENT", "ALL_BOOKS"];
const fixedRandom = () => 0.42;

function nextBookId(language: BibleBookLanguage, practiceSet: PracticeSetId, sourceId: string) {
  return getTransitionsForPracticeSet(practiceSet, language).find(
    (transition) => transition.currentBook.id === sourceId
  )?.correctNextBook.id;
}

describe("Bible-book language datasets", () => {
  it.each(LANGUAGES)("keeps the %s dataset complete and internally consistent", (language) => {
    const books = BIBLE_BOOKS_BY_LANGUAGE[language];
    const orders = books.map((book) => book.order).sort((left, right) => left - right);

    expect(books).toHaveLength(66);
    expect(books.filter((book) => book.testament === "OLD")).toHaveLength(39);
    expect(books.filter((book) => book.testament === "NEW")).toHaveLength(27);
    expect(new Set(books.map((book) => book.id)).size).toBe(66);
    expect(new Set(orders).size).toBe(66);
    expect(orders).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
    expect(books.every((book) => book.name.trim().length > 0)).toBe(true);
  });

  it("uses the same stable IDs and semantic metadata in every language", () => {
    const englishById = new Map(BIBLE_BOOKS_BY_LANGUAGE.en.map((book) => [book.id, book]));
    const englishIds = [...englishById.keys()].sort();

    for (const language of ["uk", "ru"] as const) {
      expect(BIBLE_BOOKS_BY_LANGUAGE[language].map((book) => book.id).sort()).toEqual(englishIds);
      BIBLE_BOOKS_BY_LANGUAGE[language].forEach((book) => {
        expect(book).toMatchObject({
          testament: englishById.get(book.id)?.testament,
          section: englishById.get(book.id)?.section,
        });
      });
    }
  });

  it("maps the Russian Synodal Kings titles to stable book identities", () => {
    const russianById = new Map(BIBLE_BOOKS_BY_LANGUAGE.ru.map((book) => [book.id, book.name]));

    expect(russianById.get("1-samuel")).toBe("1 Царств");
    expect(russianById.get("2-samuel")).toBe("2 Царств");
    expect(russianById.get("1-kings")).toBe("3 Царств");
    expect(russianById.get("2-kings")).toBe("4 Царств");
  });
});

describe("language-specific canonical transitions", () => {
  it("preserves the Western New Testament boundaries in English", () => {
    expect(nextBookId("en", "NEW_TESTAMENT", "acts")).toBe("romans");
    expect(nextBookId("en", "NEW_TESTAMENT", "hebrews")).toBe("james");
    expect(nextBookId("en", "NEW_TESTAMENT", "jude")).toBe("revelation");
    expect(nextBookId("en", "NEW_TESTAMENT", "acts")).not.toBe("james");
  });

  it.each(["uk", "ru"] as const)("uses the traditional Eastern New Testament boundaries in %s", (language) => {
    expect(nextBookId(language, "NEW_TESTAMENT", "acts")).toBe("james");
    expect(nextBookId(language, "NEW_TESTAMENT", "jude")).toBe("romans");
    expect(nextBookId(language, "NEW_TESTAMENT", "hebrews")).toBe("revelation");
    expect(nextBookId(language, "NEW_TESTAMENT", "acts")).not.toBe("romans");
    expect(nextBookId(language, "NEW_TESTAMENT", "jude")).not.toBe("revelation");
  });

  it.each(LANGUAGES)("keeps shared practice boundaries correct in %s", (language) => {
    expect(nextBookId(language, "FIRST_FIVE", "genesis")).toBe("exodus");
    expect(nextBookId(language, "FIRST_FIVE", "numbers")).toBe("deuteronomy");
    expect(nextBookId(language, "OLD_TESTAMENT", "zechariah")).toBe("malachi");
    expect(nextBookId(language, "OLD_TESTAMENT", "malachi")).toBeUndefined();
    expect(nextBookId(language, "ALL_BOOKS", "malachi")).toBe("matthew");
    expect(nextBookId(language, "ALL_BOOKS", "revelation")).toBeUndefined();
  });
});

describe("language-aware quiz generation", () => {
  it.each(LANGUAGES)("keeps questions and answers inside the selected %s dataset", (language) => {
    const localizedNames = new Set(BIBLE_BOOKS_BY_LANGUAGE[language].map((book) => book.name));

    for (const practiceSet of PRACTICE_SETS) {
      const round = generateBibleBooksRound(practiceSet, language, fixedRandom);
      const scopeIds = new Set(getBooksForPracticeSet(practiceSet, language).map((book) => book.id));

      expect(round).toHaveLength(practiceSet === "FIRST_FIVE" ? 4 : 10);
      expect(new Set(round.map((question) => question.currentBook.id)).size).toBe(round.length);
      round.forEach((question) => {
        const optionIds = question.answerOptions.map((book) => book.id);

        expect(question.answerOptions).toHaveLength(3);
        expect(new Set(optionIds).size).toBe(3);
        expect(optionIds).not.toContain(question.currentBook.id);
        expect(optionIds.filter((id) => id === question.correctNextBook.id)).toHaveLength(1);
        expect(optionIds.every((id) => scopeIds.has(id))).toBe(true);
        expect(question.answerOptions.every((book) => localizedNames.has(book.name))).toBe(true);
      });
    }
  });
});

describe("Bible-book language resolution", () => {
  it.each([
    ["en", "en"],
    ["en-US", "en"],
    ["en-GB", "en"],
    ["uk", "uk"],
    ["uk-UA", "uk"],
    ["ru", "ru"],
    ["ru-RU", "ru"],
    ["fr-FR", "en"],
    [undefined, "en"],
    [null, "en"],
  ] as const)("maps %s to %s", (locale, expected) => {
    expect(resolveBibleBookLanguage(locale)).toBe(expected);
  });
});
