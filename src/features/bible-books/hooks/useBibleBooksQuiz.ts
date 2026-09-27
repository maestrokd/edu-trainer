import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { resolveBibleBookLanguage } from "../data/bibleBooks.registry";
import { generateBibleBooksRound } from "../lib/quiz-generator";
import type { BibleBookLanguage, BibleBooksQuestion, PracticeSetId } from "../model/bible-books.types";

type GamePhase = "setup" | "playing" | "complete";

export function useBibleBooksQuiz() {
  const { i18n } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<PracticeSetId>("FIRST_FIVE");
  const [selectedBibleLanguage, setSelectedBibleLanguage] = useState<BibleBookLanguage>(() =>
    resolveBibleBookLanguage(i18n.resolvedLanguage ?? i18n.language)
  );
  const [questions, setQuestions] = useState<BibleBooksQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<BibleBooksQuestion[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnswered = selectedAnswerId !== null;
  const isCurrentAnswerCorrect = selectedAnswerId === currentQuestion?.correctNextBook.id;

  const startRound = useCallback(() => {
    setQuestions(generateBibleBooksRound(selectedPracticeSet, selectedBibleLanguage));
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setCorrectAnswers(0);
    setMissedQuestions([]);
    setPhase("playing");
  }, [selectedBibleLanguage, selectedPracticeSet]);

  const selectAnswer = useCallback(
    (answerId: string) => {
      if (!currentQuestion || selectedAnswerId !== null) return;

      setSelectedAnswerId(answerId);
      if (answerId === currentQuestion.correctNextBook.id) {
        setCorrectAnswers((score) => score + 1);
      } else {
        setMissedQuestions((missed) => [...missed, currentQuestion]);
      }
    },
    [currentQuestion, selectedAnswerId]
  );

  const nextQuestion = useCallback(() => {
    if (!hasAnswered) return;

    if (currentQuestionIndex === questions.length - 1) {
      setPhase("complete");
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
    setSelectedAnswerId(null);
  }, [currentQuestionIndex, hasAnswered, questions.length]);

  const changePracticeSet = useCallback(() => {
    setPhase("setup");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
  }, []);

  const answeredQuestions = useMemo(
    () => currentQuestionIndex + (hasAnswered ? 1 : 0),
    [currentQuestionIndex, hasAnswered]
  );

  return {
    state: {
      phase,
      selectedPracticeSet,
      selectedBibleLanguage,
      questions,
      currentQuestion,
      currentQuestionIndex,
      selectedAnswerId,
      hasAnswered,
      isCurrentAnswerCorrect,
      correctAnswers,
      answeredQuestions,
      missedQuestions,
    },
    actions: {
      setSelectedPracticeSet,
      setSelectedBibleLanguage,
      startRound,
      selectAnswer,
      nextQuestion,
      changePracticeSet,
    },
  };
}
