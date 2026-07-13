import { useTranslation } from "react-i18next";
import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";

interface QuizOptionsProps {
  options: number[];
  onSelect: (value: number) => void;
  disabled: boolean;
  problemKey: string;
}

export function QuizOptions({ options, onSelect, disabled, problemKey }: QuizOptionsProps) {
  const { t } = useTranslation();
  return (
    <QuizKeyboardPad
      taskId={problemKey}
      disabled={disabled}
      onSelect={onSelect}
      options={options.map((option, index) => ({
        key: `${problemKey}-${index}`,
        value: option,
        ariaLabel: t("timesTableKnight.encounter.optionAria", { option }),
      }))}
    />
  );
}
