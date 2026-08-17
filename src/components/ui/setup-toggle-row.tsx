import { Label } from "@/components/ui/label";
import { SetupHint } from "@/components/ui/setup-hint";
import { Switch } from "@/components/ui/switch";

interface SetupToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;
  hintAriaLabel?: string;
  disabled?: boolean;
}

export function SetupToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
  hint,
  hintAriaLabel,
  disabled = false,
}: SetupToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm sm:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-1 font-medium leading-tight">
        <Label htmlFor={id}>{label}</Label>
        {hint && hintAriaLabel && <SetupHint ariaLabel={hintAriaLabel}>{hint}</SetupHint>}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}
