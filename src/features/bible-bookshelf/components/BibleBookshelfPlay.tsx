import { DragDropProvider } from "@dnd-kit/react";
import { BookOpen, CheckCircle2, Languages, Lightbulb, PartyPopper, RotateCcw, Settings2, Sprout } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BibleBook } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import type { BibleBookshelfGroup } from "../data/learning-groups";
import type { useBibleBookshelfGame } from "../hooks/useBibleBookshelfGame";
import { BookCard } from "./BookCard";
import { Bookshelf } from "./Bookshelf";
import { GameProgress } from "./GameProgress";
import "./bible-bookshelf.css";

type BibleBookshelfGameController = ReturnType<typeof useBibleBookshelfGame>;

interface BibleBookshelfPlayProps {
  game: BibleBookshelfGameController;
}

const LANGUAGE_NAMES = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
} as const;

function parseDragId(id: string | number | undefined, prefix: string): string | null {
  const value = String(id ?? "");
  return value.startsWith(prefix) ? value.slice(prefix.length) : null;
}

function scrollToChild(containerId: string, childId: string, smooth: boolean) {
  const container = document.getElementById(containerId);
  const child = document.getElementById(childId);
  if (!container || !child || typeof container.scrollTo !== "function") return;

  const left = child.offsetLeft - container.clientWidth / 2 + child.clientWidth / 2;
  container.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" });
}

