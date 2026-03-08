import { Button } from "@/components/ui/button";

interface QuizOptionsProps {
  options: number[];
  onSelect: (val: number) => void;
  disabled: boolean;
  getAriaLabel: (opt: number) => string;
  taskId: number;
}

export function QuizOptions({ options, onSelect, disabled, getAriaLabel, taskId }: QuizOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {options.map((opt, idx) => (
        <Button
          key={`${taskId}-${idx}`}
          variant="outline"
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).blur();
            if (!disabled) onSelect(opt);
          }}
          onTouchEnd={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          aria-label={getAriaLabel(opt)}
          disabled={disabled}
          className="px-5 py-4 text-2xl font-medium"
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}
