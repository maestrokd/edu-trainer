import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";
import type { DecimalValue } from "../model/trainer.types";

interface Props {
  taskId: number;
  options: DecimalValue[];
  disabled: boolean;
  formatValue: (value: DecimalValue, preserveScale?: boolean) => string;
  onSelect: (value: DecimalValue) => void;
  optionAria: (value: string) => string;
}

export function QuizOptions({ taskId, options, disabled, formatValue, onSelect, optionAria }: Props) {
  return (
    <QuizKeyboardPad
      taskId={taskId}
      disabled={disabled}
      options={options.map((option, index) => ({
        key: `${taskId}-${index}`,
        value: index,
        label: formatValue(option, true),
        ariaLabel: optionAria(formatValue(option, true)),
      }))}
      onSelect={(index) => onSelect(options[index])}
    />
  );
}
