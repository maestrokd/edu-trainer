import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetupHint } from "@/components/ui/setup-hint";
import type { DecimalTypeConfig, FractionTypeConfig, IntegerTypeConfig } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSetupState, HistoryOrder, TypeAvailabilityMap } from "../model/trainer.types";
import { PRECISION_OPTIONS } from "../model/trainer.constants";
import { GapFields, ToggleRow, TypeCard, WeightField } from "./shared/SetupControls";
import { LoginSuggestionSlot } from "../slots/LoginSuggestionSlot";
import { UpgradeSuggestionSlot } from "../slots/UpgradeSuggestionSlot";

interface CompareNumbersSetupScreenProps {
  setup: CompareNumbersSetupState;
  typeAvailableMap: TypeAvailabilityMap;
  canStart: boolean;
  canUseCoreFeature: boolean;
  onOpenModeChange: (value: string | undefined) => void;
  onNonNegativeConfigChange: (update: Partial<IntegerTypeConfig>) => void;
  onSignedConfigChange: (update: Partial<IntegerTypeConfig>) => void;
  onDecimalConfigChange: (update: Partial<DecimalTypeConfig>) => void;
  onFractionConfigChange: (update: Partial<FractionTypeConfig>) => void;
  onEqualRatioChange: (value: number) => void;
  onHistoryOrderChange: (value: HistoryOrder) => void;
  onTimerMinutesChange: (value: number | null) => void;
  onMaxExercisesChange: (value: number | null) => void;
  onEnableSoundChange: (value: boolean) => void;
  onEnableVibrationChange: (value: boolean) => void;
  onStartSession: () => void;
}

