import { NumericInput } from "@/components/ui/numeric-input";
import { LabeledField } from "@/components/ui/labeled-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SetupHint } from "@/components/ui/setup-hint";
import type { Mode } from "../../model/trainer.types";

interface SessionOptionsCardProps {
  mode: Mode;
  timerMinutes: number;
  maxExercises: number;
  onModeChange: (val: Mode) => void;
  onTimerChange: (val: number) => void;
  onMaxExercisesChange: (val: number) => void;
  labels: {
    mode: string;
    modeQuiz: string;
    modeInput: string;
    timer: string;
    timerHint: string;
    maxExercises: string;
    maxExercisesHint: string;
    ariaMode: string;
    ariaTimer: string;
    ariaMaxExercises: string;
    moreInfo: (field: string) => string;
  };
}

export function SessionOptionsCard({
  mode,
  timerMinutes,
  maxExercises,
  onModeChange,
  onTimerChange,
  onMaxExercisesChange,
  labels,
}: SessionOptionsCardProps) {
  return (
    <section
      className="grid gap-3 border-t pt-4 sm:gap-4 md:border-t-0 md:border-l md:pt-0 md:pl-6"
      aria-label={labels.mode}
    >
      <LabeledField label={labels.mode} htmlFor="mode-select">
        <Select value={mode} onValueChange={(value) => onModeChange(value as Mode)}>
          <SelectTrigger id="mode-select" className="h-9 w-full rounded-xl sm:h-10" aria-label={labels.ariaMode}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quiz">{labels.modeQuiz}</SelectItem>
            <SelectItem value="input">{labels.modeInput}</SelectItem>
          </SelectContent>
        </Select>
      </LabeledField>

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
