import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { generateOptions } from "../lib/quiz-options";

export function QuizOptions({
  correctAnswer,
  disabled,
  onSelect,
}: {
  correctAnswer: number;
  disabled: boolean;
  onSelect: (val: number) => void;
}) {
  const options = useMemo(() => generateOptions(correctAnswer), [correctAnswer]);

  return (
    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
      {options.map((opt) => (
        <Button
          key={opt}
          variant="secondary"
          className="addsub-quiz-option min-w-20"
          onClick={() => onSelect(opt)}
          disabled={disabled}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}
