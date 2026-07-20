import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_LEVEL, MIN_LEVEL } from "../../model/game.constants";

interface LevelPickerProps {
  level: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

const LEVELS = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i);

export function LevelPicker({ level, onChange, disabled }: LevelPickerProps) {
  const { t } = useTranslation();

  return (
    <div role="radiogroup" aria-label={t("timesTableKnight.setup.level")} className="grid grid-cols-5 gap-2">
      {LEVELS.map((n) => (
        <Button
          key={n}
          role="radio"
          aria-checked={level === n}
          aria-label={t("timesTableKnight.setup.levelLabel", { level: n })}
          variant={level === n ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn("min-h-11 text-lg font-semibold", level === n && "ring-2 ring-primary/40")}
        >
          ×{n}
        </Button>
      ))}
    </div>
  );
}
