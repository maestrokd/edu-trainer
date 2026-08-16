import { DEFAULT_RABBIT_CONFIG, clampQuizCount } from "./rabbit.constants";
import type { RabbitGameAction, RabbitGameState } from "./rabbit.types";

export function getInitialRabbitState(): RabbitGameState {
  return {
    phase: "setup",
    config: DEFAULT_RABBIT_CONFIG,
    score: 0,
    quiz: null,
    quizIndex: 0,
    message: null,
    menuOpen: false,
    runId: 0,
  };
}

export function rabbitGameReducer(state: RabbitGameState, action: RabbitGameAction): RabbitGameState {
  switch (action.type) {
    case "configUpdated":
      if (state.phase !== "setup") return state;
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
          ...(action.payload.quizCount == null ? {} : { quizCount: clampQuizCount(action.payload.quizCount) }),
        },
      };

    case "runStarted":
      return {
        ...state,
        phase: "playing",
        score: 0,
        quiz: null,
        quizIndex: 0,
        message: null,
        menuOpen: false,
        runId: state.runId + 1,
      };

    case "returnedToSetup":
      return {
        ...getInitialRabbitState(),
        config: state.config,
        runId: state.runId,
      };

    case "menuOpenChanged":
      return { ...state, menuOpen: action.payload };

    case "scoreChanged":
      return { ...state, score: action.payload };

    case "quizStarted":
      return {
        ...state,
        phase: "quiz",
        quiz: action.payload,
        quizIndex: 0,
      };

    case "answerSubmitted": {
      if (!state.quiz || state.phase !== "quiz") return state;

      const quiz = [...state.quiz];
      quiz[state.quizIndex] = {
        ...quiz[state.quizIndex],
        answer: action.payload.value,
        correct: action.payload.correct,
      };

      if (!action.payload.correct) return { ...state, quiz };
      if (action.payload.isLast) {
        return { ...state, phase: "playing", quiz: null, quizIndex: 0, message: null };
      }

      return { ...state, quiz, quizIndex: state.quizIndex + 1 };
    }

    case "gameFinished":
      return {
        ...state,
        phase: "finished",
        quiz: null,
        quizIndex: 0,
        message: null,
        menuOpen: false,
      };

    case "messageChanged":
      return { ...state, message: action.payload };

    default:
      return state;
  }
}
