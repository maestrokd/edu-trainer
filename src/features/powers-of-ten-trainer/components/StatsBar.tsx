import { useTranslation } from "react-i18next";
import { StatisticsBlock } from "@/components/ui/statistics-block";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

interface Props {
  correct: number;
  wrong: number;
  accuracy: number;
  elapsedSec: number;
  timerMinutes: number;
}

export function StatsBar({ correct, wrong, accuracy, elapsedSec, timerMinutes }: Props) {
  const { t } = useTranslation();
  const items = [
    { key: "correct", label: t("powersTenT.stats.correct"), value: correct },
    { key: "wrong", label: t("powersTenT.stats.wrong"), value: wrong },
    { key: "accuracy", label: t("powersTenT.stats.accuracy"), value: `${accuracy}%` },
    { key: "time", label: t("powersTenT.stats.time"), value: formatTime(elapsedSec) },
  ];
  if (timerMinutes > 0) {
    items.push({
      key: "timeLeft",
      label: t("powersTenT.stats.timeLeft"),
      value: formatTime(Math.max(0, timerMinutes * 60 - elapsedSec)),
    });
  }
  return <StatisticsBlock items={items} />;
}
