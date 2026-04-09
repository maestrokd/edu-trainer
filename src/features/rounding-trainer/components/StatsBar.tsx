import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/ui/stat-card";
import { formatTime } from "../lib/time";

interface StatsBarProps {
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  elapsedSec: number;
  timerMinutes: number;
  timeLeft: number | null;
}

export function StatsBar({ correctCount, wrongCount, accuracy, elapsedSec, timerMinutes, timeLeft }: StatsBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <StatCard label={t("roundT.stats.correct")} value={correctCount} />
      <StatCard label={t("roundT.stats.wrong")} value={wrongCount} />
      <StatCard label={t("roundT.stats.accuracy")} value={`${accuracy}%`} />
      <StatCard label={t("roundT.stats.time")} value={formatTime(elapsedSec)} />
      {timerMinutes > 0 && <StatCard label={t("roundT.stats.timeLeft")} value={formatTime(timeLeft ?? 0)} />}
    </div>
  );
}
