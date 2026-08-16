import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetupHint } from "@/components/ui/setup-hint";
import { SetupToggleRow } from "@/components/ui/setup-toggle-row";
import { DIGITS_CHOICES } from "../model/trainer.constants";
import type { ConfigUpdate, Mode, SessionConfig } from "../model/trainer.types";
import { LoginSuggestionSlot } from "../slots/LoginSuggestionSlot";
import { UpgradeSuggestionSlot } from "../slots/UpgradeSuggestionSlot";

interface RoundingTrainerSetupScreenProps {
  config: SessionConfig;
  canUseCoreFeature: boolean;
  onConfigChange: (update: ConfigUpdate) => void;
  onStart: () => void;
}

export function RoundingTrainerSetupScreen({
  config,
  canUseCoreFeature,
  onConfigChange,
  onStart,
}: RoundingTrainerSetupScreenProps) {
  const { t } = useTranslation();
  const setupLocked = !canUseCoreFeature;
  const moreInfoLabel = (field: string) => t("roundT.aria.moreInfo", { field });

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-5 sm:shadow-lg sm:backdrop-blur md:p-8">
      <p className="hidden text-sm text-muted-foreground sm:block">{t("roundT.setup.intro")}</p>

      <div className="grid gap-4 sm:mt-5 md:grid-cols-2 md:gap-0">
        <section className="grid gap-3 sm:gap-4 md:pr-6" aria-label={t("roundT.setup.numberTypes")}>
          <div className="grid gap-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              {t("roundT.setup.numberTypes")}:
              <SetupHint ariaLabel={moreInfoLabel(t("roundT.setup.numberTypes"))}>
                {t("roundT.setup.filtersHint")}
              </SetupHint>
            </div>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1"
              role="group"
              aria-label={t("roundT.setup.numberTypes")}
            >
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="rounding-whole"
                  checked={config.includeWhole}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ includeWhole: Boolean(value) })}
                />
                {t("roundT.setup.whole")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="rounding-decimals"
                  checked={config.includeDecimals}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ includeDecimals: Boolean(value) })}
                />
                {t("roundT.setup.decimals")}
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">{t("roundT.setup.signs")}:</div>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1"
              role="group"
              aria-label={t("roundT.setup.signs")}
            >
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="rounding-positives"
                  checked={config.includePositives}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ includePositives: Boolean(value) })}
                />
                {t("roundT.setup.positives")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="rounding-negatives"
                  checked={config.includeNegatives}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ includeNegatives: Boolean(value) })}
                />
                {t("roundT.setup.negatives")}
              </label>
            </div>
          </div>

          <LabeledField label={t("roundT.setup.decimalPlaces")} htmlFor="decimal-places-select">
            <Select
              value={String(config.decimalPlaces)}
              onValueChange={(value) => onConfigChange({ decimalPlaces: parseInt(value, 10) })}
              disabled={!config.includeDecimals || setupLocked}
            >
              <SelectTrigger id="decimal-places-select" className="h-9 w-full rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
        </section>

        <section
          className="grid gap-3 border-t pt-4 sm:gap-4 md:border-t-0 md:border-l md:pt-0 md:pl-6"
          aria-label={t("roundT.setup.magnitude")}
        >
          <div className="grid gap-2">
            <div className="text-sm font-medium">{t("roundT.setup.magnitude")}:</div>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("roundT.setup.magnitude")}>
              <Button
                variant={config.magnitudeMode === "digits" ? "default" : "outline"}
                className="h-9 px-3"
                disabled={setupLocked}
                onClick={() => onConfigChange({ magnitudeMode: "digits" })}
              >
                {t("roundT.setup.digitsMode")}
              </Button>
              <Button
                variant={config.magnitudeMode === "range" ? "default" : "outline"}
                className="h-9 px-3"
                disabled={setupLocked}
                onClick={() => onConfigChange({ magnitudeMode: "range" })}
              >
                {t("roundT.setup.rangeMode")}
              </Button>
            </div>
          </div>

          {config.magnitudeMode === "digits" ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <LabeledField label={t("roundT.setup.minDigits")} htmlFor="min-digits-select">
                <Select
                  value={String(config.minDigits)}
                  disabled={setupLocked}
                  onValueChange={(value) => onConfigChange({ minDigits: parseInt(value, 10) })}
                >
                  <SelectTrigger id="min-digits-select" className="h-9 w-full rounded-xl sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGITS_CHOICES.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledField>

              <LabeledField label={t("roundT.setup.maxDigits")} htmlFor="max-digits-select">
                <Select
                  value={String(config.maxDigits)}
                  disabled={setupLocked}
                  onValueChange={(value) => onConfigChange({ maxDigits: parseInt(value, 10) })}
                >
                  <SelectTrigger id="max-digits-select" className="h-9 w-full rounded-xl sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGITS_CHOICES.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabeledField>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <LabeledField label={t("roundT.setup.minValue")} htmlFor="min-value-input">
                <NumericInput
                  id="min-value-input"
                  value={config.minValue}
                  onChange={(minValue) => onConfigChange({ minValue })}
                  min={0}
                  fallbackValue={0}
                  disabled={setupLocked}
                  aria-label={t("roundT.setup.minValue")}
                  className="rounded-xl"
                />
              </LabeledField>

              <LabeledField label={t("roundT.setup.maxValue")} htmlFor="max-value-input">
                <NumericInput
                  id="max-value-input"
                  value={config.maxValue}
                  onChange={(maxValue) => onConfigChange({ maxValue })}
                  min={config.minValue}
                  fallbackValue={config.minValue}
                  disabled={setupLocked}
                  aria-label={t("roundT.setup.maxValue")}
                  className="rounded-xl"
                />
              </LabeledField>
            </div>
          )}
        </section>

        <section
          className="grid gap-3 border-t pt-4 sm:gap-4 md:mt-6 md:pr-6 md:pt-6"
          aria-label={t("roundT.setup.roundingOptions")}
        >
          <div className="grid gap-2">
            <div className="text-sm font-medium">{t("roundT.setup.targets")}:</div>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1"
              role="group"
              aria-label={t("roundT.setup.targets")}
            >
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="target-10"
                  checked={config.targets.tens}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ targets: { tens: Boolean(value) } })}
                />
                {t("roundT.targets.tens")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="target-100"
                  checked={config.targets.hundreds}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ targets: { hundreds: Boolean(value) } })}
                />
                {t("roundT.targets.hundreds")}
              </label>
              <label className="flex min-h-7 items-center gap-2 text-sm">
                <Checkbox
                  id="target-1000"
                  checked={config.targets.thousands}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ targets: { thousands: Boolean(value) } })}
                />
                {t("roundT.targets.thousands")}
              </label>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <SetupToggleRow
              id="include-tie-case"
              label={t("roundT.setup.includeTie")}
              hint={t("roundT.setup.includeTieHint")}
              hintAriaLabel={moreInfoLabel(t("roundT.setup.includeTie"))}
              checked={config.includeTieCase}
              disabled={setupLocked}
              onCheckedChange={(includeTieCase) => onConfigChange({ includeTieCase })}
            />
            <SetupToggleRow
              id="show-place-hint"
              label={t("roundT.setup.showHint")}
              hint={t("roundT.setup.showHintHint")}
              hintAriaLabel={moreInfoLabel(t("roundT.setup.showHint"))}
              checked={config.showHint}
              disabled={setupLocked}
              onCheckedChange={(showHint) => onConfigChange({ showHint })}
            />
          </div>
        </section>

        <section
          className="grid gap-3 border-t pt-4 sm:gap-4 md:mt-6 md:border-l md:pt-6 md:pl-6"
          aria-label={t("roundT.setup.mode")}
        >
          <LabeledField label={t("roundT.setup.mode")} htmlFor="rounding-mode-select">
            <Select
              value={config.mode}
              onValueChange={(value) => onConfigChange({ mode: value as Mode })}
              disabled={setupLocked}
            >
              <SelectTrigger id="rounding-mode-select" className="h-9 w-full rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">{t("roundT.mode.quiz")}</SelectItem>
                <SelectItem value="input">{t("roundT.mode.input")}</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField
              label={t("roundT.setup.timer")}
              htmlFor="timer-minutes"
              labelAction={
                <SetupHint ariaLabel={moreInfoLabel(t("roundT.setup.timer"))}>{t("roundT.setup.timerHint")}</SetupHint>
              }
            >
              <NumericInput
                id="timer-minutes"
                value={config.timerMinutes}
                onChange={(timerMinutes) => onConfigChange({ timerMinutes })}
                fallbackValue={0}
                showInfinityWhenZero
                disabled={setupLocked}
                aria-label={t("roundT.aria.timerMinutes")}
                className="rounded-xl"
              />
            </LabeledField>

            <LabeledField
              label={t("roundT.setup.maxExercises")}
              htmlFor="max-exercises"
              labelAction={
                <SetupHint ariaLabel={moreInfoLabel(t("roundT.setup.maxExercises"))}>
                  {t("roundT.setup.maxExercisesHint")}
                </SetupHint>
              }
            >
              <NumericInput
                id="max-exercises"
                value={config.maxExercises}
                onChange={(maxExercises) => onConfigChange({ maxExercises })}
                fallbackValue={0}
                showInfinityWhenZero
                disabled={setupLocked}
                aria-label={t("roundT.aria.maxExercises")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>

          <SetupToggleRow
            id="rounding-sounds-switch"
            label={t("roundT.setup.sounds")}
            checked={config.soundsEnabled}
            disabled={setupLocked}
            onCheckedChange={(soundsEnabled) => onConfigChange({ soundsEnabled })}
          />
        </section>
      </div>

      <LoginSuggestionSlot placement="rounding_setup_footer" />
      <UpgradeSuggestionSlot placement="rounding_setup_footer" />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:justify-end">
        <Button onClick={onStart} disabled={setupLocked} className="h-10 w-full sm:w-auto">
          {t("roundT.start")}
        </Button>
        <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
          <Link to="/" aria-label={t("roundT.aria.backToMenu")}>
            {t("menu.mainMenuLabel", "Main Menu")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
