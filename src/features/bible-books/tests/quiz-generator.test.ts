import { describe, expect, it } from "vitest";

import { BIBLE_BOOKS } from "../data/bibleBooks";
import { generateBibleBooksRound, getBooksForPracticeSet, getTransitionsForPracticeSet } from "../lib/quiz-generator";
import type { PracticeSetId } from "../model/bible-books.types";

const fixedRandom = () => 0.42;

function findTransition(practiceSet: PracticeSetId, sourceBookId: string) {
  return getTransitionsForPracticeSet(practiceSet).find((transition) => transition.currentBook.id === sourceBookId);
}

describe("Bible books data", () => {
  it("contains the complete ordered 66-book canon", () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(BIBLE_BOOKS[0]).toMatchObject({ id: "genesis", order: 1 });
    expect(BIBLE_BOOKS[65]).toMatchObject({ id: "revelation", order: 66 });
    expect(new Set(BIBLE_BOOKS.map((book) => book.id)).size).toBe(66);
    expect(new Set(BIBLE_BOOKS.map((book) => book.order)).size).toBe(66);
  });
});

describe("Bible books practice sets", () => {
  it.each([
    ["FIRST_FIVE", 5, "genesis", "deuteronomy"],
    ["OLD_TESTAMENT", 39, "genesis", "malachi"],
    ["NEW_TESTAMENT", 27, "matthew", "revelation"],
    ["ALL_BOOKS", 66, "genesis", "revelation"],
  ] as const)("filters %s to its expected boundaries", (practiceSet, count, firstId, lastId) => {
    const books = getBooksForPracticeSet(practiceSet);

    expect(books).toHaveLength(count);
    expect(books[0].id).toBe(firstId);
    expect(books.at(-1)?.id).toBe(lastId);
  });

  it("creates the required boundary transitions", () => {
    expect(findTransition("FIRST_FIVE", "genesis")?.correctNextBook.id).toBe("exodus");
    expect(findTransition("FIRST_FIVE", "exodus")?.correctNextBook.id).toBe("leviticus");
    expect(findTransition("FIRST_FIVE", "numbers")?.correctNextBook.id).toBe("deuteronomy");
    expect(findTransition("OLD_TESTAMENT", "zechariah")?.correctNextBook.id).toBe("malachi");
    expect(findTransition("NEW_TESTAMENT", "matthew")?.correctNextBook.id).toBe("mark");
    expect(findTransition("NEW_TESTAMENT", "3-john")?.correctNextBook.id).toBe("jude");
    expect(findTransition("NEW_TESTAMENT", "jude")?.correctNextBook.id).toBe("revelation");
  });

  it("only crosses from Malachi to Matthew in the all-books set", () => {
    expect(findTransition("ALL_BOOKS", "malachi")?.correctNextBook.id).toBe("matthew");
    expect(findTransition("OLD_TESTAMENT", "malachi")).toBeUndefined();
  });

  it.each(["NEW_TESTAMENT", "ALL_BOOKS"] as const)("never uses Revelation as a source book in %s", (practiceSet) => {
    expect(findTransition(practiceSet, "revelation")).toBeUndefined();
  });
});

describe("Bible books round generation", () => {
  it("asks every First 5 transition exactly once", () => {
    const round = generateBibleBooksRound("FIRST_FIVE", "en", fixedRandom);

    expect(round).toHaveLength(4);
    expect(new Set(round.map((question) => question.currentBook.id))).toEqual(
      new Set(["genesis", "exodus", "leviticus", "numbers"])
    );
  });

  it.each(["OLD_TESTAMENT", "NEW_TESTAMENT", "ALL_BOOKS"] as const)(
    "creates ten unique questions for %s",
    (practiceSet) => {
      const round = generateBibleBooksRound(practiceSet, "en", fixedRandom);

      expect(round).toHaveLength(10);
      expect(new Set(round.map((question) => question.currentBook.id)).size).toBe(10);
    }
  );

  it.each(["FIRST_FIVE", "OLD_TESTAMENT", "NEW_TESTAMENT", "ALL_BOOKS"] as const)(
    "creates three unique in-scope answers with exactly one correct answer for %s",
    (practiceSet) => {
      const scopeBookIds = new Set(getBooksForPracticeSet(practiceSet).map((book) => book.id));

      generateBibleBooksRound(practiceSet, "en", fixedRandom).forEach((question) => {
        const optionIds = question.answerOptions.map((book) => book.id);

        expect(optionIds).toHaveLength(3);
        expect(new Set(optionIds).size).toBe(3);
        expect(optionIds.filter((id) => id === question.correctNextBook.id)).toHaveLength(1);
        expect(optionIds).not.toContain(question.currentBook.id);
        expect(optionIds.every((id) => scopeBookIds.has(id))).toBe(true);
      });
    }
  );
});
