import { useEffect, useRef } from "react";
import { BookOpen, RotateCcw, Settings2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizResultsProps {
  correctAnswers: number;
  totalQuestions: number;
  missedQuestions: number;
  onPlayAgain: () => void;
  onChangePracticeSet: () => void;
}

export function QuizResults({
  correctAnswers,
  totalQuestions,
  missedQuestions,
  onPlayAgain,
  onChangePracticeSet,
}: QuizResultsProps) {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Card className="gap-3 overflow-hidden rounded-none border-0 bg-transparent py-0 text-center shadow-none sm:gap-6 sm:rounded-xl sm:border sm:border-border/80 sm:bg-card sm:py-6 sm:shadow-md">
      <CardHeader className="items-center gap-2 border-b bg-muted/35 px-3 py-4 sm:gap-4 sm:px-8 sm:py-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm sm:size-16">
          <Trophy className="size-6 sm:size-8" aria-hidden="true" />
        </div>
        <Badge variant="secondary" className="sr-only gap-1.5 sm:not-sr-only sm:flex">
          <BookOpen aria-hidden="true" />
          {t("bibleBooksGame.title")}
        </Badge>
        <div className="space-y-2">
          <CardTitle>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none sm:text-4xl">
              {t("bibleBooksGame.results.title")}
            </h1>
          </CardTitle>
          <CardDescription className="sr-only sm:not-sr-only sm:text-base">
            {t("bibleBooksGame.results.description")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:space-y-5 sm:px-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("bibleBooksGame.results.youGot")}</p>
          <p
            className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl"
            aria-label={t("bibleBooksGame.results.scoreAria", { correct: correctAnswers, total: totalQuestions })}
          >
            {correctAnswers}{" "}
            <span className="text-2xl text-muted-foreground">
              {t("bibleBooksGame.results.outOf", { total: totalQuestions })}
            </span>
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{t("bibleBooksGame.results.correct")}</p>
        </div>
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {missedQuestions === 0
            ? t("bibleBooksGame.results.perfect")
            : t("bibleBooksGame.results.missed", { count: missedQuestions })}
        </p>
      </CardContent>

      <CardFooter className="grid gap-2 px-3 pb-3 sm:grid-cols-2 sm:gap-3 sm:px-8 sm:pb-0">
        <Button size="lg" className="h-11 text-sm sm:h-12 sm:text-base" onClick={onPlayAgain}>
          <RotateCcw aria-hidden="true" />
          {t("bibleBooksGame.actions.playAgain")}
        </Button>
        <Button size="lg" variant="outline" className="h-11 text-sm sm:h-12 sm:text-base" onClick={onChangePracticeSet}>
          <Settings2 aria-hidden="true" />
          {t("bibleBooksGame.actions.changePracticeSet")}
        </Button>
      </CardFooter>
    </Card>
  );
}
