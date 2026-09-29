import { DEFAULT_CONFIG, MAX_HISTORY_ITEMS } from "./trainer.constants";
import type { SessionProgress, SessionState, TrainerAction } from "./trainer.types";

const emptyProgress = (): SessionProgress => ({
  correctCount: 0,
  wrongCount: 0,
  history: [],
  lastAnswer: null,
  lastCorrect: null,
});

export const initialTrainerState: SessionState = {
  screen: "setup",
  config: DEFAULT_CONFIG,
  progress: emptyProgress(),
  currentTask: null,
  gameOver: false,
  endReason: null,
  readOnly: false,
};

export function trainerReducer(state: SessionState, action: TrainerAction): SessionState {
  if (state.readOnly && action.type !== "stateReplaced") return state;

  switch (action.type) {
    case "configUpdated":
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
          powers: action.payload.powers ? { ...state.config.powers, ...action.payload.powers } : state.config.powers,
        },
      };
    case "sessionStarted":
      return {
        ...state,
        screen: "play",
        progress: emptyProgress(),
        currentTask: null,
        gameOver: false,
        endReason: null,
      };
    case "taskPrepared":
      return { ...state, currentTask: action.payload };
    case "answerSubmitted": {
      if (!state.currentTask || state.gameOver) return state;
      const item = {
        id: state.currentTask.taskId,
        task: state.currentTask,
        answer: action.payload.answer,
        correct: action.payload.correct,
      };
      return {
        ...state,
        progress: {
          correctCount: state.progress.correctCount + (action.payload.correct ? 1 : 0),
          wrongCount: state.progress.wrongCount + (action.payload.correct ? 0 : 1),
          history: [item, ...state.progress.history].slice(0, MAX_HISTORY_ITEMS),
          lastAnswer: action.payload.answer,
          lastCorrect: action.payload.correct,
        },
      };
    }
    case "sessionFinished":
      return { ...state, gameOver: true, endReason: action.payload.reason };
    case "newSessionRequested":
      return { ...state, progress: emptyProgress(), currentTask: null, gameOver: false, endReason: null };
    case "returnedToSetup":
      return {
        ...state,
        screen: "setup",
        progress: emptyProgress(),
        currentTask: null,
        gameOver: false,
        endReason: null,
      };
    case "stateReplaced":
      return action.payload;
    default:
      return state;
  }
}
