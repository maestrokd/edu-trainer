import type { BibleBookLanguage, BibleTestament } from "@/features/bible-books/model/bible-books.types";

import {
  getBibleBookshelfGroupBooks,
  getBibleBookshelfTestamentBooks,
  type BibleBookshelfGroupId,
} from "../data/learning-groups";

export const BIBLE_BOOKSHELF_ROUND_SIZE = 5;

export type BibleBookshelfPhase = "setup" | "playing";
export type BibleBookshelfMode = "groups" | "testament";

export interface BibleBookshelfConfig {
  bibleLanguage: BibleBookLanguage;
  mode: BibleBookshelfMode;
  groupId: BibleBookshelfGroupId;
  testament: BibleTestament;
}

export interface PlacementFeedback {
  id: number;
  kind: "correct" | "incorrect";
  bookId: string;
  slotIndex: number;
}

export interface BibleBookshelfState {
  phase: BibleBookshelfPhase;
  config: BibleBookshelfConfig;
  windowIndex: number;
  roundBookIds: string[];
  trayBookIds: string[];
  placedBySlot: Record<number, string>;
  selectedBookId: string | null;
  hintBookId: string | null;
  hintSlotIndex: number | null;
  hintId: number;
  feedback: PlacementFeedback | null;
  feedbackSequence: number;
  isComplete: boolean;
  roundId: number;
}

export type BibleBookshelfAction =
  | { type: "set-bible-language"; language: BibleBookLanguage }
  | { type: "set-mode"; mode: BibleBookshelfMode }
  | { type: "set-group"; groupId: BibleBookshelfGroupId }
  | { type: "set-testament"; testament: BibleTestament }
  | { type: "start-game"; random?: () => number }
  | { type: "return-to-setup" }
  | { type: "select-book"; bookId: string }
  | { type: "attempt-placement"; bookId: string; slotIndex: number }
  | { type: "show-hint" }
  | { type: "clear-hint"; hintId: number }
  | { type: "clear-feedback"; feedbackId: number }
  | { type: "reset-round"; random?: () => number }
  | { type: "next-round"; random?: () => number }
  | { type: "play-again"; random?: () => number };

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

export function getInitialLockedCount(state: BibleBookshelfState): number {
  return state.config.mode === "groups" && state.roundBookIds.length > 0 ? 1 : 0;
}

export function hasBibleBookshelfProgress(state: BibleBookshelfState): boolean {
  return Object.keys(state.placedBySlot).length > getInitialLockedCount(state);
}

function emptyPlayState(config: BibleBookshelfConfig, roundId: number): BibleBookshelfState {
  return {
    phase: "setup",
    config,
    windowIndex: 0,
    roundBookIds: [],
    trayBookIds: [],
    placedBySlot: {},
    selectedBookId: null,
    hintBookId: null,
    hintSlotIndex: null,
    hintId: 0,
    feedback: null,
    feedbackSequence: 0,
    isComplete: false,
    roundId,
  };
}

function createPlayRound(
  config: BibleBookshelfConfig,
  windowIndex: number,
  random: () => number,
  roundId: number
): BibleBookshelfState {
  const isGroupMode = config.mode === "groups";
  const windows = isGroupMode ? getRoundWindows(config.bibleLanguage, config.groupId) : [];
  const normalizedWindowIndex = isGroupMode && windows.length > 0 ? windowIndex % windows.length : 0;
  const roundBookIds = isGroupMode
    ? (windows[normalizedWindowIndex] ?? [])
    : getBibleBookshelfTestamentBooks(config.bibleLanguage, config.testament).map((book) => book.id);
  const anchorBookId = isGroupMode ? roundBookIds[0] : undefined;

  return {
    phase: "playing",
    config,
    windowIndex: normalizedWindowIndex,
    roundBookIds,
    trayBookIds: shuffle(isGroupMode ? roundBookIds.slice(1) : roundBookIds, random),
    placedBySlot: anchorBookId ? { 0: anchorBookId } : {},
    selectedBookId: null,
    hintBookId: null,
    hintSlotIndex: null,
    hintId: 0,
    feedback: null,
    feedbackSequence: 0,
    isComplete: false,
    roundId,
  };
}

export function createBibleBookshelfState(language: BibleBookLanguage): BibleBookshelfState {
  return emptyPlayState(
    {
      bibleLanguage: language,
      mode: "groups",
      groupId: "law",
      testament: "OLD",
    },
    0
  );
}

function roundIsComplete(placedBySlot: Record<number, string>, roundBookIds: readonly string[]): boolean {
  return roundBookIds.length > 0 && Object.keys(placedBySlot).length === roundBookIds.length;
}

export function bibleBookshelfReducer(state: BibleBookshelfState, action: BibleBookshelfAction): BibleBookshelfState {
  switch (action.type) {
    case "set-bible-language":
      if (state.phase !== "setup") return state;
      return emptyPlayState({ ...state.config, bibleLanguage: action.language, groupId: "law" }, state.roundId);

    case "set-mode":
      if (state.phase !== "setup") return state;
      return { ...state, config: { ...state.config, mode: action.mode } };

    case "set-group":
      if (state.phase !== "setup") return state;
      return { ...state, config: { ...state.config, groupId: action.groupId } };

    case "set-testament":
      if (state.phase !== "setup") return state;
      return { ...state, config: { ...state.config, testament: action.testament } };

    case "start-game":
      if (state.phase !== "setup") return state;
      return createPlayRound(state.config, 0, action.random ?? Math.random, state.roundId + 1);

    case "return-to-setup":
      return emptyPlayState(state.config, state.roundId + 1);

    case "select-book":
      if (state.phase !== "playing" || !state.trayBookIds.includes(action.bookId) || state.isComplete) return state;
      return {
        ...state,
        selectedBookId: state.selectedBookId === action.bookId ? null : action.bookId,
      };

    case "attempt-placement": {
      if (
        state.phase !== "playing" ||
        state.isComplete ||
        !state.trayBookIds.includes(action.bookId) ||
        state.placedBySlot[action.slotIndex] !== undefined ||
        state.roundBookIds[action.slotIndex] === undefined
      ) {
        return state;
      }

      const feedbackId = state.feedbackSequence + 1;
      const isCorrect = state.roundBookIds[action.slotIndex] === action.bookId;

      if (!isCorrect) {
        return {
          ...state,
          selectedBookId: null,
          hintBookId: null,
          hintSlotIndex: null,
          feedbackSequence: feedbackId,
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
        feedbackSequence: feedbackId,
        feedback: {
          id: feedbackId,
          kind: "correct",
          bookId: action.bookId,
          slotIndex: action.slotIndex,
        },
        isComplete: roundIsComplete(placedBySlot, state.roundBookIds),
      };
    }

    case "show-hint": {
      if (state.phase !== "playing" || state.isComplete) return state;
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
      if (state.phase !== "playing") return state;
      return createPlayRound(state.config, state.windowIndex, action.random ?? Math.random, state.roundId + 1);

    case "next-round": {
      if (state.phase !== "playing" || state.config.mode !== "groups") return state;
      const windows = getRoundWindows(state.config.bibleLanguage, state.config.groupId);
      const nextWindowIndex = windows.length === 0 ? 0 : (state.windowIndex + 1) % windows.length;
      return createPlayRound(state.config, nextWindowIndex, action.random ?? Math.random, state.roundId + 1);
    }

    case "play-again":
      if (state.phase !== "playing" || state.config.mode !== "testament") return state;
      return createPlayRound(state.config, 0, action.random ?? Math.random, state.roundId + 1);
  }
}
