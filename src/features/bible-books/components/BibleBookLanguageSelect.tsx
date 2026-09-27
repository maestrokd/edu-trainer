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
  hintClassName?: string;
}

export function BibleBookLanguageSelect({
  id,
  value,
  onChange,
  label,
  hint,
  hintClassName,
}: BibleBookLanguageSelectProps) {
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
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
