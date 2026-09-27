import { useEffect, useRef } from "react";
import { ArrowDown, Check, ChevronRight, CircleHelp, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BibleBook, BibleBooksQuestion } from "../model/bible-books.types";

interface AnswerOptionProps {
  book: BibleBook;
  correctAnswerId: string;
  selectedAnswerId: string | null;
  onSelect: (answerId: string) => void;
}

function AnswerOption({ book, correctAnswerId, selectedAnswerId, onSelect }: AnswerOptionProps) {
  const { t } = useTranslation();
  const hasAnswered = selectedAnswerId !== null;
  const isCorrectAnswer = book.id === correctAnswerId;
  const isSelected = book.id === selectedAnswerId;
  const isSelectedIncorrect = hasAnswered && isSelected && !isCorrectAnswer;
  const showCorrectAnswer = hasAnswered && isCorrectAnswer;

  let answerLabel = book.name;
  if (showCorrectAnswer) answerLabel = t("bibleBooksGame.quiz.answerAria.correct", { book: book.name });
  if (isSelectedIncorrect) answerLabel = t("bibleBooksGame.quiz.answerAria.incorrect", { book: book.name });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={hasAnswered}
      aria-label={answerLabel}
      onClick={() => onSelect(book.id)}
      className={cn(
        "h-auto min-h-14 w-full justify-between whitespace-normal rounded-xl px-4 py-3 text-left text-base disabled:opacity-100",
        showCorrectAnswer &&
          "border-emerald-500 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
        isSelectedIncorrect && "border-destructive bg-destructive/10 text-destructive",
        hasAnswered && !showCorrectAnswer && !isSelectedIncorrect && "text-muted-foreground"
      )}
    >
      <span>{book.name}</span>
      {showCorrectAnswer && (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <Check className="size-4" aria-hidden="true" />
          {t("bibleBooksGame.quiz.correctAnswer")}
        </span>
      )}
      {isSelectedIncorrect && (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <X className="size-4" aria-hidden="true" />
          {t("bibleBooksGame.quiz.yourAnswer")}
        </span>
      )}
    </Button>
  );
}

interface QuizQuestionProps {
  question: BibleBooksQuestion;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  selectedAnswerId: string | null;
  isAnswerCorrect: boolean;
  onSelectAnswer: (answerId: string) => void;
  onNextQuestion: () => void;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  score,
  selectedAnswerId,
  isAnswerCorrect,
  onSelectAnswer,
  onNextQuestion,
}: QuizQuestionProps) {
  const { t } = useTranslation();
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const hasAnswered = selectedAnswerId !== null;
  const progress = (questionNumber / totalQuestions) * 100;
  const isLastQuestion = questionNumber === totalQuestions;

  useEffect(() => {
    questionHeadingRef.current?.focus({ preventScroll: true });
  }, [question.currentBook.id]);

  useEffect(() => {
    if (hasAnswered) nextButtonRef.current?.focus({ preventScroll: true });
  }, [hasAnswered]);

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="gap-4 border-b bg-muted/30 px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">
            {t("bibleBooksGame.quiz.questionCount", { current: questionNumber, total: totalQuestions })}
          </span>
          <Badge variant="secondary" aria-label={t("bibleBooksGame.quiz.scoreAria", { score })}>
            {t("bibleBooksGame.quiz.score", { score })}
          </Badge>
        </div>
        <div
          role="progressbar"
          aria-label={t("bibleBooksGame.quiz.progressAria", { current: questionNumber, total: totalQuestions })}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={questionNumber}
          className="h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-5 sm:px-8">
        <section className="rounded-2xl border bg-muted/25 px-4 py-7 text-center sm:py-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("bibleBooksGame.quiz.prompt")}
          </p>
          <h1
            ref={questionHeadingRef}
            tabIndex={-1}
            data-testid="current-book"
            className="mt-4 text-3xl font-bold tracking-tight outline-none sm:text-4xl"
          >
            {question.currentBook.name}
          </h1>
          <ArrowDown className="mx-auto my-3 size-5 text-muted-foreground" aria-hidden="true" />
          <CircleHelp className="mx-auto size-10 text-primary" aria-hidden="true" />
        </section>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-base font-semibold">{t("bibleBooksGame.quiz.chooseNext")}</legend>
          <div className="grid gap-3">
            {question.answerOptions.map((book) => (
              <AnswerOption
                key={book.id}
                book={book}
                correctAnswerId={question.correctNextBook.id}
                selectedAnswerId={selectedAnswerId}
                onSelect={onSelectAnswer}
              />
            ))}
          </div>
        </fieldset>

        {hasAnswered && (
          <div className="space-y-4" aria-live="polite">
            <Alert
              variant={isAnswerCorrect ? "default" : "destructive"}
              className={cn(
                isAnswerCorrect &&
                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              )}
            >
              {isAnswerCorrect ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              <AlertTitle>
                {isAnswerCorrect
                  ? t("bibleBooksGame.quiz.feedback.correct")
                  : t("bibleBooksGame.quiz.feedback.incorrect")}
              </AlertTitle>
              <AlertDescription className={cn(isAnswerCorrect && "text-emerald-800/90 dark:text-emerald-200/90")}>
                {t("bibleBooksGame.quiz.feedback.explanation", {
                  nextBook: question.correctNextBook.name,
                  currentBook: question.currentBook.name,
                })}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button
                ref={nextButtonRef}
                size="lg"
                className="h-12 w-full text-base sm:w-auto"
                onClick={onNextQuestion}
              >
                {isLastQuestion ? t("bibleBooksGame.actions.seeResults") : t("bibleBooksGame.actions.nextQuestion")}
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
