import { Languages } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { BibleBookLanguage } from "../model/bible-books.types";

interface BibleBookLanguageSelectProps {
  id: string;
  value: BibleBookLanguage;
  onChange: (language: BibleBookLanguage) => void;
  label: string;
  hint: string;
  className?: string;
  labelClassName?: string;
  hintClassName?: string;
}

export function BibleBookLanguageSelect({
  id,
  value,
  onChange,
  label,
  hint,
  className,
  labelClassName,
  hintClassName,
}: BibleBookLanguageSelectProps) {
  const hintId = `${id}-hint`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn("flex items-center gap-2", labelClassName)}>
        <Languages className="size-4" aria-hidden="true" />
        {label}
      </Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as BibleBookLanguage)}>
        <SelectTrigger id={id} className="h-11 w-full" aria-describedby={hintId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="uk">Українська</SelectItem>
          <SelectItem value="ru">Русский</SelectItem>
        </SelectContent>
      </Select>
      <p id={hintId} className={cn("text-xs leading-relaxed text-muted-foreground", hintClassName)}>
        {hint}
      </p>
    </div>
  );
}
