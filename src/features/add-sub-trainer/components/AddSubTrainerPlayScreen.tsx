import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAccurateTimer } from "../hooks/useAccurateTimer";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";
import { HistoryTable } from "./HistoryTable";
import { FinishedBanner } from "./FinishedBanner";

export function AddSubTrainerPlayScreen({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars);

  const { state } = controller;
  const { isPlayInteractable, accuracy } = controller;

  const timerActive = state.screen === "play" && !state.gameOver;
  const { elapsedSec } = useAccurateTimer(timerActive);

  const timerMinutes = state.config.timerMinutes;

  useEffect(() => {
    if (timerActive && timerMinutes > 0 && elapsedSec >= timerMinutes * 60) {
      controller.actions.finishGame("time");
    }
  }, [elapsedSec, timerActive, timerMinutes, controller.actions]);

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        <div className="flex flex-col min-h-0">
          <FinishedBanner state={state} tr={tr} />

          <StatsBar state={state} accuracy={accuracy} elapsedSec={elapsedSec} tr={tr} />

          {state.currentTask && !state.gameOver && (
            <TaskCard
              task={state.currentTask}
              config={state.config}
              isPlayInteractable={isPlayInteractable}
              submitAnswer={controller.actions.submitAnswer}
              gameOver={state.gameOver}
              lastWasCorrect={state.progress.lastWasCorrect}
              lastFeedback={state.progress.lastFeedback}
              tr={tr}
            />
          )}
        </div>

        <HistoryTable history={state.progress.history} tr={tr} />
      </div>
    </div>
  );
}
