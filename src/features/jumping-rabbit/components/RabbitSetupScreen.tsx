import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LabeledField } from "@/components/ui/labeled-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_FACTOR, MIN_FACTOR } from "../model/rabbit.constants";
import type { RabbitConfig } from "../model/rabbit.types";

interface RabbitSetupScreenProps {
  config: RabbitConfig;
  onConfigChange: (config: Partial<RabbitConfig>) => void;
  onStart: () => void;
}

export function RabbitSetupScreen({ config, onConfigChange, onStart }: RabbitSetupScreenProps) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-6 sm:shadow-lg sm:backdrop-blur md:p-8">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("rabbitGame.title")}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">{t("rabbitGame.setup.description")}</p>
        </div>

        <section className="space-y-5 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">{t("rabbitGame.setup.range")}</h2>
              <p className="text-xs text-muted-foreground">{t("rabbitGame.setup.rangeHint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LabeledField label={t("rabbitGame.setup.min")} htmlFor="rabbit-min-factor">
                <Select
                  value={String(config.minVal)}
                  onValueChange={(value) => onConfigChange({ minVal: Number(value) })}
                >
                  <SelectTrigger id="rabbit-min-factor" className="w-full" aria-label={t("rabbitGame.aria.minFactor")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_FACTOR - MIN_FACTOR + 1 }, (_, index) => index + MIN_FACTOR).map(
                      (factor) => (
                        <SelectItem key={factor} value={String(factor)}>
                          {factor}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </LabeledField>

              <LabeledField label={t("rabbitGame.setup.max")} htmlFor="rabbit-max-factor">
                <Select
                  value={String(config.maxVal)}
                  onValueChange={(value) => onConfigChange({ maxVal: Number(value) })}
                >
                  <SelectTrigger id="rabbit-max-factor" className="w-full" aria-label={t("rabbitGame.aria.maxFactor")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_FACTOR - MIN_FACTOR + 1 }, (_, index) => index + MIN_FACTOR).map(
                      (factor) => (
                        <SelectItem key={factor} value={String(factor)}>
                          {factor}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rabbit-quiz-count">{t("rabbitGame.setup.questions")}</Label>
            <Select
              value={String(config.quizCount)}
              onValueChange={(value) => onConfigChange({ quizCount: Number(value) })}
            >
              <SelectTrigger id="rabbit-quiz-count" className="w-full" aria-label={t("rabbitGame.aria.questions")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("rabbitGame.setup.questionsHint")}</p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="rabbit-ask-on-hit"
              checked={config.askOnHit}
              onCheckedChange={(checked) => onConfigChange({ askOnHit: checked === true })}
            />
            <Label htmlFor="rabbit-ask-on-hit" className="cursor-pointer leading-5">
              {t("rabbitGame.setup.askQuiz")}
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="rabbit-effects"
              checked={config.effectsEnabled}
              onCheckedChange={(checked) => onConfigChange({ effectsEnabled: checked === true })}
            />
            <Label htmlFor="rabbit-effects" className="cursor-pointer leading-5">
              {t("rabbitGame.setup.effects")}
            </Label>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button onClick={onStart} className="h-10 w-full sm:w-auto">
            {t("rabbitGame.setup.start")}
          </Button>
          <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
            <Link to="/" aria-label={t("rabbitGame.aria.backToMenu")}>
              {t("menu.mainMenuLabel")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