export function BibleBookshelfPlay({ game }: BibleBookshelfPlayProps) {
  const { t } = useTranslation();
  const { state, data, actions } = game;
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const instructionRef = useRef<HTMLHeadingElement>(null);
  const completionActionRef = useRef<HTMLButtonElement>(null);
  const previousRoundIdRef = useRef(-1);
  const isFullTestament = state.config.mode === "testament";

  const getGroupLabel = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.label`);
  const getGroupTip = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.tip`);
  const testamentKey = state.config.testament === "OLD" ? "old" : "new";
  const scopeLabel = isFullTestament
    ? t(`bibleBookshelf.setup.testament.${testamentKey}.name`)
    : getGroupLabel(data.selectedGroup);
  const scopeDescription = isFullTestament
    ? t("bibleBookshelf.testament.description", { count: state.roundBookIds.length })
    : t("bibleBookshelf.groups.range", {
        start: data.selectedGroupBooks[0]?.name ?? "",
        end: data.selectedGroupBooks.at(-1)?.name ?? "",
      });
  const learningTip = isFullTestament
    ? t(`bibleBookshelf.testament.${testamentKey}Tip`, {
        first: data.selectedTestamentBooks[0]?.name ?? "",
        last: data.selectedTestamentBooks.at(-1)?.name ?? "",
      })
    : getGroupTip(data.selectedGroup);

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
        completionActionRef.current?.focus({ preventScroll: true });
        return;
      }

      const focusBookId = state.feedback?.kind === "incorrect" ? state.feedback.bookId : state.trayBookIds[0];
      if (focusBookId) document.getElementById(`bookshelf-book-${focusBookId}`)?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [state.feedback, state.isComplete, state.trayBookIds]);

  useEffect(() => {
    if (!isFullTestament || state.hintBookId === null || state.hintSlotIndex === null) return;
    const timeout = window.setTimeout(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollToChild("bookshelf-scroll", `bookshelf-slot-${state.hintSlotIndex}`, !prefersReducedMotion);
      scrollToChild("bookshelf-tray-scroll", `bookshelf-book-${state.hintBookId}`, !prefersReducedMotion);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isFullTestament, state.hintBookId, state.hintSlotIndex]);

  const getBook = (bookId: string | undefined): BibleBook | null =>
    bookId ? (data.booksById.get(bookId) ?? null) : null;
  const feedbackBook = getBook(state.feedback?.bookId);

  const requestSetup = () => {
    if (data.hasProgress && !state.isComplete) {
      setIsLeaveDialogOpen(true);
      return;
    }
    actions.returnToSetup();
  };

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-8">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0 max-w-3xl space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <BookOpen className="size-3.5" aria-hidden="true" />
              {scopeLabel}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Languages className="size-3.5" aria-hidden="true" />
              {LANGUAGE_NAMES[state.config.bibleLanguage]}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("bibleBookshelf.title")}</h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{scopeDescription}</p>
        </div>
        <Button variant="outline" onClick={requestSetup}>
          <Settings2 aria-hidden="true" />
          {t("bibleBookshelf.actions.changeSetup")}
        </Button>
      </section>

      <Card className="min-w-0 gap-0 overflow-hidden border-amber-200/70 py-0 shadow-xl dark:border-amber-900/60">
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
                  {t(isFullTestament ? "bibleBookshelf.instruction.testamentBody" : "bibleBookshelf.instruction.body")}
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

        <CardContent className="min-w-0 space-y-5 bg-gradient-to-b from-amber-50/50 to-card px-3 py-5 dark:from-amber-950/10 sm:px-6">
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
              compact={isFullTestament}
              placedBySlot={state.placedBySlot}
              selectedBookId={state.selectedBookId}
              hintSlotIndex={state.hintSlotIndex}
              incorrectSlotIndex={state.feedback?.kind === "incorrect" ? state.feedback.slotIndex : null}
              onAttemptPlacement={actions.attemptPlacement}
              labels={{
                region: t("bibleBookshelf.aria.shelf"),
                scrollHint: t(
                  isFullTestament ? "bibleBookshelf.aria.fullShelfScrollHint" : "bibleBookshelf.aria.scrollHint"
                ),
                empty: t("bibleBookshelf.shelf.empty"),
                filled: (position, book) => t("bibleBookshelf.aria.filledSlot", { position, book }),
                emptyPosition: (position) => t("bibleBookshelf.aria.emptySlot", { position }),
                hinted: t("bibleBookshelf.aria.hintedSlot"),
              }}
            />

            <section aria-labelledby="book-tray-heading" className="min-w-0 space-y-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 id="book-tray-heading" className="text-lg font-bold">
                    {state.isComplete ? t("bibleBookshelf.complete.title") : t("bibleBookshelf.tray.title")}
                  </h3>
                  {!state.isComplete ? <p className="text-sm text-muted-foreground">{scopeDescription}</p> : null}
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
                    {t(isFullTestament ? "bibleBookshelf.complete.testamentDetail" : "bibleBookshelf.complete.detail", {
                      count: state.roundBookIds.length,
                    })}
                  </AlertDescription>
                  <div className="col-start-2 mt-3 flex flex-wrap gap-2">
                    <Button ref={completionActionRef} onClick={isFullTestament ? actions.playAgain : actions.nextRound}>
                      {t(isFullTestament ? "bibleBookshelf.actions.playAgain" : "bibleBookshelf.actions.nextRound")}
                    </Button>
                    {isFullTestament ? (
                      <Button variant="outline" onClick={actions.returnToSetup}>
                        {t("bibleBookshelf.actions.changeSetup")}
                      </Button>
                    ) : null}
                  </div>
                </Alert>
              ) : isFullTestament ? (
                <div className="space-y-2">
                  <p className="text-center text-xs font-medium text-muted-foreground">
                    {t("bibleBookshelf.tray.scrollHint")}
                  </p>
                  <div
                    id="bookshelf-tray-scroll"
                    data-testid="bookshelf-tray-scroll"
                    className="max-w-full overflow-x-auto overscroll-x-contain pb-2"
                  >
                    <div className="bible-bookshelf-full-tray-grid w-max min-w-full gap-3">
                      {data.trayBooks.map((book) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          compact
                          isSelected={state.selectedBookId === book.id}
                          isHinted={state.hintBookId === book.id}
                          onSelect={actions.selectBook}
                          selectedLabel={t("bibleBookshelf.aria.selected")}
                          hintLabel={t("bibleBookshelf.aria.hintedBook")}
                        />
                      ))}
                    </div>
                  </div>
                </div>
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
              <span className="font-bold">{t("bibleBookshelf.tipLabel")}</span> {learningTip}
            </p>
          </aside>
        </CardContent>
      </Card>

      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("bibleBookshelf.leave.title")}</DialogTitle>
            <DialogDescription>{t("bibleBookshelf.leave.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
              {t("bibleBookshelf.actions.keepPlaying")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsLeaveDialogOpen(false);
                actions.returnToSetup();
              }}
            >
              {t("bibleBookshelf.actions.leaveRound")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
