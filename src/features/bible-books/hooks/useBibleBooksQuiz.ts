import { useCallback, useMemo, useState } from "react";

import { generateBibleBooksRound } from "../lib/quiz-generator";
import type { BibleBooksQuestion, PracticeSetId } from "../model/bible-books.types";

type GamePhase = "setup" | "playing" | "complete";

export function useBibleBooksQuiz() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<PracticeSetId>("FIRST_FIVE");
  const [questions, setQuestions] = useState<BibleBooksQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<BibleBooksQuestion[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnswered = selectedAnswerId !== null;
  const isCurrentAnswerCorrect = selectedAnswerId === currentQuestion?.correctNextBook.id;

  const startRound = useCallback(() => {
    setQuestions(generateBibleBooksRound(selectedPracticeSet));
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setCorrectAnswers(0);
    setMissedQuestions([]);
    setPhase("playing");
  }, [selectedPracticeSet]);

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
      startRound,
      selectAnswer,
      nextQuestion,
      changePracticeSet,
    },
  };
}
