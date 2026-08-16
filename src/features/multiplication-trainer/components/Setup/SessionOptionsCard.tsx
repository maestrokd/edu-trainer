import { Checkbox } from "@/components/ui/checkbox";
import { NumericInput } from "@/components/ui/numeric-input";
import { LabeledField } from "@/components/ui/labeled-field";
import { SetupHint } from "@/components/ui/setup-hint";

interface SessionOptionsCardProps {
  includeMul: boolean;
  includeDiv: boolean;
  timerMinutes: number;
  maxExercises: number;
  onMulChange: (val: boolean) => void;
  onDivChange: (val: boolean) => void;
  onTimerChange: (val: number) => void;
  onMaxExercisesChange: (val: number) => void;
  labels: {
    exercises: string;
    mul: string;
    div: string;
    timer: string;
    timerHint: string;
    maxExercises: string;
    maxExercisesHint: string;
    ariaMul: string;
    ariaDiv: string;
    ariaTimer: string;
    ariaMaxExercises: string;
    moreInfo: (field: string) => string;
  };
}

export function SessionOptionsCard({
  includeMul,
  includeDiv,
  timerMinutes,
  maxExercises,
  onMulChange,
  onDivChange,
  onTimerChange,
  onMaxExercisesChange,
  labels,
}: SessionOptionsCardProps) {
  return (
    <section
      className="grid gap-3 border-t pt-4 sm:gap-4 md:border-t-0 md:border-l md:pt-0 md:pl-6"
      aria-label={labels.exercises}
    >
      <fieldset className="grid min-w-0 gap-2">
        <legend className="text-sm leading-none font-medium">{labels.exercises}:</legend>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex min-h-7 items-center gap-2 text-sm">
            <Checkbox
              id="mul-check"
              checked={includeMul}
              onCheckedChange={(v) => onMulChange(Boolean(v))}
              aria-label={labels.ariaMul}
            />
            {labels.mul}
          </label>
          <label className="flex min-h-7 items-center gap-2 text-sm">
            <Checkbox
              id="div-check"
              checked={includeDiv}
              onCheckedChange={(v) => onDivChange(Boolean(v))}
              aria-label={labels.ariaDiv}
            />
            {labels.div}
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <LabeledField
          label={labels.timer}
          htmlFor="timer-min"
          labelAction={<SetupHint ariaLabel={labels.moreInfo(labels.timer)}>{labels.timerHint}</SetupHint>}
        >
          <NumericInput
            id="timer-min"
            value={timerMinutes}
            onChange={onTimerChange}
            min={0}
            fallbackValue={0}
            showInfinityWhenZero
            aria-label={labels.ariaTimer}
            className="rounded-xl"
          />
        </LabeledField>

        <LabeledField
          label={labels.maxExercises}
          htmlFor="max-ex"
          labelAction={
            <SetupHint ariaLabel={labels.moreInfo(labels.maxExercises)}>{labels.maxExercisesHint}</SetupHint>
          }
        >
          <NumericInput
            id="max-ex"
            value={maxExercises}
            onChange={onMaxExercisesChange}
            min={0}
            fallbackValue={0}
            showInfinityWhenZero
            aria-label={labels.ariaMaxExercises}
            className="rounded-xl"
          />
        </LabeledField>
      </div>
    </section>
  );
}
