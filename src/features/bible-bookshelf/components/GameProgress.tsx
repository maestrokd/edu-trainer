interface GameProgressProps {
  correct: number;
  total: number;
  label: string;
  valueLabel: string;
}

export function GameProgress({ correct, total, label, valueLabel }: GameProgressProps) {
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="min-w-52 space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold">
        <span>{valueLabel}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={correct}
        className="h-2.5 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
