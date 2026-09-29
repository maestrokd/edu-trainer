import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetupHint } from "@/components/ui/setup-hint";
import { SetupToggleRow } from "@/components/ui/setup-toggle-row";
import { ALL_POWERS, DIGIT_CHOICES, MAX_SAFE_BASE_VALUE } from "../model/trainer.constants";
import { isMagnitudeValid } from "../lib/config";
import type { AnswerMode, ConfigUpdate, MagnitudeMode, NotationMode, SessionConfig } from "../model/trainer.types";

interface Props {
  config: SessionConfig;
  canStart: boolean;
  onConfigChange: (update: ConfigUpdate) => void;
  onStart: () => void;
}

export function PowersOfTenTrainerSetupScreen({ config, canStart, onConfigChange, onStart }: Props) {
  const { t, i18n } = useTranslation();
  const operationsValid = config.includeMultiply || config.includeDivide;
  const numberTypesValid = config.includeWhole || config.includeDecimals;
  const powersValid = ALL_POWERS.some((power) => config.powers[power]);
  const magnitudeValid = isMagnitudeValid(config);
  const moreInfo = (field: string) => t("powersTenT.aria.moreInfo", { field });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-5 sm:shadow-lg sm:backdrop-blur md:p-8">
      <p className="hidden text-sm text-muted-foreground sm:block">{t("powersTenT.setup.intro")}</p>

      <div className="grid gap-4 sm:mt-5 md:grid-cols-2 md:gap-0">
        <section
          className="grid content-start gap-3 sm:gap-4 md:pr-6"
          aria-label={t("powersTenT.setup.operationsAndPowers")}
        >
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">{t("powersTenT.setup.operations")}:</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="powers-ten-multiply"
                  checked={config.includeMultiply}
                  onCheckedChange={(value) => onConfigChange({ includeMultiply: Boolean(value) })}
                />
                {t("powersTenT.operations.multiply")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="powers-ten-divide"
                  checked={config.includeDivide}
                  onCheckedChange={(value) => onConfigChange({ includeDivide: Boolean(value) })}
                />
                {t("powersTenT.operations.divide")}
              </label>
            </div>
            {!operationsValid && <p className="text-xs text-destructive">{t("powersTenT.setup.operationRequired")}</p>}
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="flex items-center gap-1 text-sm font-medium">
              {t("powersTenT.setup.powers")}:
              <SetupHint ariaLabel={moreInfo(t("powersTenT.setup.powers"))}>
                {t("powersTenT.setup.powersHint")}
              </SetupHint>
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ALL_POWERS.map((power) => (
                <label key={power} className="flex min-h-7 items-center gap-2 text-sm">
                  <Checkbox
                    id={`power-${power}`}
                    checked={config.powers[power]}
                    onCheckedChange={(value) => onConfigChange({ powers: { [power]: Boolean(value) } })}
                    aria-label={t("powersTenT.aria.power", { power })}
                  />
                  <span>
                    10<sup>{power}</sup> ({new Intl.NumberFormat(i18n.language).format(10 ** power)})
                  </span>
                </label>
              ))}
            </div>
            {!powersValid && <p className="text-xs text-destructive">{t("powersTenT.setup.powerRequired")}</p>}
          </fieldset>
        </section>

        <section
          className="grid content-start gap-3 border-t pt-4 sm:gap-4 md:border-t-0 md:border-l md:pt-0 md:pl-6"
          aria-label={t("powersTenT.setup.operands")}
        >
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">{t("powersTenT.setup.numberTypes")}:</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="number-whole"
                  checked={config.includeWhole}
                  onCheckedChange={(value) => onConfigChange({ includeWhole: Boolean(value) })}
                />
                {t("powersTenT.setup.whole")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="number-decimal"
                  checked={config.includeDecimals}
                  onCheckedChange={(value) => onConfigChange({ includeDecimals: Boolean(value) })}
                />
                {t("powersTenT.setup.decimals")}
              </label>
            </div>
            {!numberTypesValid && (
              <p className="text-xs text-destructive">{t("powersTenT.setup.numberTypeRequired")}</p>
            )}
          </fieldset>

          <LabeledField label={t("powersTenT.setup.decimalPlaces")} htmlFor="decimal-places">
            <Select
              value={String(config.decimalPlaces)}
              disabled={!config.includeDecimals}
              onValueChange={(value) => onConfigChange({ decimalPlaces: Number(value) as 1 | 2 | 3 })}
            >
              <SelectTrigger id="decimal-places" className="h-9 w-full rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>

          <div className="grid gap-2">
            <div className="text-sm font-medium">{t("powersTenT.setup.magnitude")}:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={config.magnitudeMode === "digits" ? "default" : "outline"}
                className="h-9"
                onClick={() => onConfigChange({ magnitudeMode: "digits" as MagnitudeMode })}
              >
                {t("powersTenT.setup.digitsMode")}
              </Button>
              <Button
                type="button"
                variant={config.magnitudeMode === "range" ? "default" : "outline"}
                className="h-9"
                onClick={() => onConfigChange({ magnitudeMode: "range" as MagnitudeMode })}
              >
                {t("powersTenT.setup.rangeMode")}
              </Button>
            </div>
          </div>

          {config.magnitudeMode === "digits" ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {(["minDigits", "maxDigits"] as const).map((field) => (
                <LabeledField key={field} label={t(`powersTenT.setup.${field}`)} htmlFor={field}>
                  <Select
                    value={String(config[field])}
                    onValueChange={(value) => onConfigChange({ [field]: Number(value) })}
                  >
                    <SelectTrigger id={field} className="h-9 w-full rounded-xl sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGIT_CHOICES.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </LabeledField>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <LabeledField label={t("powersTenT.setup.minValue")} htmlFor="powers-min-value">
                <NumericInput
                  id="powers-min-value"
                  value={config.minValue}
                  min={0.001}
                  max={MAX_SAFE_BASE_VALUE}
                  allowDecimal
                  fallbackValue={1}
                  onChange={(minValue) => onConfigChange({ minValue })}
                />
              </LabeledField>
              <LabeledField label={t("powersTenT.setup.maxValue")} htmlFor="powers-max-value">
                <NumericInput
                  id="powers-max-value"
                  value={config.maxValue}
                  min={0.001}
                  max={MAX_SAFE_BASE_VALUE}
                  allowDecimal
                  fallbackValue={999}
                  onChange={(maxValue) => onConfigChange({ maxValue })}
                />
              </LabeledField>
            </div>
          )}
          {!magnitudeValid && <p className="text-xs text-destructive">{t("powersTenT.setup.rangeInvalid")}</p>}
        </section>

        <section
          className="grid content-start gap-3 border-t pt-4 sm:gap-4 md:mt-6 md:pr-6 md:pt-6"
          aria-label={t("powersTenT.setup.presentation")}
        >
          <LabeledField label={t("powersTenT.setup.notation")} htmlFor="notation-mode">
            <Select
              value={config.notationMode}
              onValueChange={(value) => onConfigChange({ notationMode: value as NotationMode })}
            >
              <SelectTrigger id="notation-mode" className="h-9 w-full rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">{t("powersTenT.notation.numeric")}</SelectItem>
                <SelectItem value="power">{t("powersTenT.notation.power")}</SelectItem>
                <SelectItem value="mixed">{t("powersTenT.notation.mixed")}</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>
          <SetupToggleRow
            id="powers-ten-hint"
            label={t("powersTenT.setup.showHint")}
            hint={t("powersTenT.setup.showHintHelp")}
            hintAriaLabel={moreInfo(t("powersTenT.setup.showHint"))}
            checked={config.showHint}
            onCheckedChange={(showHint) => onConfigChange({ showHint })}
          />
        </section>

        <section
          className="grid content-start gap-3 border-t pt-4 sm:gap-4 md:mt-6 md:border-l md:pt-6 md:pl-6"
          aria-label={t("powersTenT.setup.session")}
        >
          <LabeledField label={t("powersTenT.setup.answerMode")} htmlFor="answer-mode">
            <Select
              value={config.answerMode}
              onValueChange={(value) => onConfigChange({ answerMode: value as AnswerMode })}
            >
              <SelectTrigger id="answer-mode" className="h-9 w-full rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">{t("powersTenT.mode.quiz")}</SelectItem>
                <SelectItem value="input">{t("powersTenT.mode.input")}</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField
              label={t("powersTenT.setup.timer")}
              htmlFor="powers-timer"
              labelAction={
                <SetupHint ariaLabel={moreInfo(t("powersTenT.setup.timer"))}>
                  {t("powersTenT.setup.timerHint")}
                </SetupHint>
              }
            >
              <NumericInput
                id="powers-timer"
                value={config.timerMinutes}
                min={0}
                showInfinityWhenZero
                onChange={(timerMinutes) => onConfigChange({ timerMinutes })}
                aria-label={t("powersTenT.aria.timer")}
              />
            </LabeledField>
            <LabeledField
              label={t("powersTenT.setup.maxExercises")}
              htmlFor="powers-max-exercises"
              labelAction={
                <SetupHint ariaLabel={moreInfo(t("powersTenT.setup.maxExercises"))}>
                  {t("powersTenT.setup.maxExercisesHint")}
                </SetupHint>
              }
            >
              <NumericInput
                id="powers-max-exercises"
                value={config.maxExercises}
                min={0}
                showInfinityWhenZero
                onChange={(maxExercises) => onConfigChange({ maxExercises })}
                aria-label={t("powersTenT.aria.maxExercises")}
              />
            </LabeledField>
          </div>
          <SetupToggleRow
            id="powers-ten-sounds"
            label={t("powersTenT.setup.sounds")}
            checked={config.soundsEnabled}
            onCheckedChange={(soundsEnabled) => onConfigChange({ soundsEnabled })}
          />
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:justify-end">
        <Button onClick={onStart} disabled={!canStart} className="h-10 w-full sm:w-auto">
          {t("powersTenT.start")}
        </Button>
        <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
          <Link to="/">{t("menu.mainMenuLabel")}</Link>
        </Button>
      </div>
    </div>
  );
}
