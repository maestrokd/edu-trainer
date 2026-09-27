import type { BibleBookLanguage } from "@/features/bible-books/model/bible-books.types";

import { getBibleBookshelfGroupBooks, type BibleBookshelfGroupId } from "../data/learning-groups";

export const BIBLE_BOOKSHELF_ROUND_SIZE = 5;

export interface PlacementFeedback {
  id: number;
  kind: "correct" | "incorrect";
  bookId: string;
  slotIndex: number;
}

export interface BibleBookshelfState {
  language: BibleBookLanguage;
  groupId: BibleBookshelfGroupId;
  windowIndex: number;
  roundBookIds: string[];
  trayBookIds: string[];
  placedBySlot: Record<number, string>;
  selectedBookId: string | null;
  hintBookId: string | null;
  hintSlotIndex: number | null;
  hintId: number;
  feedback: PlacementFeedback | null;
  isComplete: boolean;
  roundId: number;
}

export type BibleBookshelfAction =
  | { type: "select-book"; bookId: string }
  | { type: "attempt-placement"; bookId: string; slotIndex: number }
  | { type: "show-hint" }
  | { type: "clear-hint"; hintId: number }
  | { type: "clear-feedback"; feedbackId: number }
  | { type: "reset-round"; random?: () => number }
  | { type: "change-group"; groupId: BibleBookshelfGroupId; random?: () => number }
  | { type: "change-language"; language: BibleBookLanguage; random?: () => number }
  | { type: "next-round"; random?: () => number };

export function shuffle<T>(values: readonly T[], random: () => number = Math.random): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function buildRoundWindows<T>(values: readonly T[], roundSize = BIBLE_BOOKSHELF_ROUND_SIZE): T[][] {
  if (values.length === 0) return [];
  const normalizedRoundSize = Math.max(1, roundSize);
  if (values.length <= normalizedRoundSize) return [[...values]];

  const windows: T[][] = [];
  const step = Math.max(1, normalizedRoundSize - 1);
  let cursor = 0;
  let previousStart = -1;

  while (cursor < values.length) {
    const windowEnd = Math.min(cursor + normalizedRoundSize, values.length);
    const windowStart = Math.max(0, windowEnd - normalizedRoundSize);

    if (previousStart !== windowStart) {
      windows.push(values.slice(windowStart, windowEnd));
      previousStart = windowStart;
    }

    if (windowEnd === values.length) break;
    cursor += step;
  }

  return windows;
}

export function getRoundWindows(language: BibleBookLanguage, groupId: BibleBookshelfGroupId): string[][] {
  const bookIds = getBibleBookshelfGroupBooks(language, groupId).map((book) => book.id);
  return buildRoundWindows(bookIds);
}

function createRound(
  language: BibleBookLanguage,
  groupId: BibleBookshelfGroupId,
  windowIndex: number,
  random: () => number,
  roundId: number
): BibleBookshelfState {
  const windows = getRoundWindows(language, groupId);
  const normalizedWindowIndex = windows.length === 0 ? 0 : windowIndex % windows.length;
  const roundBookIds = windows[normalizedWindowIndex] ?? [];
  const anchorBookId = roundBookIds[0];

  return {
    language,
    groupId,
    windowIndex: normalizedWindowIndex,
    roundBookIds,
    trayBookIds: shuffle(roundBookIds.slice(1), random),
    placedBySlot: anchorBookId ? { 0: anchorBookId } : {},
    selectedBookId: null,
    hintBookId: null,
    hintSlotIndex: null,
    hintId: 0,
    feedback: null,
    isComplete: roundBookIds.length === 1,
    roundId,
  };
}

export function createBibleBookshelfState(
  language: BibleBookLanguage,
  groupId: BibleBookshelfGroupId = "law",
  windowIndex = 0,
  random: () => number = Math.random
): BibleBookshelfState {
  return createRound(language, groupId, windowIndex, random, 0);
}

export function bibleBookshelfReducer(state: BibleBookshelfState, action: BibleBookshelfAction): BibleBookshelfState {
  switch (action.type) {
    case "select-book":
      if (!state.trayBookIds.includes(action.bookId) || state.isComplete) return state;
      return {
        ...state,
        selectedBookId: state.selectedBookId === action.bookId ? null : action.bookId,
      };

    case "attempt-placement": {
      if (
        state.isComplete ||
        !state.trayBookIds.includes(action.bookId) ||
        state.placedBySlot[action.slotIndex] !== undefined ||
        state.roundBookIds[action.slotIndex] === undefined
      ) {
        return state;
      }

      const feedbackId = (state.feedback?.id ?? 0) + 1;
      const isCorrect = state.roundBookIds[action.slotIndex] === action.bookId;

      if (!isCorrect) {
        return {
          ...state,
          selectedBookId: null,
          hintBookId: null,
          hintSlotIndex: null,
          feedback: {
            id: feedbackId,
            kind: "incorrect",
            bookId: action.bookId,
            slotIndex: action.slotIndex,
          },
        };
      }

      const placedBySlot = { ...state.placedBySlot, [action.slotIndex]: action.bookId };
      const trayBookIds = state.trayBookIds.filter((bookId) => bookId !== action.bookId);

      return {
        ...state,
        placedBySlot,
        trayBookIds,
        selectedBookId: null,
        hintBookId: null,
        hintSlotIndex: null,
        feedback: {
          id: feedbackId,
          kind: "correct",
          bookId: action.bookId,
          slotIndex: action.slotIndex,
        },
        isComplete: Object.keys(placedBySlot).length === state.roundBookIds.length,
      };
    }

    case "show-hint": {
      if (state.isComplete) return state;
      const hintSlotIndex = state.roundBookIds.findIndex((_, slotIndex) => state.placedBySlot[slotIndex] === undefined);
      if (hintSlotIndex < 0) return state;

      return {
        ...state,
        hintBookId: state.roundBookIds[hintSlotIndex],
        hintSlotIndex,
        hintId: state.hintId + 1,
      };
    }

    case "clear-hint":
      if (action.hintId !== state.hintId) return state;
      return { ...state, hintBookId: null, hintSlotIndex: null };

    case "clear-feedback":
      if (action.feedbackId !== state.feedback?.id || state.isComplete) return state;
      return { ...state, feedback: null };

    case "reset-round":
      return createRound(
        state.language,
        state.groupId,
        state.windowIndex,
        action.random ?? Math.random,
        state.roundId + 1
      );

    case "change-group":
      return createRound(state.language, action.groupId, 0, action.random ?? Math.random, state.roundId + 1);

    case "change-language":
      return createRound(action.language, "law", 0, action.random ?? Math.random, state.roundId + 1);

    case "next-round": {
      const windows = getRoundWindows(state.language, state.groupId);
      const nextWindowIndex = windows.length === 0 ? 0 : (state.windowIndex + 1) % windows.length;
      return createRound(
        state.language,
        state.groupId,
        nextWindowIndex,
        action.random ?? Math.random,
        state.roundId + 1
      );
    }
  }
}
