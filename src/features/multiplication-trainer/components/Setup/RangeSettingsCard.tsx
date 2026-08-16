import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LabeledField } from "@/components/ui/labeled-field";
import { SetupHint } from "@/components/ui/setup-hint";
import type { Mode } from "../../model/trainer.types";

interface RangeSettingsCardProps {
  minVal: number;
  maxVal: number;
  mode: Mode;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onModeChange: (val: Mode) => void;
  labels: {
    range: string;
    rangeHint: string;
    min: string;
    max: string;
    mode: string;
    modeQuiz: string;
    modeInput: string;
    ariaMin: string;
    ariaMax: string;
    ariaMode: string;
    moreInfo: (field: string) => string;
  };
}

export function RangeSettingsCard({
  minVal,
  maxVal,
  mode,
  onMinChange,
  onMaxChange,
  onModeChange,
  labels,
}: RangeSettingsCardProps) {
  return (
    <section className="grid gap-3 sm:gap-4 md:pr-6" aria-label={labels.range}>
      <div className="flex items-center gap-1">
        <h2 className="text-sm font-medium leading-none">{labels.range}</h2>
        <SetupHint ariaLabel={labels.moreInfo(labels.range)}>{labels.rangeHint}</SetupHint>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <LabeledField label={labels.min} htmlFor="min-select">
          <Select value={String(minVal)} onValueChange={(val) => onMinChange(parseInt(val, 10))}>
            <SelectTrigger id="min-select" className="h-9 w-full rounded-xl sm:h-10" aria-label={labels.ariaMin}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledField>

        <LabeledField label={labels.max} htmlFor="max-select">
          <Select value={String(maxVal)} onValueChange={(val) => onMaxChange(parseInt(val, 10))}>
            <SelectTrigger id="max-select" className="h-9 w-full rounded-xl sm:h-10" aria-label={labels.ariaMax}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledField>
      </div>

      <LabeledField label={labels.mode} htmlFor="mode-select">
        <Select value={mode} onValueChange={(val) => onModeChange(val as Mode)}>
          <SelectTrigger id="mode-select" className="h-9 w-full rounded-xl sm:h-10" aria-label={labels.ariaMode}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quiz">{labels.modeQuiz}</SelectItem>
            <SelectItem value="input">{labels.modeInput}</SelectItem>
          </SelectContent>
        </Select>
      </LabeledField>
    </section>
  );
}
