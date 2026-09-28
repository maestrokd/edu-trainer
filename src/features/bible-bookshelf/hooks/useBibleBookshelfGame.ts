import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";

import { BIBLE_BOOKS_BY_LANGUAGE, resolveBibleBookLanguage } from "@/features/bible-books/data/bibleBooks.registry";
import type { BibleBookLanguage, BibleTestament } from "@/features/bible-books/model/bible-books.types";

import {
  getBibleBookshelfGroup,
  getBibleBookshelfGroupForOrder,
  getBibleBookshelfGroupBooks,
  getBibleBookshelfGroups,
  getBibleBookshelfTestamentBooks,
  type BibleBookshelfGroupId,
} from "../data/learning-groups";
import {
  bibleBookshelfReducer,
  createBibleBookshelfState,
  hasBibleBookshelfProgress,
  type BibleBookshelfMode,
} from "../lib/game";

export function useBibleBookshelfGame() {
  const { i18n } = useTranslation();
  const initialLanguage = resolveBibleBookLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [state, dispatch] = useReducer(bibleBookshelfReducer, initialLanguage, createBibleBookshelfState);

  useEffect(() => {
    if (state.hintBookId === null) return;
    const hintId = state.hintId;
    const timeout = window.setTimeout(() => dispatch({ type: "clear-hint", hintId }), 3000);
    return () => window.clearTimeout(timeout);
  }, [state.hintBookId, state.hintId]);

  useEffect(() => {
    if (!state.feedback || state.isComplete) return;
    const feedbackId = state.feedback.id;
    const timeout = window.setTimeout(() => dispatch({ type: "clear-feedback", feedbackId }), 2500);
    return () => window.clearTimeout(timeout);
  }, [state.feedback, state.isComplete]);

  const booksById = useMemo(
    () => new Map(BIBLE_BOOKS_BY_LANGUAGE[state.config.bibleLanguage].map((book) => [book.id, book])),
    [state.config.bibleLanguage]
  );

  const bookGroupsById = useMemo(
    () =>
      new Map(
        BIBLE_BOOKS_BY_LANGUAGE[state.config.bibleLanguage].map((book) => [
          book.id,
          getBibleBookshelfGroupForOrder(state.config.bibleLanguage, book.order),
        ])
      ),
    [state.config.bibleLanguage]
  );

  const groups = getBibleBookshelfGroups(state.config.bibleLanguage);
  const selectedGroup = getBibleBookshelfGroup(state.config.bibleLanguage, state.config.groupId);
  const selectedGroupBooks = getBibleBookshelfGroupBooks(state.config.bibleLanguage, state.config.groupId);
  const selectedTestamentBooks = getBibleBookshelfTestamentBooks(state.config.bibleLanguage, state.config.testament);
  const roundBooks = state.roundBookIds.flatMap((bookId) => {
    const book = booksById.get(bookId);
    return book ? [book] : [];
  });
  const trayBooks = state.trayBookIds.flatMap((bookId) => {
    const book = booksById.get(bookId);
    return book ? [book] : [];
  });

  const setBibleLanguage = useCallback(
    (language: BibleBookLanguage) => dispatch({ type: "set-bible-language", language }),
    []
  );
  const setMode = useCallback((mode: BibleBookshelfMode) => dispatch({ type: "set-mode", mode }), []);
  const setGroup = useCallback((groupId: BibleBookshelfGroupId) => dispatch({ type: "set-group", groupId }), []);
  const setTestament = useCallback((testament: BibleTestament) => dispatch({ type: "set-testament", testament }), []);
  const startGame = useCallback(() => dispatch({ type: "start-game" }), []);
  const returnToSetup = useCallback(() => dispatch({ type: "return-to-setup" }), []);
  const selectBook = useCallback((bookId: string) => dispatch({ type: "select-book", bookId }), []);
  const attemptPlacement = useCallback(
    (bookId: string, slotIndex: number) => dispatch({ type: "attempt-placement", bookId, slotIndex }),
    []
  );
  const showHint = useCallback(() => dispatch({ type: "show-hint" }), []);
  const resetRound = useCallback(() => dispatch({ type: "reset-round" }), []);
  const nextRound = useCallback(() => dispatch({ type: "next-round" }), []);
  const playAgain = useCallback(() => dispatch({ type: "play-again" }), []);

  return {
    state,
    data: {
      groups,
      selectedGroup,
      selectedGroupBooks,
      selectedTestamentBooks,
      roundBooks,
      trayBooks,
      booksById,
      bookGroupsById,
      correctCount: Object.keys(state.placedBySlot).length,
      hasProgress: hasBibleBookshelfProgress(state),
    },
    actions: {
      setBibleLanguage,
      setMode,
      setGroup,
      setTestament,
      startGame,
      returnToSetup,
      selectBook,
      attemptPlacement,
      showHint,
      resetRound,
      nextRound,
      playAgain,
    },
  };
}
