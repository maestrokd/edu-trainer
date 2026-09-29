import type { Operation, Power, SessionConfig, SessionEndReason } from "../../model/trainer.types";

type EventName =
  | "powers_of_ten_trainer_viewed"
  | "powers_of_ten_trainer_setup_changed"
  | "powers_of_ten_trainer_session_started"
  | "powers_of_ten_trainer_answer_submitted"
  | "powers_of_ten_trainer_session_finished";

function trackEvent(name: EventName, payload?: unknown): void {
  void name;
  void payload;
}

export const powersOfTenAnalytics = {
  viewed: () => trackEvent("powers_of_ten_trainer_viewed"),
  setupChanged: (config: SessionConfig) => trackEvent("powers_of_ten_trainer_setup_changed", { config }),
  sessionStarted: (config: SessionConfig) => trackEvent("powers_of_ten_trainer_session_started", { config }),
  answerSubmitted: (correct: boolean, operation: Operation, power: Power) =>
    trackEvent("powers_of_ten_trainer_answer_submitted", { correct, operation, power }),
  sessionFinished: (reason: SessionEndReason, durationSeconds: number, totalAnswered: number, accuracy: number) =>
    trackEvent("powers_of_ten_trainer_session_finished", { reason, durationSeconds, totalAnswered, accuracy }),
};
