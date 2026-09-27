import { DragDropProvider } from "@dnd-kit/react";
import { BookOpen, CheckCircle2, Home, Lightbulb, PartyPopper, RotateCcw, Sprout } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BibleBook } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import type { BibleBookshelfGroup } from "../data/learning-groups";
import { useBibleBookshelfGame } from "../hooks/useBibleBookshelfGame";
import { BookCard } from "./BookCard";
import { Bookshelf } from "./Bookshelf";
import { GameProgress } from "./GameProgress";
import { LearningGroupSelect } from "./LearningGroupSelect";

function parseDragId(id: string | number | undefined, prefix: string): string | null {
  const value = String(id ?? "");
  return value.startsWith(prefix) ? value.slice(prefix.length) : null;
}

export function BibleBookshelfGame() {
  const { t } = useTranslation();
  const { state, data, actions } = useBibleBookshelfGame();
  const instructionRef = useRef<HTMLHeadingElement>(null);
  const nextRoundRef = useRef<HTMLButtonElement>(null);
  const previousRoundIdRef = useRef(state.roundId);

  const getGroupLabel = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.label`);
  const getGroupDescription = (group: BibleBookshelfGroup) =>
    t(`bibleBookshelf.groups.${group.translationKey}.description`);
  const getGroupTip = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.tip`);

  useEffect(() => {
    if (previousRoundIdRef.current === state.roundId) return;
    previousRoundIdRef.current = state.roundId;

    const timeout = window.setTimeout(() => {
      instructionRef.current?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.roundId]);

  useEffect(() => {
    if (!state.feedback) return;

    const timeout = window.setTimeout(() => {
      if (state.isComplete) {
        nextRoundRef.current?.focus({ preventScroll: true });
        return;
      }

      const focusBookId = state.feedback?.kind === "incorrect" ? state.feedback.bookId : state.trayBookIds[0];
      if (focusBookId) document.getElementById(`bookshelf-book-${focusBookId}`)?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.feedback, state.isComplete, state.trayBookIds]);

  const getBook = (bookId: string | undefined): BibleBook | null =>
    bookId ? (data.booksById.get(bookId) ?? null) : null;
  const feedbackBook = getBook(state.feedback?.bookId);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50/80 via-background to-sky-50/60 text-foreground dark:from-amber-950/20 dark:via-background dark:to-sky-950/20">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span>{t("bibleBookshelf.title")}</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/" aria-label={t("bibleBookshelf.aria.mainMenu")}>
              <Home aria-hidden="true" />
              <span className="hidden sm:inline">{t("bibleBookshelf.actions.mainMenu")}</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-2">
            <Badge variant="secondary" className="gap-1.5">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {getGroupLabel(data.selectedGroup)}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("bibleBookshelf.title")}</h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t("bibleBookshelf.subtitle")}</p>
          </div>
          <LearningGroupSelect
            groups={data.groups}
            selectedGroupId={state.groupId}
            onChange={actions.changeGroup}
            label={t("bibleBookshelf.chooseGroup")}
            getGroupLabel={getGroupLabel}
          />
        </section>

        <Card className="gap-0 overflow-hidden border-amber-200/70 py-0 shadow-xl dark:border-amber-900/60">
          <CardHeader className="border-b bg-card/95 px-4 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  1
                </span>
                <div>
                  <h2
                    ref={instructionRef}
                    tabIndex={-1}
                    className="text-xl font-bold tracking-tight outline-none sm:text-2xl"
                  >
                    {t("bibleBookshelf.instruction.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                    {t("bibleBookshelf.instruction.body")}
                  </p>
                </div>
              </div>
              <GameProgress
                correct={data.correctCount}
                total={state.roundBookIds.length}
                label={t("bibleBookshelf.progress.aria", {
                  correct: data.correctCount,
                  total: state.roundBookIds.length,
                })}
                valueLabel={t("bibleBookshelf.progress.value", {
                  correct: data.correctCount,
                  total: state.roundBookIds.length,
                })}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5 bg-gradient-to-b from-amber-50/50 to-card px-3 py-5 dark:from-amber-950/10 sm:px-6">
            <DragDropProvider
              onDragEnd={(event) => {
                if (event.canceled) return;
                const bookId = parseDragId(event.operation.source?.id, "book:");
                const slotId = parseDragId(event.operation.target?.id, "slot:");
                if (!bookId || slotId === null) return;
                const slotIndex = Number(slotId);
                if (Number.isInteger(slotIndex)) actions.attemptPlacement(bookId, slotIndex);
              }}
            >
              <Bookshelf
                roundBooks={data.roundBooks}
                placedBySlot={state.placedBySlot}
                selectedBookId={state.selectedBookId}
                hintSlotIndex={state.hintSlotIndex}
                incorrectSlotIndex={state.feedback?.kind === "incorrect" ? state.feedback.slotIndex : null}
                onAttemptPlacement={actions.attemptPlacement}
                labels={{
                  region: t("bibleBookshelf.aria.shelf"),
                  scrollHint: t("bibleBookshelf.aria.scrollHint"),
                  empty: t("bibleBookshelf.shelf.empty"),
                  filled: (position, book) => t("bibleBookshelf.aria.filledSlot", { position, book }),
                  emptyPosition: (position) => t("bibleBookshelf.aria.emptySlot", { position }),
                  hinted: t("bibleBookshelf.aria.hintedSlot"),
                }}
              />

              <section aria-labelledby="book-tray-heading" className="space-y-3">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 id="book-tray-heading" className="text-lg font-bold">
                      {state.isComplete ? t("bibleBookshelf.complete.title") : t("bibleBookshelf.tray.title")}
                    </h3>
                    {!state.isComplete ? (
                      <p className="text-sm text-muted-foreground">{getGroupDescription(data.selectedGroup)}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={actions.showHint} disabled={state.isComplete}>
                      <Lightbulb aria-hidden="true" />
                      {t("bibleBookshelf.actions.hint")}
                    </Button>
                    <Button variant="outline" onClick={actions.resetRound}>
                      <RotateCcw aria-hidden="true" />
                      {t("bibleBookshelf.actions.reset")}
                    </Button>
                  </div>
                </div>

                {state.isComplete ? (
                  <Alert
                    role="status"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                  >
                    <PartyPopper aria-hidden="true" />
                    <AlertTitle>{t("bibleBookshelf.complete.title")}</AlertTitle>
                    <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                      {t("bibleBookshelf.complete.detail")}
                    </AlertDescription>
                    <div className="col-start-2 mt-3">
                      <Button ref={nextRoundRef} onClick={actions.nextRound}>
                        {t("bibleBookshelf.actions.nextRound")}
                      </Button>
                    </div>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {data.trayBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        isSelected={state.selectedBookId === book.id}
                        isHinted={state.hintBookId === book.id}
                        onSelect={actions.selectBook}
                        selectedLabel={t("bibleBookshelf.aria.selected")}
                        hintLabel={t("bibleBookshelf.aria.hintedBook")}
                      />
                    ))}
                  </div>
                )}
              </section>
            </DragDropProvider>

            <div className="min-h-14" aria-live="polite" aria-atomic="true">
              {!state.isComplete && state.feedback && feedbackBook ? (
                <Alert
                  role="status"
                  className={cn(
                    state.feedback.kind === "correct"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                      : "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                  )}
                >
                  {state.feedback.kind === "correct" ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <Lightbulb aria-hidden="true" />
                  )}
                  <AlertTitle>
                    {state.feedback.kind === "correct"
                      ? t("bibleBookshelf.feedback.correctTitle")
                      : t("bibleBookshelf.feedback.incorrectTitle")}
                  </AlertTitle>
                  <AlertDescription className="text-current/80">
                    {state.feedback.kind === "correct"
                      ? t("bibleBookshelf.feedback.correctDetail", { book: feedbackBook.name })
                      : t("bibleBookshelf.feedback.incorrectDetail")}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>

            <aside className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100">
              <Sprout className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                <span className="font-bold">{t("bibleBookshelf.tipLabel")}</span> {getGroupTip(data.selectedGroup)}
              </p>
            </aside>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
