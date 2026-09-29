import { isConfigValid } from "../lib/config";
import type { SessionState } from "./trainer.types";

export const selectTotalAnswered = (state: SessionState) => state.progress.correctCount + state.progress.wrongCount;

export function selectAccuracy(state: SessionState): number {
  const total = selectTotalAnswered(state);
  return total === 0 ? 0 : Math.round((state.progress.correctCount / total) * 100);
}

export const selectIsInteractable = (state: SessionState) => !state.readOnly;
export const selectIsPlayInteractable = (state: SessionState) =>
  !state.readOnly && state.screen === "play" && !state.gameOver;
export const selectTimerActive = (state: SessionState) => state.screen === "play" && !state.gameOver && !state.readOnly;
export const selectCanStart = (state: SessionState) => !state.readOnly && isConfigValid(state.config);
