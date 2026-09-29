import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  labels: { placeholder: string; submit: string; hint: string };
}

export function AnswerInput({ value, inputRef, disabled, onChange, onSubmit, labels }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "" || /^\d*(?:[.,]\d*)?$/.test(next)) onChange(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
            if (event.key === "Escape") onChange("");
          }}
          className="w-44 rounded-xl text-center text-2xl sm:w-52 sm:text-3xl"
        />
        <Button onClick={onSubmit} disabled={disabled} className="text-lg">
          {labels.submit}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{labels.hint}</p>
    </div>
  );
}
