import { useCallback, useEffect, useReducer, useRef } from "react";
import { generateRabbitQuiz } from "../lib/quiz-generator";
import { getInitialRabbitState, rabbitGameReducer } from "../model/rabbit.reducer";
import type { RabbitAnswerOutcome, RabbitConfig } from "../model/rabbit.types";

export function useRabbitGameController() {
  const [state, dispatch] = useReducer(rabbitGameReducer, undefined, getInitialRabbitState);
  const messageTimeoutRef = useRef<number | null>(null);

  const clearMessageTimeout = useCallback(() => {
    if (messageTimeoutRef.current != null) {
      window.clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearMessageTimeout, [clearMessageTimeout]);

  const showMessage = useCallback(
    (message: string, duration = 900) => {
      clearMessageTimeout();
      dispatch({ type: "messageChanged", payload: message });
      messageTimeoutRef.current = window.setTimeout(() => {
        dispatch({ type: "messageChanged", payload: null });
        messageTimeoutRef.current = null;
      }, duration);
    },
    [clearMessageTimeout]
  );

  const updateConfig = useCallback((payload: Partial<RabbitConfig>) => {
    dispatch({ type: "configUpdated", payload });
  }, []);

  const startRun = useCallback(() => {
    clearMessageTimeout();
    dispatch({ type: "runStarted" });
  }, [clearMessageTimeout]);

  const returnToSetup = useCallback(() => {
    clearMessageTimeout();
    dispatch({ type: "returnedToSetup" });
  }, [clearMessageTimeout]);

  const setMenuOpen = useCallback((open: boolean) => {
    dispatch({ type: "menuOpenChanged", payload: open });
  }, []);

  const startQuiz = useCallback(() => {
    dispatch({
      type: "quizStarted",
      payload: generateRabbitQuiz({
        count: state.config.quizCount,
        minVal: state.config.minVal,
        maxVal: state.config.maxVal,
      }),
    });
  }, [state.config.maxVal, state.config.minVal, state.config.quizCount]);

  const submitAnswer = useCallback(
    (value: number): RabbitAnswerOutcome => {
      const quiz = state.quiz;
      const question = quiz?.[state.quizIndex];
      if (!question) return "wrong";

      const correct = value === question.a * question.b;
      const isLast = correct && state.quizIndex === quiz.length - 1;
      dispatch({ type: "answerSubmitted", payload: { value, correct, isLast } });

      if (!correct) return "wrong";
      return isLast ? "complete" : "next";
    },
    [state.quiz, state.quizIndex]
  );

  const setScore = useCallback((score: number) => {
    dispatch({ type: "scoreChanged", payload: score });
  }, []);

  const finishRun = useCallback(() => {
    clearMessageTimeout();
    dispatch({ type: "gameFinished" });
  }, [clearMessageTimeout]);

  return {
    state,
    actions: {
      updateConfig,
      startRun,
      restartRun: startRun,
      returnToSetup,
      setMenuOpen,
      startQuiz,
      submitAnswer,
      setScore,
      showMessage,
      finishRun,
    },
  };
}
