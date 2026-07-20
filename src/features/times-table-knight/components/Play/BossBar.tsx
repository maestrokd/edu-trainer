import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BossBarProps {
  bossHp: number;
  bossMaxHp: number;
  emoji: string;
}

/** segmented boss health — each segment is one weapon-damage point (§14) */
export function BossBar({ bossHp, bossMaxHp, emoji }: BossBarProps) {
  const { t } = useTranslation();
  if (bossMaxHp <= 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-1"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={bossMaxHp}
      aria-valuenow={bossHp}
      aria-label={t("timesTableKnight.play.bossTime")}
    >
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: bossMaxHp }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 flex-1 rounded-sm transition-colors",
              i < bossHp ? "bg-red-500" : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}
