import { useDraggable } from "@dnd-kit/react";
import { GripVertical, Lightbulb } from "lucide-react";

import type { BibleBook } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import type { BibleBookshelfGroup } from "../data/learning-groups";
import { getBibleBookshelfGroupTone } from "../lib/book-tones";
import type { BibleBookshelfMode } from "../lib/game";

interface BookCardProps {
  book: BibleBook;
  group: BibleBookshelfGroup;
  layout: BibleBookshelfMode;
  isSelected: boolean;
  isHinted: boolean;
  onSelect: (bookId: string) => void;
  selectedLabel: string;
  hintLabel: string;
  groupDescription: string;
}

export function BookCard({
  book,
  group,
  layout,
  isSelected,
  isHinted,
  onSelect,
  selectedLabel,
  hintLabel,
  groupDescription,
}: BookCardProps) {
  const isFullTestament = layout === "testament";
  const { ref, isDragging } = useDraggable({
    id: `book:${book.id}`,
    type: "book",
    data: { bookId: book.id },
  });

  return (
    <button
      ref={ref}
      id={`bookshelf-book-${book.id}`}
      data-testid={`book-card-${book.id}`}
      type="button"
      aria-pressed={isSelected}
      aria-label={`${book.name}${isSelected ? `, ${selectedLabel}` : ""}${isHinted ? `, ${hintLabel}` : ""}`}
      aria-description={groupDescription}
      onClick={() => {
        if (!isDragging) onSelect(book.id);
      }}
      className={cn(
        "group relative flex w-full items-center gap-2 overflow-hidden rounded-xl border border-l-8 bg-card text-left text-card-foreground shadow-sm outline-none transition-[transform,box-shadow,border-color]",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary/35 motion-reduce:transform-none motion-reduce:transition-none",
        isFullTestament
          ? "min-h-20 touch-pan-x px-2 py-3"
          : "min-h-20 touch-pan-x px-2 py-3 sm:min-h-28 sm:touch-none sm:px-3 sm:py-4",
        getBibleBookshelfGroupTone(group.id).spine,
        isSelected && "ring-4 ring-primary/45 shadow-lg",
        isHinted && "ring-4 ring-amber-400/70 shadow-lg",
        isDragging && "z-50 scale-105 opacity-90 shadow-xl"
      )}
    >
      <GripVertical className="size-5 shrink-0 opacity-45" aria-hidden="true" />
      <span
        className={cn(
          "min-w-0 flex-1 text-center font-bold leading-snug break-words",
          isFullTestament ? "text-sm sm:text-base" : "text-sm sm:text-lg"
        )}
      >
        {book.name}
      </span>
      {isHinted ? (
        <Lightbulb className="size-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
      ) : null}
      <span className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-current opacity-10" aria-hidden="true" />
    </button>
  );
}
