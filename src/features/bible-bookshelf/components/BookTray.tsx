import type { BibleBook } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import type { BibleBookshelfMode } from "../lib/game";
import { BookCard } from "./BookCard";

interface BookTrayProps {
  books: BibleBook[];
  layout: BibleBookshelfMode;
  selectedBookId: string | null;
  hintBookId: string | null;
  onSelect: (bookId: string) => void;
  labels: {
    title: string;
    scrollHint: string;
    selected: string;
    hinted: string;
  };
}

export function BookTray({ books, layout, selectedBookId, hintBookId, onSelect, labels }: BookTrayProps) {
  const isFullTestament = layout === "testament";

  return (
    <section aria-labelledby="book-tray-heading" className="min-w-0 space-y-2 sm:space-y-3">
      <h2 id="book-tray-heading" className="px-2 text-base font-bold sm:px-0 sm:text-lg">
        {labels.title}
      </h2>

      <div className="space-y-2">
        <p className={cn("text-center text-xs font-medium text-muted-foreground", !isFullTestament && "sm:hidden")}>
          {labels.scrollHint}
        </p>
        <div
          id="bookshelf-tray-scroll"
          data-testid="bookshelf-tray-scroll"
          className={cn(
            "max-w-full overflow-x-auto overscroll-x-contain pb-2",
            !isFullTestament && "sm:overflow-x-visible sm:pb-0"
          )}
        >
          <div
            className={cn(
              "gap-3",
              isFullTestament ? "bible-bookshelf-full-tray-grid" : "bible-bookshelf-group-tray-grid"
            )}
          >
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                layout={layout}
                isSelected={selectedBookId === book.id}
                isHinted={hintBookId === book.id}
                onSelect={onSelect}
                selectedLabel={labels.selected}
                hintLabel={labels.hinted}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
