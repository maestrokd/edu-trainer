import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme/theme-provider.tsx";
import { cn } from "@/lib/utils";
import { NotoEmoji } from "../shared/NotoEmoji";

interface TaskEmojiFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder: string;
}

function normalizeEmojiInput(value: string) {
  return value.slice(0, 16);
}

export function TaskEmojiField({ value, onChange, label, placeholder }: TaskEmojiFieldProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const pickerTheme = theme === "dark" ? Theme.DARK : theme === "light" ? Theme.LIGHT : Theme.AUTO;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(normalizeEmojiInput(emojiData.emoji));
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium text-foreground">{label}</p> : null}

      <div className="flex items-center gap-2">
        <input
          maxLength={16}
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(normalizeEmojiInput(event.target.value))}
        />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex h-10 min-w-20 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors",
            open ? "border-primary/40 bg-primary/10" : "hover:border-ring/50 hover:bg-accent"
          )}
          aria-expanded={open}
        >
          <NotoEmoji emoji={value} size={24} fallback="😀" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{t("familyTask.tasks.emojiSet", "Emoji set: Noto (Google)")}</p>

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
