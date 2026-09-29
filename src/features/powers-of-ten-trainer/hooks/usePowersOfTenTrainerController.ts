import React from "react";
import { decimalEquals } from "../lib/decimal";
import { isConfigValid, sanitizeConfig } from "../lib/config";
import { buildCombinationDeck, generateTask } from "../lib/task-generator";
import { initialTrainerState, trainerReducer } from "../model/trainer.reducer";
import {
  selectAccuracy,
  selectCanStart,
  selectIsInteractable,
  selectIsPlayInteractable,
  selectTimerActive,
  selectTotalAnswered,
} from "../model/trainer.selectors";
import type {
  ConfigUpdate,
  DecimalValue,
  DrillCombination,
  SessionConfig,
  SessionEndReason,
} from "../model/trainer.types";
import { powersOfTenAnalytics } from "../services/analytics/trainer.analytics";
import { useAccurateTimer } from "./useAccurateTimer";
import { useBeeps } from "./useBeeps";
import { usePowersOfTenCapabilities } from "./usePowersOfTenCapabilities";

export function usePowersOfTenTrainerController() {
  const [state, dispatch] = React.useReducer(trainerReducer, initialTrainerState);
  const { capabilities } = usePowersOfTenCapabilities();
  const isInteractable = selectIsInteractable(state);
  const isPlayInteractable = selectIsPlayInteractable(state);
  const timerActive = selectTimerActive(state);
  const totalAnswered = selectTotalAnswered(state);
  const accuracy = selectAccuracy(state);
  const canStart = selectCanStart(state) && capabilities.canUseCoreFeature;
  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);
  const { beep } = useBeeps(state.config.soundsEnabled);
  const deckRef = React.useRef<DrillCombination[]>([]);
  const lastCombinationRef = React.useRef<DrillCombination | null>(null);
  const setupTrackedRef = React.useRef(false);

  const takeCombination = React.useCallback((config: SessionConfig): DrillCombination => {
    if (deckRef.current.length === 0) {
      deckRef.current = buildCombinationDeck(config, lastCombinationRef.current);
    }
    const combination = deckRef.current.shift();
    if (!combination) throw new Error("A valid trainer configuration must produce at least one combination");
    lastCombinationRef.current = combination;
    return combination;
  }, []);

  const prepareFirstTask = React.useCallback(
    (config: SessionConfig) => {
      deckRef.current = [];
      lastCombinationRef.current = null;
      dispatch({ type: "taskPrepared", payload: generateTask(config, takeCombination(config), 0) });
    },
    [takeCombination]
  );

  const updateConfig = React.useCallback(
    (update: ConfigUpdate) => {
      if (!isInteractable) return;
      dispatch({ type: "configUpdated", payload: update });
    },
    [isInteractable]
  );

  const startGame = React.useCallback(() => {
    if (!canStart || !isConfigValid(state.config)) return;
    const activeConfig = sanitizeConfig(state.config);
    dispatch({ type: "configUpdated", payload: activeConfig });
    dispatch({ type: "sessionStarted" });
    resetTimer();
    prepareFirstTask(activeConfig);
    powersOfTenAnalytics.sessionStarted(activeConfig);
  }, [canStart, prepareFirstTask, resetTimer, state.config]);

  const finishGame = React.useCallback(
    (reason: SessionEndReason, answered = totalAnswered, accuracyValue = accuracy) => {
      if (!isPlayInteractable) return;
      dispatch({ type: "sessionFinished", payload: { reason } });
      powersOfTenAnalytics.sessionFinished(reason, elapsedSec, answered, accuracyValue);
      void beep(523, 140);
    },
    [accuracy, beep, elapsedSec, isPlayInteractable, totalAnswered]
  );

  const submitAnswer = React.useCallback(
    (answer: DecimalValue): boolean => {
      if (!isPlayInteractable || !state.currentTask) return false;
      const correct = decimalEquals(answer, state.currentTask.correctAnswer);
      dispatch({ type: "answerSubmitted", payload: { answer, correct } });
      powersOfTenAnalytics.answerSubmitted(correct, state.currentTask.operation, state.currentTask.power);
      void beep(correct ? 880 : 220);

      const nextTotal = totalAnswered + 1;
      const nextCorrect = state.progress.correctCount + (correct ? 1 : 0);
      const nextAccuracy = Math.round((nextCorrect / nextTotal) * 100);
      if (state.config.maxExercises > 0 && nextTotal >= state.config.maxExercises) {
        dispatch({ type: "sessionFinished", payload: { reason: "exercises" } });
        powersOfTenAnalytics.sessionFinished("exercises", elapsedSec, nextTotal, nextAccuracy);
      } else {
        dispatch({
          type: "taskPrepared",
          payload: generateTask(state.config, takeCombination(state.config), state.currentTask.taskId),
        });
      }
      return true;
    },
    [
      beep,
      elapsedSec,
      isPlayInteractable,
      state.config,
      state.currentTask,
      state.progress.correctCount,
      takeCombination,
      totalAnswered,
    ]
  );

  const newSession = React.useCallback(() => {
    if (!isInteractable || !isConfigValid(state.config)) return;
    const activeConfig = sanitizeConfig(state.config);
    dispatch({ type: "newSessionRequested" });
    resetTimer();
    prepareFirstTask(activeConfig);
    powersOfTenAnalytics.sessionStarted(activeConfig);
  }, [isInteractable, prepareFirstTask, resetTimer, state.config]);

  const backToSetup = React.useCallback(() => {
    if (!isInteractable) return;
    dispatch({ type: "returnedToSetup" });
    resetTimer();
    deckRef.current = [];
    lastCombinationRef.current = null;
  }, [isInteractable, resetTimer]);

  React.useEffect(() => powersOfTenAnalytics.viewed(), []);

  React.useEffect(() => {
    if (!setupTrackedRef.current) {
      setupTrackedRef.current = true;
      return;
    }
    powersOfTenAnalytics.setupChanged(state.config);
  }, [state.config]);

  React.useEffect(() => {
    if (!timerActive || state.config.timerMinutes <= 0 || elapsedSec < state.config.timerMinutes * 60) return;
    finishGame("time");
  }, [elapsedSec, finishGame, state.config.timerMinutes, timerActive]);

  return {
    state,
    accuracy,
    totalAnswered,
    elapsedSec,
    canStart,
    isInteractable,
    isPlayInteractable,
    capabilities,
    actions: { updateConfig, startGame, submitAnswer, finishGame, newSession, backToSetup, dispatch },
  };
}
