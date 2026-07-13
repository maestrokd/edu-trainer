import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GameMode } from "../../model/game.types";

interface ModeCardProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
  disabled?: boolean;
}

const MODES: { value: GameMode; emoji: string }[] = [
  { value: "practice", emoji: "🛡️" },
  { value: "adventure", emoji: "🏰" },
];

export function ModeCard({ mode, onChange, disabled }: ModeCardProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MODES.map(({ value, emoji }) => (
        <Card
          key={value}
          role="radio"
          aria-checked={mode === value}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onChange(value)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onChange(value);
            }
          }}
          className={cn(
            "cursor-pointer transition-colors select-none",
            mode === value ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "hover:border-primary/40",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <CardContent className="p-4 flex items-start gap-3">
            <span className="text-3xl" aria-hidden>
              {emoji}
            </span>
            <div>
              <div className="font-semibold">{t(`timesTableKnight.mode.${value}`)}</div>
              <p className="text-sm text-muted-foreground">{t(`timesTableKnight.mode.${value}Desc`)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
