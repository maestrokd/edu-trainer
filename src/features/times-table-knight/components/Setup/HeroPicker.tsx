import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Hero } from "../../model/game.types";

interface HeroPickerProps {
  hero: Hero;
  onChange: (hero: Hero) => void;
  disabled?: boolean;
}

const HEROES: { value: Hero; emoji: string }[] = [
  { value: "dame", emoji: "👸" },
  { value: "sir", emoji: "🤴" },
];

export function HeroPicker({ hero, onChange, disabled }: HeroPickerProps) {
  const { t } = useTranslation();

  return (
    <div role="radiogroup" aria-label={t("timesTableKnight.setup.hero")} className="grid grid-cols-2 gap-3">
      {HEROES.map(({ value, emoji }) => (
        <Card
          key={value}
          role="radio"
          aria-checked={hero === value}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onChange(value)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onChange(value);
            }
          }}
          className={cn(
            "cursor-pointer transition-colors select-none text-center",
            hero === value ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "hover:border-primary/40",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <span className="text-4xl" aria-hidden>
              {emoji}
            </span>
            <span className="font-semibold">{t(`timesTableKnight.hero.${value}`)}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
