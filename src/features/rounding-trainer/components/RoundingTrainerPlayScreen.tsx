import React from "react";
import type { SessionState } from "../model/trainer.types";
import { FinishedBanner } from "./FinishedBanner";
import { HistoryTable } from "./HistoryTable";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";

interface RoundingTrainerPlayScreenProps {
  state: SessionState;
  accuracy: number;
  elapsedSec: number;
  timeLeft: number | null;
  formatNumber: (value: number) => string;
  inputValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onQuizSelect: (value: number) => void;
}

export function RoundingTrainerPlayScreen({
  state,
  accuracy,
  elapsedSec,
  timeLeft,
  formatNumber,
  inputValue,
  inputRef,
  onInputChange,
  onInputSubmit,
  onInputKeyDown,
  onQuizSelect,
}: RoundingTrainerPlayScreenProps) {
  const totalAnswered = state.progress.correctCount + state.progress.wrongCount;

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        <div className="flex flex-col min-h-0">
          {state.gameOver && <FinishedBanner endReason={state.endReason} totalAnswered={totalAnswered} />}

          <StatsBar
            correctCount={state.progress.correctCount}
            wrongCount={state.progress.wrongCount}
            accuracy={accuracy}
            elapsedSec={elapsedSec}
            timerMinutes={state.config.timerMinutes}
            timeLeft={timeLeft}
          />

          <TaskCard
            task={state.currentTask}
            mode={state.config.mode}
            showHint={state.config.showHint}
            gameOver={state.gameOver}
            inputValue={inputValue}
            lastLine={state.progress.lastLine}
            lastCorrect={state.progress.lastCorrect}
            formatNumber={formatNumber}
            inputRef={inputRef}
            onInputChange={onInputChange}
            onInputSubmit={onInputSubmit}
            onInputKeyDown={onInputKeyDown}
            onQuizSelect={onQuizSelect}
          />
        </div>

        <HistoryTable history={state.progress.history} formatNumber={formatNumber} />
      </div>
    </div>
  );
}
