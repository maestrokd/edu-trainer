export type Operation = "multiply" | "divide";
export type Power = 1 | 2 | 3 | 4 | 5;
export type NotationMode = "numeric" | "power" | "mixed";
export type TaskNotation = Exclude<NotationMode, "mixed">;
export type AnswerMode = "quiz" | "input";
export type MagnitudeMode = "digits" | "range";
export type NumberType = "whole" | "decimal";
export type Screen = "setup" | "play";
export type SessionEndReason = "time" | "exercises";

export interface DecimalValue {
  coefficient: number;
  scale: number;
}

export type PowerSelection = Record<Power, boolean>;

export interface SessionConfig {
  includeMultiply: boolean;
  includeDivide: boolean;
  includeWhole: boolean;
  includeDecimals: boolean;
  decimalPlaces: 1 | 2 | 3;
  magnitudeMode: MagnitudeMode;
  minDigits: number;
  maxDigits: number;
  minValue: number;
  maxValue: number;
  powers: PowerSelection;
  notationMode: NotationMode;
  answerMode: AnswerMode;
  showHint: boolean;
  soundsEnabled: boolean;
  timerMinutes: number;
  maxExercises: number;
}

export interface DrillCombination {
  operation: Operation;
  power: Power;
  notation: TaskNotation;
  numberType: NumberType;
}

export interface TaskState extends DrillCombination {
  left: DecimalValue;
  base: DecimalValue;
  correctAnswer: DecimalValue;
  options: DecimalValue[];
  taskId: number;
}

export interface HistoryItem {
  id: number;
  task: TaskState;
  answer: DecimalValue;
  correct: boolean;
}

export interface SessionProgress {
  correctCount: number;
  wrongCount: number;
  history: HistoryItem[];
  lastAnswer: DecimalValue | null;
  lastCorrect: boolean | null;
}

export interface SessionState {
  screen: Screen;
  config: SessionConfig;
  progress: SessionProgress;
  currentTask: TaskState | null;
  gameOver: boolean;
  endReason: SessionEndReason | null;
  readOnly: boolean;
}

export type ConfigUpdate = Partial<Omit<SessionConfig, "powers">> & { powers?: Partial<PowerSelection> };

export type TrainerAction =
  | { type: "configUpdated"; payload: ConfigUpdate }
  | { type: "sessionStarted" }
  | { type: "sessionFinished"; payload: { reason: SessionEndReason } }
  | { type: "newSessionRequested" }
  | { type: "returnedToSetup" }
  | { type: "taskPrepared"; payload: TaskState }
  | { type: "answerSubmitted"; payload: { answer: DecimalValue; correct: boolean } }
  | { type: "stateReplaced"; payload: SessionState };
