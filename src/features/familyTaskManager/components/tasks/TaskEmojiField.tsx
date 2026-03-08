import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from "emoji-picker-react";
import { useTranslation } from "react-i18next";
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
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(normalizeEmojiInput(emojiData.emoji));
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium text-slate-700">{label}</p> : null}

      <div className="flex items-center gap-2">
        <input
          maxLength={16}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(normalizeEmojiInput(event.target.value))}
        />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex h-10 min-w-20 items-center justify-center rounded-xl border bg-white px-3 text-sm font-medium transition",
            open
              ? "border-sky-300 bg-sky-50 text-slate-900"
              : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
          aria-expanded={open}
        >
          <NotoEmoji emoji={value} size={24} fallback="😀" />
        </button>
      </div>

      <p className="text-xs text-slate-500">{t("familyTask.tasks.emojiSet", "Emoji set: Noto (Google)")}</p>

      {open ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceholder={t("familyTask.tasks.searchEmoji", "Search emoji")}
            width="100%"
            height={360}
            emojiStyle={EmojiStyle.GOOGLE}
            theme={Theme.LIGHT}
            autoFocusSearch={false}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </div>
      ) : null}
    </div>
  );
}
