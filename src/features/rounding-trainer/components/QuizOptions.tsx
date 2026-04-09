import { Button } from "@/components/ui/button";

interface QuizOptionsProps {
  taskId: number;
  options: number[];
  disabled: boolean;
  formatNumber: (value: number) => string;
  onSelect: (value: number) => void;
}

export function QuizOptions({ taskId, options, disabled, formatNumber, onSelect }: QuizOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {options.map((option, index) => (
        <Button
          key={`${taskId}-${index}`}
          variant="outline"
          disabled={disabled}
          onClick={(event) => {
            (event.currentTarget as HTMLButtonElement).blur();
            if (!disabled) onSelect(option);
          }}
          onTouchEnd={(event) => (event.currentTarget as HTMLButtonElement).blur()}
          aria-label={`${option}`}
          className="px-5 py-4 text-2xl font-medium"
        >
          {formatNumber(option)}
        </Button>
      ))}
    </div>
  );
}
