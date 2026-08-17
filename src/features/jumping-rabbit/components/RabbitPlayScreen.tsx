import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRabbitGameEngine } from "../hooks/useRabbitGameEngine";
import type { RabbitAnswerOutcome, RabbitGameState } from "../model/rabbit.types";
import { RabbitFinishedPanel } from "./RabbitFinishedPanel";
import { RabbitQuizPanel } from "./RabbitQuizPanel";
import { RabbitSettingsMenu } from "./RabbitSettingsMenu";

interface RabbitPlayScreenProps {
  state: RabbitGameState;
  onScoreChange: (score: number) => void;
  onQuizRequested: () => void;
  onAnswer: (value: number) => RabbitAnswerOutcome;
  onFinished: () => void;
  onMessage: (message: string, duration?: number) => void;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  onMenuOpenChange: (open: boolean) => void;
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
  onMenuOpenChange,
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
    <main className="fixed inset-0 z-40 h-dvh w-screen overflow-hidden overscroll-none bg-card">
      <div ref={engine.gameAreaRef} className="absolute inset-0 overflow-hidden">
        <canvas
          ref={engine.canvasRef}
          className="block h-full w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("rabbitGame.aria.canvas")}
          tabIndex={0}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-2"
        style={{
          paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
          paddingRight: "max(0.5rem, env(safe-area-inset-right))",
        }}
      >
        <div className="rounded-xl border bg-background/85 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur">
          {t("rabbitGame.score", { score: state.score })}
        </div>
        <div className="pointer-events-auto">
          <RabbitSettingsMenu
            phase={state.phase}
            open={state.menuOpen}
            onOpenChange={onMenuOpenChange}
            onRestart={onPlayAgain}
            onChangeSettings={onChangeSettings}
          />
        </div>
      </div>

      {state.message && (
        <div
          className="absolute left-1/2 top-2 z-30 max-w-[calc(100%_-_9rem)] -translate-x-1/2 rounded-full bg-foreground/85 px-3 py-1.5 text-center text-sm text-background shadow"
          style={{ marginTop: "env(safe-area-inset-top)" }}
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
