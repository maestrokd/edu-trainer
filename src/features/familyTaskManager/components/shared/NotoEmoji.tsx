import { Emoji, EmojiStyle, emojiByUnified } from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface NotoEmojiProps {
  emoji: string;
  size: number;
  className?: string;
  fallback?: string;
}

function toUnified(emoji: string): string | null {
  const value = emoji.trim();
  if (!value) {
    return null;
  }

  const codePoints = Array.from(value)
    .map((symbol) => symbol.codePointAt(0)?.toString(16))
    .filter((item): item is string => Boolean(item));

  if (codePoints.length === 0) {
    return null;
  }

  return codePoints.join("-");
}

export function NotoEmoji({ emoji, size, className, fallback }: NotoEmojiProps) {
  const trimmed = emoji.trim();
  const unified = toUnified(trimmed);
  const knownEmoji = unified ? emojiByUnified(unified) : null;

  if (trimmed && unified && knownEmoji) {
    return (
      <span className={cn("inline-flex items-center justify-center leading-none", className)}>
        <Emoji unified={unified} size={size} emojiStyle={EmojiStyle.GOOGLE} lazyLoad />
      </span>
    );
  }

  if (trimmed) {
    return <span className={cn("inline-flex items-center justify-center leading-none", className)}>{trimmed}</span>;
  }

  return fallback ? (
    <span className={cn("inline-flex items-center justify-center leading-none", className)}>{fallback}</span>
  ) : null;
}
