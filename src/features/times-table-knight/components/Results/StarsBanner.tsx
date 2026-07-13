import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { StarCount } from "../../model/game.types";

interface StarsBannerProps {
  stars: StarCount;
}

export function StarsBanner({ stars }: StarsBannerProps) {
  const { t } = useTranslation();
  return (
    <div
      className="flex justify-center gap-2 text-4xl"
      role="img"
      aria-label={t("timesTableKnight.results.starsAria", { count: stars })}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "transition-transform",
            i < stars ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.7)] scale-110" : "opacity-30 grayscale"
          )}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
