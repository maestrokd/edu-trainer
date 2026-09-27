import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";

import { BIBLE_BOOKS_BY_LANGUAGE, resolveBibleBookLanguage } from "@/features/bible-books/data/bibleBooks.registry";

import { getBibleBookshelfGroup, getBibleBookshelfGroups, type BibleBookshelfGroupId } from "../data/learning-groups";
import { bibleBookshelfReducer, createBibleBookshelfState } from "../lib/game";

export function useBibleBookshelfGame() {
  const { i18n } = useTranslation();
  const language = resolveBibleBookLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [state, dispatch] = useReducer(bibleBookshelfReducer, language, (initialLanguage) =>
    createBibleBookshelfState(initialLanguage)
  );

  useEffect(() => {
    if (state.language !== language) {
      dispatch({ type: "change-language", language });
    }
  }, [language, state.language]);

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
    () => new Map(BIBLE_BOOKS_BY_LANGUAGE[state.language].map((book) => [book.id, book])),
    [state.language]
  );

  const groups = getBibleBookshelfGroups(state.language);
  const selectedGroup = getBibleBookshelfGroup(state.language, state.groupId);
  const roundBooks = state.roundBookIds.flatMap((bookId) => {
    const book = booksById.get(bookId);
    return book ? [book] : [];
  });
  const trayBooks = state.trayBookIds.flatMap((bookId) => {
    const book = booksById.get(bookId);
    return book ? [book] : [];
  });

  const selectBook = useCallback((bookId: string) => dispatch({ type: "select-book", bookId }), []);
  const attemptPlacement = useCallback(
    (bookId: string, slotIndex: number) => dispatch({ type: "attempt-placement", bookId, slotIndex }),
    []
  );
  const changeGroup = useCallback((groupId: BibleBookshelfGroupId) => dispatch({ type: "change-group", groupId }), []);
  const showHint = useCallback(() => dispatch({ type: "show-hint" }), []);
  const resetRound = useCallback(() => dispatch({ type: "reset-round" }), []);
  const nextRound = useCallback(() => dispatch({ type: "next-round" }), []);

  return {
    state,
    data: {
      groups,
      selectedGroup,
      roundBooks,
      trayBooks,
      booksById,
      correctCount: Object.keys(state.placedBySlot).length,
    },
    actions: {
      selectBook,
      attemptPlacement,
      changeGroup,
      showHint,
      resetRound,
      nextRound,
    },
  };
}
