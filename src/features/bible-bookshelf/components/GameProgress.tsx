interface GameProgressProps {
  correct: number;
  total: number;
  label: string;
  valueLabel: string;
  compactValueLabel: string;
}

export function GameProgress({ correct, total, label, valueLabel, compactValueLabel }: GameProgressProps) {
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="min-w-0 space-y-1 sm:min-w-52 sm:space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold sm:gap-4 sm:text-sm">
        <span className="sm:hidden">{compactValueLabel}</span>
        <span className="hidden sm:inline">{valueLabel}</span>
        <span className="hidden text-muted-foreground sm:inline">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={correct}
        className="h-1.5 overflow-hidden rounded-full bg-secondary sm:h-2.5"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
