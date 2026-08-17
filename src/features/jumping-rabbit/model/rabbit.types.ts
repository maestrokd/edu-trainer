export interface RabbitConfig {
  minVal: number;
  maxVal: number;
  quizCount: number;
  askOnHit: boolean;
  effectsEnabled: boolean;
}

export interface RabbitQuizQuestion {
  a: number;
  b: number;
  options: number[];
  answer?: number;
  correct?: boolean;
}

export type RabbitGamePhase = "setup" | "playing" | "quiz" | "finished";

export interface RabbitGameState {
  phase: RabbitGamePhase;
  config: RabbitConfig;
  score: number;
  quiz: RabbitQuizQuestion[] | null;
  quizIndex: number;
  message: string | null;
  menuOpen: boolean;
  runId: number;
}

export type RabbitGameAction =
  | { type: "configUpdated"; payload: Partial<RabbitConfig> }
  | { type: "runStarted" }
  | { type: "returnedToSetup" }
  | { type: "menuOpenChanged"; payload: boolean }
  | { type: "scoreChanged"; payload: number }
  | { type: "quizStarted"; payload: RabbitQuizQuestion[] }
  | { type: "answerSubmitted"; payload: { value: number; correct: boolean; isLast: boolean } }
  | { type: "gameFinished" }
  | { type: "messageChanged"; payload: string | null };

export type RabbitAnswerOutcome = "wrong" | "next" | "complete";
