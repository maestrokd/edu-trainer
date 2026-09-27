import { describe, expect, it } from "vitest";

import { BIBLE_BOOKS_BY_LANGUAGE } from "@/features/bible-books/data/bibleBooks.registry";

import {
  getBibleBookshelfGroupBooks,
  getBibleBookshelfGroups,
  getBibleBookshelfTestamentBooks,
} from "../data/learning-groups";
import {
  bibleBookshelfReducer,
  buildRoundWindows,
  createBibleBookshelfState,
  getRoundWindows,
  hasBibleBookshelfProgress,
  type BibleBookshelfState,
} from "../lib/game";

const fixedRandom = () => 0.42;

function startLawRound(language: "en" | "uk" | "ru" = "en") {
  return bibleBookshelfReducer(createBibleBookshelfState(language), {
    type: "start-game",
    random: fixedRandom,
  });
}

function startTestamentRound(testament: "OLD" | "NEW", language: "en" | "uk" | "ru" = "en") {
  let state = createBibleBookshelfState(language);
  state = bibleBookshelfReducer(state, { type: "set-mode", mode: "testament" });
  state = bibleBookshelfReducer(state, { type: "set-testament", testament });
  return bibleBookshelfReducer(state, { type: "start-game", random: fixedRandom });
}

function completeRound(state: BibleBookshelfState) {
  let completed = state;
  completed.roundBookIds.forEach((bookId, slotIndex) => {
    if (completed.placedBySlot[slotIndex]) return;
    completed = bibleBookshelfReducer(completed, {
      type: "attempt-placement",
      bookId,
      slotIndex,
    });
  });
  return completed;
}

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

  it.each(["en", "uk", "ru"] as const)("provides complete testament scopes in %s order", (language) => {
    expect(getBibleBookshelfTestamentBooks(language, "OLD")).toHaveLength(39);
    expect(getBibleBookshelfTestamentBooks(language, "NEW")).toHaveLength(27);
    expect(getBibleBookshelfTestamentBooks(language, "NEW").map((book) => book.order)).toEqual(
      Array.from({ length: 27 }, (_, index) => index + 40)
    );
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

describe("Bible Bookshelf setup and reducer", () => {
  it("starts in setup and anchors only learning-group rounds", () => {
    const setup = createBibleBookshelfState("en");
    expect(setup.phase).toBe("setup");
    expect(setup.config).toMatchObject({ bibleLanguage: "en", mode: "groups", groupId: "law" });

    const groupRound = startLawRound();
    expect(groupRound.placedBySlot).toEqual({ 0: "genesis" });
    expect(groupRound.trayBookIds).toHaveLength(4);
    expect(hasBibleBookshelfProgress(groupRound)).toBe(false);

    const testamentRound = startTestamentRound("OLD");
    expect(testamentRound.placedBySlot).toEqual({});
    expect(testamentRound.roundBookIds).toHaveLength(39);
    expect(testamentRound.trayBookIds).toHaveLength(39);
    expect(hasBibleBookshelfProgress(testamentRound)).toBe(false);
  });

  it("changes the local language only in setup, resets the group, and retains the testament", () => {
    let state = createBibleBookshelfState("en");
    state = bibleBookshelfReducer(state, { type: "set-group", groupId: "history" });
    state = bibleBookshelfReducer(state, { type: "set-testament", testament: "NEW" });
    state = bibleBookshelfReducer(state, { type: "set-bible-language", language: "ru" });

    expect(state.config).toMatchObject({ bibleLanguage: "ru", groupId: "law", testament: "NEW" });

    const playing = bibleBookshelfReducer(state, { type: "start-game", random: fixedRandom });
    expect(bibleBookshelfReducer(playing, { type: "set-bible-language", language: "uk" })).toBe(playing);
  });

  it("accepts only correct placements and locks placed slots and books", () => {
    const initial = startLawRound();
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
    expect(hasBibleBookshelfProgress(correct)).toBe(true);
    expect(bibleBookshelfReducer(correct, { type: "attempt-placement", bookId: "leviticus", slotIndex: 1 })).toBe(
      correct
    );
    expect(bibleBookshelfReducer(correct, { type: "attempt-placement", bookId: "exodus", slotIndex: 2 })).toBe(correct);
  });

  it("completes, resets, advances group windows, and wraps after the final window", () => {
    const completed = completeRound(startLawRound());
    expect(completed.isComplete).toBe(true);

    const reset = bibleBookshelfReducer(completed, { type: "reset-round", random: fixedRandom });
    expect(reset.placedBySlot).toEqual({ 0: "genesis" });
    expect(reset.isComplete).toBe(false);

    let historySetup = createBibleBookshelfState("en");
    historySetup = bibleBookshelfReducer(historySetup, { type: "set-group", groupId: "history" });
    let history = bibleBookshelfReducer(historySetup, { type: "start-game", random: fixedRandom });
    const historyWindows = getRoundWindows("en", "history");
    history = bibleBookshelfReducer(history, { type: "next-round", random: fixedRandom });
    expect(history.windowIndex).toBe(1);
    expect(history.roundBookIds).toEqual(historyWindows[1]);

    for (let index = 1; index < historyWindows.length; index += 1) {
      history = bibleBookshelfReducer(history, { type: "next-round", random: fixedRandom });
    }
    expect(history.windowIndex).toBe(0);
    expect(history.roundBookIds).toEqual(historyWindows[0]);
  });

  it("hints the first empty slot without placing a book", () => {
    const initial = startTestamentRound("NEW", "ru");
    const hinted = bibleBookshelfReducer(initial, { type: "show-hint" });

    expect(hinted.hintSlotIndex).toBe(0);
    expect(hinted.hintBookId).toBe(initial.roundBookIds[0]);
    expect(hinted.placedBySlot).toEqual({});
  });

  it("completes and replays the same full testament while setup exit retains configuration", () => {
    const completed = completeRound(startTestamentRound("NEW", "uk"));
    expect(completed.isComplete).toBe(true);
    expect(Object.keys(completed.placedBySlot)).toHaveLength(27);

    const replayed = bibleBookshelfReducer(completed, { type: "play-again", random: fixedRandom });
    expect(replayed.config).toEqual(completed.config);
    expect(replayed.placedBySlot).toEqual({});
    expect(replayed.trayBookIds).toHaveLength(27);

    const setup = bibleBookshelfReducer(replayed, { type: "return-to-setup" });
    expect(setup.phase).toBe("setup");
    expect(setup.config).toEqual(replayed.config);
    expect(setup.roundBookIds).toEqual([]);
  });
});
