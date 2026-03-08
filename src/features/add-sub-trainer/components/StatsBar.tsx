import { StatCard } from "@/components/ui/stat-card";
import { formatTime } from "../lib/time";
import type { SessionState } from "../model/trainer.types";

export function StatsBar({
  state,
  accuracy,
  elapsedSec,
  tr,
}: {
  state: SessionState;
  accuracy: number;
  elapsedSec: number;
  tr: any;
}) {
  const { correctCount, wrongCount, streak, bestStreak } = state.progress;
  const timerMinutes = state.config.timerMinutes;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <StatCard label={tr("stats.correct")!} value={correctCount} />
      <StatCard label={tr("stats.wrong")!} value={wrongCount} />
      <StatCard label={tr("stats.accuracy")!} value={`${accuracy}%`} />
      <StatCard label={tr("stats.time")!} value={formatTime(elapsedSec)} />
      {timerMinutes > 0 && (
        <StatCard label={tr("stats.timeLeft")!} value={formatTime(Math.max(0, timerMinutes * 60 - elapsedSec))} />
      )}
      <StatCard label={tr("stats.streak")!} value={`${streak} / ${bestStreak}`} />
    </div>
  );
}
