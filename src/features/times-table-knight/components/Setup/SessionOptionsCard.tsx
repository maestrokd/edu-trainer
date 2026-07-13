import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { AnswerFormat, EffectsConfig } from "../../model/game.types";
import { TYPED_SUGGESTED_FROM_LEVEL } from "../../model/game.constants";

interface SessionOptionsCardProps {
  level: number;
  format: AnswerFormat;
  effects: EffectsConfig;
  onFormatChange: (format: AnswerFormat) => void;
  onEffectsChange: (effects: Partial<EffectsConfig>) => void;
  disabled?: boolean;
}

export function SessionOptionsCard({
  level,
  format,
  effects,
  onFormatChange,
  onEffectsChange,
  disabled,
}: SessionOptionsCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>{t("timesTableKnight.format.label")}</Label>
          <div role="radiogroup" aria-label={t("timesTableKnight.format.label")} className="grid grid-cols-2 gap-2">
            {(["mcq", "typed"] as AnswerFormat[]).map((f) => (
              <Button
                key={f}
                role="radio"
                aria-checked={format === f}
                variant={format === f ? "default" : "outline"}
                disabled={disabled}
                onClick={() => onFormatChange(f)}
                className="min-h-11"
              >
                {t(`timesTableKnight.format.${f}`)}
              </Button>
            ))}
          </div>
          {level >= TYPED_SUGGESTED_FROM_LEVEL && (
            <p className="text-xs text-muted-foreground">{t("timesTableKnight.format.typedHint")}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="ttk-sound">{t("timesTableKnight.effects.sound")}</Label>
            <Switch
              id="ttk-sound"
              checked={effects.sound}
              disabled={disabled}
              onCheckedChange={(v) => onEffectsChange({ sound: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ttk-haptics">{t("timesTableKnight.effects.haptics")}</Label>
            <Switch
              id="ttk-haptics"
              checked={effects.haptics}
              disabled={disabled}
              onCheckedChange={(v) => onEffectsChange({ haptics: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ttk-reduced-motion">{t("timesTableKnight.effects.reducedMotion")}</Label>
            <Switch
              id="ttk-reduced-motion"
              checked={effects.reducedMotion}
              disabled={disabled}
              onCheckedChange={(v) => onEffectsChange({ reducedMotion: v })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
