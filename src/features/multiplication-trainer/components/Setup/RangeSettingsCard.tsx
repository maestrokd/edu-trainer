import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LabeledField } from "@/components/ui/labeled-field";
import { SetupHint } from "@/components/ui/setup-hint";

interface RangeSettingsCardProps {
  minVal: number;
  maxVal: number;
  includeMul: boolean;
  includeDiv: boolean;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onMulChange: (val: boolean) => void;
  onDivChange: (val: boolean) => void;
  labels: {
    range: string;
    rangeHint: string;
    min: string;
    max: string;
    exercises: string;
    mul: string;
    div: string;
    ariaMin: string;
    ariaMax: string;
    ariaMul: string;
    ariaDiv: string;
    moreInfo: (field: string) => string;
  };
}

export function RangeSettingsCard({
  minVal,
  maxVal,
  includeMul,
  includeDiv,
  onMinChange,
  onMaxChange,
  onMulChange,
  onDivChange,
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

      <fieldset className="grid min-w-0 gap-2">
        <legend className="text-sm leading-none font-medium">{labels.exercises}:</legend>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="flex min-h-7 items-center gap-2 text-sm">
            <Checkbox
              id="mul-check"
              checked={includeMul}
              onCheckedChange={(value) => onMulChange(Boolean(value))}
              aria-label={labels.ariaMul}
            />
            {labels.mul}
          </label>
          <label className="flex min-h-7 items-center gap-2 text-sm">
            <Checkbox
              id="div-check"
              checked={includeDiv}
              onCheckedChange={(value) => onDivChange(Boolean(value))}
              aria-label={labels.ariaDiv}
            />
            {labels.div}
          </label>
        </div>
      </fieldset>
    </section>
  );
}
