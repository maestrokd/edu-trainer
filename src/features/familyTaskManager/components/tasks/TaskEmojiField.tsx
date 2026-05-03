import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme/theme-provider.tsx";
import { cn } from "@/lib/utils";
import { NotoEmoji } from "../shared/NotoEmoji";

interface TaskEmojiFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

function normalizeEmojiValue(value: string) {
  return value.trim().slice(0, 16);
}

export function TaskEmojiField({ value, onChange, label }: TaskEmojiFieldProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const pickerTheme = theme === "dark" ? Theme.DARK : theme === "light" ? Theme.LIGHT : Theme.AUTO;
  const normalizedValue = normalizeEmojiValue(value);
  const hasValue = normalizedValue.length > 0;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(normalizeEmojiValue(emojiData.emoji));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium text-foreground">{label}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-between rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground shadow-xs transition-colors",
            open ? "border-primary/40 bg-primary/10" : "hover:border-ring/50 hover:bg-accent"
          )}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={
            hasValue
              ? t("familyTask.tasks.changeEmoji", "Change emoji")
              : t("familyTask.tasks.chooseEmoji", "Choose emoji")
          }
        >
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-muted/70">
              <NotoEmoji emoji={normalizedValue} size={22} fallback="😀" />
            </span>
            <span>
              {hasValue
                ? t("familyTask.tasks.changeEmoji", "Change emoji")
                : t("familyTask.tasks.chooseEmoji", "Choose emoji")}
            </span>
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
        </button>

        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground shadow-xs transition-colors hover:border-ring/50 hover:bg-accent hover:text-foreground"
            aria-label={t("familyTask.tasks.clearEmoji", "Clear emoji")}
            title={t("familyTask.tasks.clearEmoji", "Clear emoji")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {hasValue
          ? t("familyTask.tasks.selectedEmoji", "Selected: {{emoji}}", { emoji: normalizedValue })
          : t("familyTask.tasks.noEmojiSelected", "No emoji selected")}
      </p>

      {open ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder={t("familyTask.tasks.searchEmoji", "Search emoji")}
            width="100%"
            height={360}
            emojiStyle={EmojiStyle.GOOGLE}
            theme={pickerTheme}
            autoFocusSearch={false}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </div>
      ) : null}
    </div>
  );
}
