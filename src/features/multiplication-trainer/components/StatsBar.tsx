import { StatCard } from "./StatCard";
import { formatTime } from "../lib/time";

interface StatsBarProps {
  correctCount: number;
  wrongCount: number;
  accuracy: number | string;
  elapsedSec: number;
  timerLimitSec: number; // 0 if unlimited
  labels: {
    correct: string;
    wrong: string;
    accuracy: string;
    time: string;
    timeLeft: string;
  };
}

export function StatsBar({ correctCount, wrongCount, accuracy, elapsedSec, timerLimitSec, labels }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <StatCard label={labels.correct} value={correctCount} />
      <StatCard label={labels.wrong} value={wrongCount} />
      <StatCard label={labels.accuracy} value={`${accuracy}%`} />
      <StatCard label={labels.time} value={formatTime(elapsedSec)} />
      {timerLimitSec > 0 && (
        <StatCard label={labels.timeLeft} value={formatTime(Math.max(0, timerLimitSec - elapsedSec))} />
      )}
    </div>
  );
}
