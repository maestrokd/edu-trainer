const BOOK_TONES = [
  "border-l-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/60 dark:text-sky-50",
  "border-l-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/60 dark:text-rose-50",
  "border-l-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/60 dark:text-amber-50",
  "border-l-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-50",
  "border-l-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950/60 dark:text-violet-50",
] as const;

export function getBookTone(order: number): string {
  return BOOK_TONES[(order - 1) % BOOK_TONES.length];
}
