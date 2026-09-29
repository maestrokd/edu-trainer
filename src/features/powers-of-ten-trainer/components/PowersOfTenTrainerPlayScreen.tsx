import type { RefObject } from "react";
import { TrainerPlayLayout } from "@/components/ui/trainer-play-layout";
import type { DecimalValue, SessionState } from "../model/trainer.types";
import { FinishedBanner } from "./FinishedBanner";
import { HistoryTable } from "./HistoryTable";
import { StatsBar } from "./StatsBar";
import { TaskCard } from "./TaskCard";

interface Props {
  state: SessionState;
  accuracy: number;
  totalAnswered: number;
  elapsedSec: number;
  showHistory: boolean;
  inputValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  formatValue: (value: DecimalValue, preserveScale?: boolean) => string;
  formatInteger: (value: number) => string;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onAnswer: (value: DecimalValue) => void;
}

export function PowersOfTenTrainerPlayScreen({
  state,
  accuracy,
  totalAnswered,
  elapsedSec,
  showHistory,
  inputValue,
  inputRef,
  formatValue,
  formatInteger,
  onInputChange,
  onInputSubmit,
  onAnswer,
}: Props) {
  return (
    <TrainerPlayLayout
      showHistory={showHistory}
      banner={<FinishedBanner reason={state.endReason} total={totalAnswered} />}
      stats={
        <StatsBar
          correct={state.progress.correctCount}
          wrong={state.progress.wrongCount}
          accuracy={accuracy}
          elapsedSec={elapsedSec}
          timerMinutes={state.config.timerMinutes}
        />
      }
      main={
        !state.gameOver && state.currentTask ? (
          <TaskCard
            task={state.currentTask}
            answerMode={state.config.answerMode}
            showHint={state.config.showHint}
            disabled={state.readOnly || state.gameOver}
            inputValue={inputValue}
            inputRef={inputRef}
            lastAnswer={state.progress.lastAnswer}
            lastCorrect={state.progress.lastCorrect}
            formatValue={formatValue}
            formatInteger={formatInteger}
            onInputChange={onInputChange}
            onInputSubmit={onInputSubmit}
            onAnswer={onAnswer}
          />
        ) : null
      }
      history={
        <HistoryTable history={state.progress.history} formatValue={formatValue} formatInteger={formatInteger} />
      }
    />
  );
}
