import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GameConfig } from "../../model/game.types";
import { ModeCard } from "./ModeCard";
import { LevelPicker } from "./LevelPicker";
import { HeroPicker } from "./HeroPicker";
import { SessionOptionsCard } from "./SessionOptionsCard";

interface SetupScreenProps {
  config: GameConfig;
  onConfigChange: (patch: Partial<GameConfig>) => void;
  onStart: () => void;
  /** Adventure picks its stage on the world map instead of the level grid */
  worldMapSlot?: React.ReactNode;
  disabled?: boolean;
}

export function SetupScreen({ config, onConfigChange, onStart, worldMapSlot, disabled }: SetupScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-8">
      <section className="space-y-2">
        <Label className="text-base">{t("timesTableKnight.setup.mode")}</Label>
        <ModeCard mode={config.mode} onChange={(mode) => onConfigChange({ mode })} disabled={disabled} />
      </section>

      {config.mode === "practice" ? (
        <section className="space-y-2">
          <Label className="text-base">{t("timesTableKnight.setup.level")}</Label>
          <LevelPicker level={config.level} onChange={(level) => onConfigChange({ level })} disabled={disabled} />
        </section>
      ) : (
        <section className="space-y-2">
          <Label className="text-base">{t("timesTableKnight.worldMap.title")}</Label>
          {worldMapSlot}
        </section>
      )}

      <section className="space-y-2">
        <Label className="text-base">{t("timesTableKnight.setup.hero")}</Label>
        <HeroPicker hero={config.hero} onChange={(hero) => onConfigChange({ hero })} disabled={disabled} />
      </section>

      <section className="space-y-2">
        <Label className="text-base">{t("timesTableKnight.setup.options")}</Label>
        <SessionOptionsCard
          level={config.level}
          format={config.format}
          effects={config.effects}
          onFormatChange={(format) => onConfigChange({ format })}
          onEffectsChange={(patch) => onConfigChange({ effects: { ...config.effects, ...patch } })}
          disabled={disabled}
        />
      </section>

      <Button onClick={onStart} disabled={disabled} className="w-full min-h-12 text-lg font-semibold">
        ⚔️ {t("timesTableKnight.setup.start")}
      </Button>
    </div>
  );
}
