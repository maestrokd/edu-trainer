import { describe, expect, it } from "vitest";

import { BIBLE_BOOKS_BY_LANGUAGE } from "@/features/bible-books/data/bibleBooks.registry";

import { getBibleBookshelfGroupBooks, getBibleBookshelfGroups } from "../data/learning-groups";
import { bibleBookshelfReducer, buildRoundWindows, createBibleBookshelfState, getRoundWindows } from "../lib/game";

const fixedRandom = () => 0.42;

describe("Bible Bookshelf learning groups", () => {
  it.each(["en", "uk", "ru"] as const)("covers the complete ordered %s canon exactly once", (language) => {
    const localeBooks = [...BIBLE_BOOKS_BY_LANGUAGE[language]].sort((left, right) => left.order - right.order);
    const groupBookIds = getBibleBookshelfGroups(language).flatMap((group) =>
      getBibleBookshelfGroupBooks(language, group.id).map((book) => book.id)
    );
    const canonBookIds = localeBooks.map((book) => book.id);

    expect(localeBooks.map((book) => book.order)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
    expect(groupBookIds).toEqual(canonBookIds);
    expect(new Set(groupBookIds).size).toBe(66);
  });

  it("uses eight English groups and seven contiguous Eastern-order groups", () => {
    expect(getBibleBookshelfGroups("en")).toHaveLength(8);
    expect(getBibleBookshelfGroups("uk")).toHaveLength(7);
    expect(getBibleBookshelfGroups("ru").at(-2)).toMatchObject({ startOrder: 40, endOrder: 51 });
    expect(getBibleBookshelfGroups("ru").at(-1)).toMatchObject({ startOrder: 52, endOrder: 66 });
  });
});

describe("Bible Bookshelf round windows", () => {
  it("creates full contiguous windows with overlap and a shifted final window", () => {
    expect(buildRoundWindows([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])).toEqual([
      [6, 7, 8, 9, 10],
      [10, 11, 12, 13, 14],
      [13, 14, 15, 16, 17],
    ]);
  });

  it("keeps short groups in one window", () => {
    expect(buildRoundWindows([1, 2, 3])).toEqual([[1, 2, 3]]);
  });
});

describe("Bible Bookshelf game reducer", () => {
  it("anchors Genesis and accepts only the correct placement", () => {
    const initial = createBibleBookshelfState("en", "law", 0, fixedRandom);
    expect(initial.placedBySlot).toEqual({ 0: "genesis" });
    expect(initial.trayBookIds).toHaveLength(4);

    const wrong = bibleBookshelfReducer(initial, {
      type: "attempt-placement",
      bookId: "leviticus",
      slotIndex: 4,
    });
    expect(wrong.placedBySlot).toEqual(initial.placedBySlot);
    expect(wrong.trayBookIds).toEqual(initial.trayBookIds);
    expect(wrong.feedback?.kind).toBe("incorrect");

    const correct = bibleBookshelfReducer(wrong, {
      type: "attempt-placement",
      bookId: "exodus",
      slotIndex: 1,
    });
    expect(correct.placedBySlot[1]).toBe("exodus");
    expect(correct.trayBookIds).not.toContain("exodus");
    expect(correct.feedback?.kind).toBe("correct");

    expect(
      bibleBookshelfReducer(correct, {
        type: "attempt-placement",
        bookId: "leviticus",
        slotIndex: 1,
      })
    ).toBe(correct);
    expect(
      bibleBookshelfReducer(correct, {
        type: "attempt-placement",
        bookId: "exodus",
        slotIndex: 2,
      })
    ).toBe(correct);
  });

  it("completes, resets to the anchor, and wraps after the final window", () => {
    let state = createBibleBookshelfState("en", "law", 0, fixedRandom);
    state.roundBookIds.slice(1).forEach((bookId, index) => {
      state = bibleBookshelfReducer(state, {
        type: "attempt-placement",
        bookId,
        slotIndex: index + 1,
      });
    });
    expect(state.isComplete).toBe(true);

    const reset = bibleBookshelfReducer(state, { type: "reset-round", random: fixedRandom });
    expect(reset.placedBySlot).toEqual({ 0: "genesis" });
    expect(reset.isComplete).toBe(false);

    const historyWindows = getRoundWindows("en", "history");
    let history = createBibleBookshelfState("en", "history", historyWindows.length - 1, fixedRandom);
    history = bibleBookshelfReducer(history, { type: "next-round", random: fixedRandom });
    expect(history.windowIndex).toBe(0);
    expect(history.roundBookIds).toEqual(historyWindows[0]);
  });

  it("hints the next empty slot without placing a book", () => {
    const initial = createBibleBookshelfState("en", "law", 0, fixedRandom);
    const hinted = bibleBookshelfReducer(initial, { type: "show-hint" });

    expect(hinted.hintSlotIndex).toBe(1);
    expect(hinted.hintBookId).toBe("exodus");
    expect(hinted.placedBySlot).toEqual(initial.placedBySlot);
  });

  it("changes groups, advances windows, and resets to Law when the locale changes", () => {
    const initial = createBibleBookshelfState("en", "law", 0, fixedRandom);
    const history = bibleBookshelfReducer(initial, {
      type: "change-group",
      groupId: "history",
      random: fixedRandom,
    });

    expect(history.windowIndex).toBe(0);
    expect(history.placedBySlot).toEqual({ 0: "joshua" });

    const historyWindows = getRoundWindows("en", "history");
    const advanced = bibleBookshelfReducer(history, { type: "next-round", random: fixedRandom });
    expect(advanced.windowIndex).toBe(1);
    expect(advanced.roundBookIds).toEqual(historyWindows[1]);
    expect(advanced.placedBySlot).toEqual({ 0: historyWindows[1][0] });

    const localized = bibleBookshelfReducer(advanced, {
      type: "change-language",
      language: "uk",
      random: fixedRandom,
    });
    expect(localized.groupId).toBe("law");
    expect(localized.windowIndex).toBe(0);
    expect(localized.placedBySlot).toEqual({ 0: "genesis" });
  });
});
