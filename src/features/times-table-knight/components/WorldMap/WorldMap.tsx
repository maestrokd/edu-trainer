import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { StageProgress } from "../../model/game.types";
import { MAX_LEVEL, MIN_LEVEL } from "../../model/game.constants";
import { bossEmoji } from "../../game/spawner";

interface WorldMapProps {
  stages: Record<number, StageProgress>;
  selectedLevel: number;
  onSelect: (level: number) => void;
  gameCompleted: boolean;
  disabled?: boolean;
}

/** Adventure stage select: defeat a boss to unlock the next castle (§3) */
export function WorldMap({ stages, selectedLevel, onSelect, gameCompleted, disabled }: WorldMapProps) {
  const { t } = useTranslation();
  const levels = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i);

  return (
    <div className="space-y-2">
      {gameCompleted && (
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          👑 {t("timesTableKnight.worldMap.completed")}
        </p>
      )}
      <div role="radiogroup" aria-label={t("timesTableKnight.worldMap.title")} className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {levels.map((level) => {
          const stage = stages[level] ?? { level, unlocked: false, stars: 0, bestScore: 0 };
          const selected = selectedLevel === level && stage.unlocked;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled || !stage.unlocked}
              onClick={() => onSelect(level)}
              title={stage.unlocked ? t("timesTableKnight.worldMap.stage", { level }) : t("timesTableKnight.worldMap.lockedHint")}
              aria-label={
                stage.unlocked
                  ? `${t("timesTableKnight.worldMap.stage", { level })}, ${t("timesTableKnight.worldMap.starsAria", { count: stage.stars })}`
                  : `${t("timesTableKnight.worldMap.stage", { level })} — ${t("timesTableKnight.worldMap.locked")}`
              }
              className={cn(
                "min-h-16 rounded-xl border p-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors",
                stage.unlocked ? "hover:border-primary/50 cursor-pointer" : "opacity-45 cursor-not-allowed bg-muted/40",
                selected && "border-primary ring-2 ring-primary/40 bg-primary/5"
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {stage.unlocked ? bossEmoji(level) : "🔒"}
              </span>
              <span className="text-xs font-semibold">×{level}</span>
              <span className="text-[10px] tracking-tighter" aria-hidden>
                {stage.unlocked
                  ? [0, 1, 2].map((i) => (i < stage.stars ? "★" : "☆")).join("")
                  : " "}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
