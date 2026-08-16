import { useTranslation } from "react-i18next";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import { SetupHint } from "@/components/ui/setup-hint";
import { SetupToggleRow } from "@/components/ui/setup-toggle-row";
import type { AddSubTrainerSetupController } from "./setup.types";

export function SessionOptionsCard({ controller }: { controller: AddSubTrainerSetupController }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars) as string;

  const { config } = controller.state;
  const { updateConfig } = controller.actions;

  return (
    <section className="grid gap-3 border-t pt-4 sm:gap-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <LabeledField
          label={tr("setup.timer")}
          htmlFor="timer-min"
          labelAction={
            <SetupHint ariaLabel={tr("aria.moreInfo", { field: tr("setup.timer") })}>{tr("setup.timerHint")}</SetupHint>
          }
        >
          <NumericInput
            id="timer-min"
            value={config.timerMinutes}
            onChange={(val) => updateConfig({ timerMinutes: val })}
            showInfinityWhenZero={true}
            allowNegative={false}
            aria-label={tr("aria.timer") || undefined}
            className="rounded-xl"
          />
        </LabeledField>

        <LabeledField
          label={tr("setup.maxExercises")}
          htmlFor="max-ex"
          labelAction={
            <SetupHint ariaLabel={tr("aria.moreInfo", { field: tr("setup.maxExercises") })}>
              {tr("setup.maxExercisesHint")}
            </SetupHint>
          }
        >
          <NumericInput
            id="max-ex"
            value={config.maxExercises}
            onChange={(val) => updateConfig({ maxExercises: val })}
            showInfinityWhenZero={true}
            allowNegative={false}
            aria-label={tr("aria.maxExercises") || undefined}
            className="rounded-xl"
          />
        </LabeledField>
      </div>

      <SetupToggleRow
        id="sounds-toggle"
        label={tr("setup.sounds")}
        hint={tr("setup.soundsHint")}
        hintAriaLabel={tr("aria.moreInfo", { field: tr("setup.sounds") })}
        checked={config.enableSounds}
        onCheckedChange={(enableSounds) => updateConfig({ enableSounds })}
      />
    </section>
  );
}
