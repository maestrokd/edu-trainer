import { useDroppable } from "@dnd-kit/react";
import { Check, Lightbulb, LockKeyhole } from "lucide-react";

import type { BibleBook } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import { getBookTone } from "../lib/book-tones";

interface BookshelfSlotProps {
  slotIndex: number;
  book: BibleBook | null;
  selectedBookId: string | null;
  isHinted: boolean;
  isIncorrect: boolean;
  onAttemptPlacement: (bookId: string, slotIndex: number) => void;
  labels: {
    empty: string;
    filled: (position: number, book: string) => string;
    emptyPosition: (position: number) => string;
    hinted: string;
  };
}

function BookshelfSlot({
  slotIndex,
  book,
  selectedBookId,
  isHinted,
  isIncorrect,
  onAttemptPlacement,
  labels,
}: BookshelfSlotProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `slot:${slotIndex}`,
    type: "shelf-slot",
    accept: "book",
    disabled: book !== null,
  });
  const position = slotIndex + 1;

  if (book) {
    return (
      <div
        ref={ref}
        role="group"
        aria-label={labels.filled(position, book.name)}
        className={cn(
          "relative flex min-h-44 flex-col justify-end rounded-xl border border-l-8 p-3 text-center shadow-lg",
          getBookTone(book.order)
        )}
      >
        <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-sm font-bold text-foreground shadow-sm">
          {position}
        </span>
        <LockKeyhole className="absolute right-2 top-2 size-4 opacity-55" aria-hidden="true" />
        <span className="mb-4 text-base font-bold leading-snug break-words sm:text-lg">{book.name}</span>
        <span className="mx-auto flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={`${labels.emptyPosition(position)}${isHinted ? `, ${labels.hinted}` : ""}`}
      onClick={() => {
        if (selectedBookId) onAttemptPlacement(selectedBookId, slotIndex);
      }}
      className={cn(
        "relative flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-100/75 bg-black/10 px-3 text-amber-50 outline-none transition-[background-color,border-color,transform]",
        "hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:transform-none motion-reduce:transition-none",
        selectedBookId && "cursor-pointer border-white/80 bg-white/10",
        isDropTarget && "scale-[1.03] border-white bg-white/20",
        isHinted && "border-amber-300 bg-amber-300/20 ring-4 ring-amber-300/50",
        isIncorrect && "border-rose-300 bg-rose-400/20 motion-safe:animate-pulse"
      )}
    >
      <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-amber-950 shadow-sm">
        {position}
      </span>
      {isHinted ? <Lightbulb className="mb-2 size-6 text-amber-200" aria-hidden="true" /> : null}
      <span className="text-sm font-semibold">{labels.empty}</span>
    </button>
  );
}

interface BookshelfProps {
  roundBooks: BibleBook[];
  placedBySlot: Record<number, string>;
  selectedBookId: string | null;
  hintSlotIndex: number | null;
  incorrectSlotIndex: number | null;
  onAttemptPlacement: (bookId: string, slotIndex: number) => void;
  labels: BookshelfSlotProps["labels"] & { region: string; scrollHint: string };
}

export function Bookshelf({
  roundBooks,
  placedBySlot,
  selectedBookId,
  hintSlotIndex,
  incorrectSlotIndex,
  onAttemptPlacement,
  labels,
}: BookshelfProps) {
  const booksById = new Map(roundBooks.map((book) => [book.id, book]));

  return (
    <section aria-label={labels.region} className="space-y-2">
      <p className="text-center text-xs font-medium text-muted-foreground sm:hidden">{labels.scrollHint}</p>
      <div className="overflow-x-auto rounded-2xl pb-2 [scrollbar-color:rgb(180_83_9)_transparent]">
        <div className="min-w-[44rem] rounded-2xl border-[10px] border-amber-700 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-800 p-3 shadow-[inset_0_12px_24px_rgba(0,0,0,0.35),0_12px_30px_rgba(120,53,15,0.25)] dark:border-amber-900">
          <div className="grid grid-cols-5 gap-3">
            {roundBooks.map((_, slotIndex) => {
              const placedBookId = placedBySlot[slotIndex];
              return (
                <BookshelfSlot
                  key={slotIndex}
                  slotIndex={slotIndex}
                  book={placedBookId ? (booksById.get(placedBookId) ?? null) : null}
                  selectedBookId={selectedBookId}
                  isHinted={hintSlotIndex === slotIndex}
                  isIncorrect={incorrectSlotIndex === slotIndex}
                  onAttemptPlacement={onAttemptPlacement}
                  labels={labels}
                />
              );
            })}
          </div>
          <div className="mt-3 h-3 rounded-full bg-amber-600 shadow-[0_5px_0_rgb(146_64_14),inset_0_2px_2px_rgba(255,255,255,0.3)]" />
        </div>
      </div>
    </section>
  );
}
