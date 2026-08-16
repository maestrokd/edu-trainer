import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import { SetupHint } from "@/components/ui/setup-hint";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ModeKey } from "../../model/trainer.types";

interface TypeCardProps {
  id: string;
  value: ModeKey;
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  children: React.ReactNode;
  showAvailabilityError: boolean;
  availabilityText: string | null;
  disabled?: boolean;
}

export function TypeCard({
  id,
  value,
  title,
  description,
  enabled,
  onEnabledChange,
  children,
  showAvailabilityError,
  availabilityText,
  disabled = false,
}: TypeCardProps) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur"
    >
      <AccordionPrimitive.Header className="flex items-stretch data-[state=open]:bg-muted/40">
        <div className="flex items-center pl-3 sm:pl-5">
          <Checkbox
            id={`${id}-toggle`}
            checked={enabled}
            disabled={disabled}
            onCheckedChange={(checked) => onEnabledChange(Boolean(checked))}
            aria-label={title}
            className="shrink-0"
          />
        </div>
        <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-3 px-3 py-3 text-left text-sm font-medium hover:no-underline sm:py-4 sm:pr-5 sm:text-base [&[data-state=open]>svg]:rotate-180">
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-semibold leading-tight sm:text-base">{title}</div>
            <p className="sr-only text-xs leading-snug text-muted-foreground sm:not-sr-only sm:block sm:text-sm">
              {description}
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionContent className="px-3 pb-4 sm:px-5">
        <fieldset disabled={!enabled} className={cn("space-y-3 pt-3 sm:space-y-5 sm:pt-4", !enabled && "opacity-60")}>
          {children}
        </fieldset>
        {showAvailabilityError && availabilityText && (
          <p className="pt-3 text-xs font-medium text-destructive">{availabilityText}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

interface GapFieldsProps {
  idPrefix: string;
  minValue: number;
  maxValue: number | null;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number | null) => void;
  labelMin: string;
  labelMax: string;
  disabled?: boolean;
}

export function GapFields({
  idPrefix,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  labelMin,
  labelMax,
  disabled = false,
}: GapFieldsProps) {
  const minId = `${idPrefix}-gap-min`;
  const maxId = `${idPrefix}-gap-max`;
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <LabeledField label={labelMin} htmlFor={minId}>
        <NumericInput
          id={minId}
          min={0}
          value={minValue}
          disabled={disabled}
          onChange={onMinChange}
          fallbackValue={0}
          allowDecimal
          aria-label={labelMin}
          className="rounded-xl"
        />
      </LabeledField>
      <LabeledField label={labelMax} htmlFor={maxId}>
        <Input
          id={maxId}
          type="number"
          min={0}
          step="0.1"
          value={maxValue ?? ""}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "") {
              onMaxChange(null);
              return;
            }
            const value = Number(event.target.value);
            onMaxChange(Number.isFinite(value) ? Math.max(0, value) : null);
          }}
          placeholder="∞"
          aria-label={labelMax}
          className="rounded-xl"
        />
      </LabeledField>
    </div>
  );
}

interface WeightFieldProps {
  idPrefix: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export function WeightField({ idPrefix, value, onChange, label, disabled = false }: WeightFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`${idPrefix}-weight`}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
          aria-label={label}
        />
        <NumericInput
          id={`${idPrefix}-weight`}
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={onChange}
          fallbackValue={0}
          aria-label={label}
          className="w-20 rounded-xl"
        />
      </div>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string | null;
  hint: string | null;
  hintAriaLabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ id, label, hint, hintAriaLabel, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm sm:px-3 sm:py-2.5">
      <div className="flex-1">
        <div className="flex items-center gap-1 font-medium leading-tight">
          <Label htmlFor={id}>{label}</Label>
          {hint && <SetupHint ariaLabel={hintAriaLabel}>{hint}</SetupHint>}
        </div>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={(value) => onChange(Boolean(value))} />
    </div>
  );
}
