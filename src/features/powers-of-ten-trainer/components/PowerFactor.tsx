import type { Power, TaskNotation } from "../model/trainer.types";

interface PowerFactorProps {
  power: Power;
  notation: TaskNotation;
  powerAriaLabel: string;
  formatInteger: (value: number) => string;
}

export function PowerFactor({ power, notation, powerAriaLabel, formatInteger }: PowerFactorProps) {
  if (notation === "numeric") return <>{formatInteger(10 ** power)}</>;
  return (
    <>
      <span aria-hidden>
        10<sup>{power}</sup>
      </span>
      <span className="sr-only">{powerAriaLabel}</span>
    </>
  );
}
