import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { SessionState } from "../../model/game.types";
import { ARMORS, HEARTS_START, WEAPONS } from "../../model/game.constants";
import { streakMultiplier } from "../../lib/scoring";

const WEAPON_EMOJI = ["🗡️", "⚔️", "🏹", "✨"] as const;

interface HudProps {
  state: SessionState;
}

/** session/HUD state lives in the reducer — updates arrive per event, never per frame */
export function Hud({ state }: HudProps) {
  const { t } = useTranslation();
  const isAdventure = state.config.mode === "adventure";
  const weapon = WEAPONS[state.weapon];
  const armor = ARMORS[state.armor];
  const multiplier = streakMultiplier(state.streak);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:text-base px-1" aria-live="off">
      <span aria-label={t("timesTableKnight.hud.hearts")} title={t("timesTableKnight.hud.hearts")}>
        {Array.from({ length: HEARTS_START }, (_, i) => (i < state.hearts ? "❤️" : "🖤")).join("")}
      </span>

      {isAdventure && (
        <>
          <span
            className="inline-flex items-center gap-1"
            aria-label={`${t("timesTableKnight.hud.weapon")}: ${t(`timesTableKnight.weapon.${weapon.key}`)}`}
            title={t(`timesTableKnight.weapon.${weapon.key}`)}
          >
            {WEAPON_EMOJI[state.weapon]}
            <span className="text-muted-foreground text-xs">{t(`timesTableKnight.weapon.${weapon.key}`)}</span>
          </span>
          <span
            className="inline-flex items-center gap-1"
            aria-label={`${t("timesTableKnight.hud.armor")}: ${t(`timesTableKnight.armor.${armor.key}`)}`}
            title={t(`timesTableKnight.armor.${armor.key}`)}
          >
            🛡️
            <span className="text-muted-foreground text-xs">{t(`timesTableKnight.armor.${armor.key}`)}</span>
            {armor.absorbs > 0 && (
              <span className="flex gap-0.5" aria-hidden>
                {Array.from({ length: armor.absorbs }, (_, i) => (
                  <span
                    key={i}
                    className={cn("size-1.5 rounded-full", i < state.armorAbsorbLeft ? "bg-sky-500" : "bg-muted-foreground/30")}
                  />
                ))}
              </span>
            )}
          </span>
        </>
      )}

      <span aria-label={t("timesTableKnight.hud.coins")} title={t("timesTableKnight.hud.coins")}>
        🪙 {state.coins}
      </span>

      <span aria-label={t("timesTableKnight.hud.score")} title={t("timesTableKnight.hud.score")} className="tabular-nums">
        ⭐ {state.score}
      </span>

      {state.streak >= 3 && (
        <span aria-label={t("timesTableKnight.hud.streak")} title={t("timesTableKnight.hud.streak")}>
          🔥 {state.streak} <span className="text-xs text-muted-foreground">×{multiplier}</span>
        </span>
      )}

      <span className="ml-auto text-muted-foreground text-xs sm:text-sm">
        {t("timesTableKnight.hud.level", { level: state.config.level })}
      </span>
    </div>
  );
}
