import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRabbitGameEngine } from "../hooks/useRabbitGameEngine";
import type { RabbitAnswerOutcome, RabbitGameState } from "../model/rabbit.types";
import { RabbitFinishedPanel } from "./RabbitFinishedPanel";
import { RabbitQuizPanel } from "./RabbitQuizPanel";

interface RabbitPlayScreenProps {
  state: RabbitGameState;
  onScoreChange: (score: number) => void;
  onQuizRequested: () => void;
  onAnswer: (value: number) => RabbitAnswerOutcome;
  onFinished: () => void;
  onMessage: (message: string, duration?: number) => void;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

export function RabbitPlayScreen({
  state,
  onScoreChange,
  onQuizRequested,
  onAnswer,
  onFinished,
  onMessage,
  onPlayAgain,
  onChangeSettings,
}: RabbitPlayScreenProps) {
  const { t } = useTranslation();
  const engine = useRabbitGameEngine({
    runId: state.runId,
    running: state.phase === "playing",
    paused: state.menuOpen,
    askOnHit: state.config.askOnHit,
    effectsEnabled: state.config.effectsEnabled,
    onScoreChange,
    onQuizRequested,
    onFinished,
    onMessage: (message) => {
      const duration = message === "ouch" ? 1100 : 900;
      onMessage(t(`rabbitGame.messages.${message}`), duration);
    },
  });

  useEffect(() => {
    const timeout = window.setTimeout(engine.focusCanvas, 0);
    return () => window.clearTimeout(timeout);
  }, [engine.focusCanvas, state.runId]);

  const handleAnswer = (value: number) => {
    const outcome = onAnswer(value);
    engine.playQuizFeedback(outcome !== "wrong");
    if (outcome === "wrong") onMessage(t("rabbitGame.messages.tryAgain"));
    if (outcome === "complete") {
      engine.prepareAfterQuiz();
      window.setTimeout(engine.focusCanvas, 0);
    }
  };

  return (
    <main className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card shadow-lg">
      <div ref={engine.gameAreaRef} className="absolute inset-0 overflow-hidden">
        <canvas
          ref={engine.canvasRef}
          className="block h-full w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("rabbitGame.aria.canvas")}
          tabIndex={0}
        />
      </div>

      {state.message && (
        <div
          className="absolute left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-foreground/85 px-3 py-1.5 text-sm text-background shadow"
          role="status"
        >
          {state.message}
        </div>
      )}

      {state.phase === "quiz" && state.quiz && (
        <RabbitQuizPanel quiz={state.quiz} quizIndex={state.quizIndex} onAnswer={handleAnswer} />
      )}
      {state.phase === "finished" && (
        <RabbitFinishedPanel score={state.score} onPlayAgain={onPlayAgain} onChangeSettings={onChangeSettings} />
      )}
    </main>
  );
}
