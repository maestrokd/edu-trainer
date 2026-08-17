import React from "react";
import { Input } from "@/components/ui/input";

/**
 * A reusable numeric input wrapper that:
 * - Uses type="text" for cross-browser and mobile keyboard compatibility.
 * - Allows the user to clear "0" and freely type any other digit.
 * - When `showInfinityWhenZero` is true (default: false):
 *     - Displays an empty input with a "∞" placeholder when value is 0.
 *     - This signals the field is "unlimited" and 0 === no limit.
 *     - When the user clears the field and blurs, it returns to value 0 (∞).
 * - On blur, defaults to `fallbackValue` (default: 0) when field is left empty or non-numeric.
 * - Restricts input to supported numeric characters while preserving transient states such as "-" or ".".
 */
interface NumericInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  fallbackValue?: number;
  showInfinityWhenZero?: boolean;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

/** Converts `value` to the raw string to display in the input field. */
function toRaw(value: number, showInfinityWhenZero: boolean): string {
  if (showInfinityWhenZero && value === 0) return "";
  return String(value);
}

function parseRaw(raw: string, allowDecimal: boolean): number {
  if (raw === "") return Number.NaN;
  return allowDecimal ? Number(raw) : parseInt(raw, 10);
}

function isAllowedRaw(raw: string, allowNegative: boolean, allowDecimal: boolean): boolean {
  if (allowDecimal) {
    return allowNegative ? /^-?\d*(?:\.\d*)?$/.test(raw) : /^\d*(?:\.\d*)?$/.test(raw);
  }
  return allowNegative ? /^-?\d*$/.test(raw) : /^\d*$/.test(raw);
}

export function NumericInput({
  id,
  value,
  onChange,
  min,
  max = Infinity,
  fallbackValue = 0,
  showInfinityWhenZero = false,
  allowNegative = false,
  allowDecimal = false,
  className,
  disabled,
  "aria-label": ariaLabel,
}: NumericInputProps) {
  // The raw string shown in the input (so the user can erase "0" and type "5")
  const [raw, setRaw] = React.useState(() => toRaw(value, showInfinityWhenZero));
  const effectiveMin = min ?? (allowNegative ? -Infinity : 0);
  const clamp = (next: number) => Math.min(max, Math.max(effectiveMin, next));

  // Sync when the controlled `value` prop changes externally (e.g., stateReplaced from teacher)
  React.useEffect(() => {
    const parsed = parseRaw(raw, allowDecimal);
    const rawAsValue = showInfinityWhenZero && raw === "" ? 0 : parsed;
    if (Number.isNaN(rawAsValue) || rawAsValue !== value) {
      setRaw(toRaw(value, showInfinityWhenZero));
    }
    // `raw` stays local while the user is in a transient editing state such as "-" or ".".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowDecimal, showInfinityWhenZero, value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputVal = e.target.value;
    if (!isAllowedRaw(inputVal, allowNegative, allowDecimal)) return;

    setRaw(inputVal);
    // Update domain state immediately while typing (only on valid number)
    const parsed = parseRaw(inputVal, allowDecimal);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    } else if (inputVal === "" && showInfinityWhenZero) {
      // Empty field in ∞ mode means "unlimited" = 0
      onChange(clamp(fallbackValue));
    }
  }

  function handleBlur() {
    const parsed = parseRaw(raw, allowDecimal);
    const safeValue = clamp(Number.isFinite(parsed) ? parsed : fallbackValue);
    setRaw(toRaw(safeValue, showInfinityWhenZero));
    onChange(safeValue);
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode={allowNegative ? "text" : allowDecimal ? "decimal" : "numeric"}
      pattern={allowNegative ? undefined : allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
      value={raw}
      placeholder={showInfinityWhenZero && raw === "" ? "∞" : undefined}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
    />
  );
}
