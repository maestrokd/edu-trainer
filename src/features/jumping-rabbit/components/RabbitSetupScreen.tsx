import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
