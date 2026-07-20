import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AnswerInputProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
  problemKey: string;
}

export function AnswerInput({ onSubmit, disabled, problemKey }: AnswerInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // fresh problem → clear and refocus
  useEffect(() => {
    setValue("");
    if (!disabled) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [problemKey, disabled]);

  function submit() {
    if (value === "" || disabled) return;
    onSubmit(Number(value));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={t("timesTableKnight.encounter.typedPlaceholder")}
          aria-label={t("timesTableKnight.encounter.answerAria")}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== "" && !/^\d+$/.test(v)) return;
            setValue(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          className="w-36 text-center text-2xl rounded-xl"
        />
        <Button onClick={submit} disabled={disabled || value === ""} className="min-h-11 text-lg">
          {t("timesTableKnight.encounter.submit")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("timesTableKnight.encounter.typedHint")}</p>
    </div>
  );
}