export function CompareNumbersSetupScreen({
  setup,
  typeAvailableMap,
  canStart,
  canUseCoreFeature,
  onOpenModeChange,
  onNonNegativeConfigChange,
  onSignedConfigChange,
  onDecimalConfigChange,
  onFractionConfigChange,
  onEqualRatioChange,
  onHistoryOrderChange,
  onTimerMinutesChange,
  onMaxExercisesChange,
  onEnableSoundChange,
  onEnableVibrationChange,
  onStartSession,
}: CompareNumbersSetupScreenProps) {
  const { t } = useTranslation();
  const tr = (key: string, options?: Record<string, unknown>) => t(`cmpNmbrGm.${key}`, options);

  const setupLocked = !canUseCoreFeature;
  const moreInfoLabel = (field: string) => tr("aria.moreInfo", { field });

  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-5 sm:shadow-lg sm:backdrop-blur md:p-8"
      aria-label={tr("setup.title")}
    >
      {!canStart && <p className="text-sm font-medium text-destructive">{tr("errors.unavailable")}</p>}
      <p className="hidden text-sm text-muted-foreground sm:block">{tr("setup.intro")}</p>

      <Accordion
        type="single"
        collapsible
        value={setup.openMode}
        onValueChange={onOpenModeChange}
        className="mt-3 space-y-2 sm:mt-5 sm:space-y-3"
      >
        <TypeCard
          id="non-negative"
          value="nonNegative"
          title={tr("types.nonNegative.title")}
          description={tr("types.nonNegative.desc")}
          enabled={setup.nonNegativeConfig.enabled}
          onEnabledChange={(checked) => {
            onNonNegativeConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.nonNegativeConfig.enabled && !typeAvailableMap.nonNegativeInt}
          availabilityText={tr("types.messages.unavailable")}
          disabled={setupLocked}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField label={tr("ranges.min")} htmlFor="non-negative-min">
              <NumericInput
                id="non-negative-min"
                min={0}
                value={setup.nonNegativeConfig.min}
                disabled={!setup.nonNegativeConfig.enabled || setupLocked}
                onChange={(min) => {
                  onNonNegativeConfigChange({
                    min,
                    max: Math.max(min, setup.nonNegativeConfig.max),
                  });
                }}
                fallbackValue={0}
                aria-label={tr("ranges.min")}
                className="rounded-xl"
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="non-negative-max">
              <NumericInput
                id="non-negative-max"
                min={setup.nonNegativeConfig.min}
                value={setup.nonNegativeConfig.max}
                disabled={!setup.nonNegativeConfig.enabled || setupLocked}
                onChange={(max) => {
                  onNonNegativeConfigChange({
                    max: Math.max(setup.nonNegativeConfig.min, max),
                  });
                }}
                fallbackValue={setup.nonNegativeConfig.min}
                aria-label={tr("ranges.max")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>
          <GapFields
            idPrefix="non-negative"
            minValue={setup.nonNegativeConfig.gap.min}
            maxValue={setup.nonNegativeConfig.gap.max}
            onMinChange={(value) =>
              onNonNegativeConfigChange({
                gap: { ...setup.nonNegativeConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onNonNegativeConfigChange({
                gap: { ...setup.nonNegativeConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.nonNegativeConfig.enabled || setupLocked}
          />
          <WeightField
            idPrefix="non-negative"
            value={setup.nonNegativeConfig.weight}
            onChange={(value) => onNonNegativeConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.nonNegativeConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="signed"
          value="signed"
          title={tr("types.signed.title")}
          description={tr("types.signed.desc")}
          enabled={setup.signedConfig.enabled}
          onEnabledChange={(checked) => {
            onSignedConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.signedConfig.enabled && !typeAvailableMap.signedInt}
          availabilityText={tr("types.messages.unavailable")}
          disabled={setupLocked}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField label={tr("ranges.min")} htmlFor="signed-min">
              <NumericInput
                id="signed-min"
                value={setup.signedConfig.min}
                disabled={!setup.signedConfig.enabled || setupLocked}
                onChange={(min) => {
                  onSignedConfigChange({
                    min,
                    max: Math.max(min, setup.signedConfig.max),
                  });
                }}
                allowNegative
                fallbackValue={0}
                aria-label={tr("ranges.min")}
                className="rounded-xl"
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="signed-max">
              <NumericInput
                id="signed-max"
                min={setup.signedConfig.min}
                value={setup.signedConfig.max}
                disabled={!setup.signedConfig.enabled || setupLocked}
                onChange={(max) => {
                  onSignedConfigChange({
                    max: Math.max(setup.signedConfig.min, max),
                  });
                }}
                allowNegative
                fallbackValue={setup.signedConfig.min}
                aria-label={tr("ranges.max")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>
          <GapFields
            idPrefix="signed"
            minValue={setup.signedConfig.gap.min}
            maxValue={setup.signedConfig.gap.max}
            onMinChange={(value) =>
              onSignedConfigChange({
                gap: { ...setup.signedConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onSignedConfigChange({
                gap: { ...setup.signedConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.signedConfig.enabled || setupLocked}
          />
          <WeightField
            idPrefix="signed"
            value={setup.signedConfig.weight}
            onChange={(value) => onSignedConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.signedConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="decimal"
          value="decimal"
          title={tr("types.decimal.title")}
          description={tr("types.decimal.desc")}
          enabled={setup.decimalConfig.enabled}
          onEnabledChange={(checked) => {
            onDecimalConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.decimalConfig.enabled && !typeAvailableMap.decimal}
          availabilityText={tr("types.messages.decimalRange")}
          disabled={setupLocked}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField label={tr("ranges.min")} htmlFor="decimal-min">
              <NumericInput
                id="decimal-min"
                value={setup.decimalConfig.min}
                disabled={!setup.decimalConfig.enabled || setupLocked}
                onChange={(min) => {
                  onDecimalConfigChange({
                    min,
                    max: Math.max(min, setup.decimalConfig.max),
                  });
                }}
                allowNegative
                allowDecimal
                fallbackValue={0}
                aria-label={tr("ranges.min")}
                className="rounded-xl"
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="decimal-max">
              <NumericInput
                id="decimal-max"
                min={setup.decimalConfig.min}
                value={setup.decimalConfig.max}
                disabled={!setup.decimalConfig.enabled || setupLocked}
                onChange={(max) => {
                  onDecimalConfigChange({
                    max: Math.max(setup.decimalConfig.min, max),
                  });
                }}
                allowNegative
                allowDecimal
                fallbackValue={setup.decimalConfig.min}
                aria-label={tr("ranges.max")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField label={tr("precision.mode")} htmlFor="decimal-mode">
              <Select
                value={setup.decimalConfig.precisionMode}
                onValueChange={(value) =>
                  onDecimalConfigChange({
                    precisionMode: value as DecimalTypeConfig["precisionMode"],
                  })
                }
                disabled={!setup.decimalConfig.enabled || setupLocked}
              >
                <SelectTrigger id="decimal-mode" disabled={!setup.decimalConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">{tr("precision.exact")}</SelectItem>
                  <SelectItem value="upTo">{tr("precision.upTo")}</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField
              label={
                setup.decimalConfig.precisionMode === "exact" ? tr("precision.exactValue") : tr("precision.maxValue")
              }
              htmlFor="decimal-precision"
            >
              <Select
                value={String(
                  setup.decimalConfig.precisionMode === "exact"
                    ? setup.decimalConfig.precision
                    : setup.decimalConfig.maxPrecision
                )}
                onValueChange={(value) => {
                  const numeric = Number(value);
                  if (!Number.isFinite(numeric)) return;
                  if (setup.decimalConfig.precisionMode === "exact") {
                    onDecimalConfigChange({ precision: numeric });
                  } else {
                    onDecimalConfigChange({ maxPrecision: numeric });
                  }
                }}
                disabled={!setup.decimalConfig.enabled || setupLocked}
              >
                <SelectTrigger id="decimal-precision" disabled={!setup.decimalConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {tr("precision.option", { count: value })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>
          </div>

          <GapFields
            idPrefix="decimal"
            minValue={setup.decimalConfig.gap.min}
            maxValue={setup.decimalConfig.gap.max}
            onMinChange={(value) =>
              onDecimalConfigChange({
                gap: { ...setup.decimalConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onDecimalConfigChange({
                gap: { ...setup.decimalConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.decimalConfig.enabled || setupLocked}
          />
          <WeightField
            idPrefix="decimal"
            value={setup.decimalConfig.weight}
            onChange={(value) => onDecimalConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.decimalConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="fraction"
          value="fraction"
          title={tr("types.fraction.title")}
          description={tr("types.fraction.desc")}
          enabled={setup.fractionConfig.enabled}
          onEnabledChange={(checked) => {
            onFractionConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.fractionConfig.enabled && !typeAvailableMap.fraction}
          availabilityText={tr("types.messages.unavailable")}
          disabled={setupLocked}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField label={tr("fractions.mode")} htmlFor="fraction-mode">
              <Select
                value={setup.fractionConfig.preset}
                onValueChange={(value) =>
                  onFractionConfigChange({
                    preset: value as FractionTypeConfig["preset"],
                  })
                }
                disabled={!setup.fractionConfig.enabled || setupLocked}
              >
                <SelectTrigger id="fraction-mode" disabled={!setup.fractionConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset12">{tr("fractions.preset12")}</SelectItem>
                  <SelectItem value="preset20">{tr("fractions.preset20")}</SelectItem>
                  <SelectItem value="custom">{tr("fractions.custom")}</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField label={tr("fractions.numerator")} htmlFor="fraction-num-min">
              <NumericInput
                id="fraction-num-min"
                min={1}
                value={setup.fractionConfig.numeratorMin}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(min) => {
                  onFractionConfigChange({
                    numeratorMin: min,
                    numeratorMax: Math.max(min, setup.fractionConfig.numeratorMax),
                  });
                }}
                fallbackValue={1}
                aria-label={tr("fractions.numerator")}
                className="rounded-xl"
              />
            </LabeledField>

            <LabeledField label={tr("fractions.numeratorMax")} htmlFor="fraction-num-max">
              <NumericInput
                id="fraction-num-max"
                min={setup.fractionConfig.numeratorMin}
                value={setup.fractionConfig.numeratorMax}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(max) => {
                  onFractionConfigChange({
                    numeratorMax: Math.max(setup.fractionConfig.numeratorMin, max),
                  });
                }}
                fallbackValue={setup.fractionConfig.numeratorMin}
                aria-label={tr("fractions.numeratorMax")}
                className="rounded-xl"
              />
            </LabeledField>

            <LabeledField label={tr("fractions.denominator")} htmlFor="fraction-den-min">
              <NumericInput
                id="fraction-den-min"
                min={1}
                value={setup.fractionConfig.denominatorMin}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(min) => {
                  onFractionConfigChange({
                    denominatorMin: min,
                    denominatorMax: Math.max(min, setup.fractionConfig.denominatorMax),
                  });
                }}
                fallbackValue={1}
                aria-label={tr("fractions.denominator")}
                className="rounded-xl"
              />
            </LabeledField>

            <LabeledField label={tr("fractions.denominatorMax")} htmlFor="fraction-den-max">
              <NumericInput
                id="fraction-den-max"
                min={setup.fractionConfig.denominatorMin}
                value={setup.fractionConfig.denominatorMax}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(max) => {
                  onFractionConfigChange({
                    denominatorMax: Math.max(setup.fractionConfig.denominatorMin, max),
                  });
                }}
                fallbackValue={setup.fractionConfig.denominatorMin}
                aria-label={tr("fractions.denominatorMax")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>

          <GapFields
            idPrefix="fraction"
            minValue={setup.fractionConfig.gap.min}
            maxValue={setup.fractionConfig.gap.max}
            onMinChange={(value) =>
              onFractionConfigChange({
                gap: { ...setup.fractionConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onFractionConfigChange({
                gap: { ...setup.fractionConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.fractionConfig.enabled || setupLocked}
          />
          <WeightField
            idPrefix="fraction"
            value={setup.fractionConfig.weight}
            onChange={(value) => onFractionConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.fractionConfig.enabled || setupLocked}
          />
        </TypeCard>
      </Accordion>

      <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2 md:gap-0">
        <section className="grid grid-cols-2 gap-2 sm:gap-3 md:pr-6">
          <LabeledField
            label={tr("equal.label")}
            htmlFor="equal-ratio"
            labelAction={<SetupHint ariaLabel={moreInfoLabel(tr("equal.label"))}>{tr("equal.hint")}</SetupHint>}
          >
            <div className="flex min-h-9 items-center gap-2">
              <input
                id="equal-ratio"
                type="range"
                min={0}
                max={50}
                value={setup.equalRatio}
                onChange={(event) => onEqualRatioChange(Number(event.target.value))}
                className="min-w-0 flex-1"
                disabled={setupLocked}
              />
              <span className="w-10 text-right text-sm font-medium">{setup.equalRatio}%</span>
            </div>
          </LabeledField>

          <LabeledField
            label={tr("history.order.label")}
            htmlFor="history-order"
            labelAction={
              <SetupHint ariaLabel={moreInfoLabel(tr("history.order.label"))}>{tr("history.order.hint")}</SetupHint>
            }
          >
            <Select
              value={setup.historyOrder}
              onValueChange={(value) => onHistoryOrderChange(value as HistoryOrder)}
              disabled={setupLocked}
            >
              <SelectTrigger id="history-order" className="h-9 rounded-xl sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{tr("history.order.oldest")}</SelectItem>
                <SelectItem value="desc">{tr("history.order.newest")}</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>
        </section>

        <section className="grid gap-3 border-t pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <LabeledField
              label={tr("session.timer")}
              htmlFor="timer-min"
              labelAction={
                <SetupHint ariaLabel={moreInfoLabel(tr("session.timer"))}>{tr("session.timerHint")}</SetupHint>
              }
            >
              <NumericInput
                id="timer-min"
                value={setup.timerMinutes ?? 0}
                onChange={(value) => onTimerMinutesChange(value > 0 ? value : null)}
                fallbackValue={0}
                showInfinityWhenZero
                disabled={setupLocked}
                aria-label={tr("session.timer")}
                className="rounded-xl"
              />
            </LabeledField>
            <LabeledField
              label={tr("session.maxExercises")}
              htmlFor="max-exercises"
              labelAction={
                <SetupHint ariaLabel={moreInfoLabel(tr("session.maxExercises"))}>
                  {tr("session.maxExercisesHint")}
                </SetupHint>
              }
            >
              <NumericInput
                id="max-exercises"
                value={setup.maxExercises ?? 0}
                onChange={(value) => onMaxExercisesChange(value > 0 ? value : null)}
                fallbackValue={0}
                showInfinityWhenZero
                disabled={setupLocked}
                aria-label={tr("session.maxExercises")}
                className="rounded-xl"
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ToggleRow
              id="feedback-sound"
              label={tr("feedback.sound")}
              hint={tr("feedback.soundDesc")}
              hintAriaLabel={moreInfoLabel(tr("feedback.sound"))}
              checked={setup.enableSound}
              onChange={onEnableSoundChange}
              disabled={setupLocked}
            />
            <ToggleRow
              id="feedback-vibration"
              label={tr("feedback.vibration")}
              hint={tr("feedback.vibrationDesc")}
              hintAriaLabel={moreInfoLabel(tr("feedback.vibration"))}
              checked={setup.enableVibration}
              onChange={onEnableVibrationChange}
              disabled={setupLocked}
            />
          </div>
        </section>
      </div>

      <LoginSuggestionSlot placement="compare_numbers_setup_footer" />
      <UpgradeSuggestionSlot placement="compare_numbers_setup_footer" />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:justify-end">
        <Button onClick={() => onStartSession()} disabled={!canStart || setupLocked} className="h-10 w-full sm:w-auto">
          {tr("setup.start")}
        </Button>
        <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
          <Link to="/">{tr("actions.toMenu")}</Link>
        </Button>
      </div>
    </div>
  );
}
