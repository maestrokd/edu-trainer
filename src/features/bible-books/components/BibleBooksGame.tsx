import { useEffect, useRef } from "react";
import { BookOpen, Home, Info } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useBibleBooksQuiz } from "../hooks/useBibleBooksQuiz";
import { GameSetup } from "./GameSetup";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResults } from "./QuizResults";

export function BibleBooksGame() {
  const { t } = useTranslation();
  const { state, actions } = useBibleBooksQuiz();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [state.currentQuestionIndex, state.phase]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground sm:bg-muted/25">
      <header className="shrink-0 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-3xl items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:size-9">
              <BookOpen className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <span>{t("bibleBooksGame.title")}</span>
          </div>
          <div className="flex items-center gap-1">
            {state.phase === "setup" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 sm:hidden"
                    aria-label={t("bibleBooksGame.setup.infoAria")}
                  >
                    <Info aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-1rem)] p-2">
                  <DropdownMenuLabel>{t("bibleBooksGame.setup.title")}</DropdownMenuLabel>
                  <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">
                    {t("bibleBooksGame.setup.description")}
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button asChild variant="ghost" size="sm" className="h-10 w-10 px-0 sm:h-8 sm:w-auto sm:px-3">
              <Link to="/" aria-label={t("bibleBooksGame.header.mainMenuAria")}>
                <Home aria-hidden="true" />
                <span className="hidden sm:inline">{t("bibleBooksGame.actions.mainMenu")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto sm:px-6 sm:py-10">
        {state.phase === "setup" && (
          <GameSetup
            selectedPracticeSet={state.selectedPracticeSet}
            selectedBibleLanguage={state.selectedBibleLanguage}
            onPracticeSetChange={actions.setSelectedPracticeSet}
            onBibleLanguageChange={actions.setSelectedBibleLanguage}
            onStart={actions.startRound}
          />
        )}

        {state.phase === "playing" && state.currentQuestion && (
          <QuizQuestion
            question={state.currentQuestion}
            questionNumber={state.currentQuestionIndex + 1}
            totalQuestions={state.questions.length}
            score={state.correctAnswers}
            selectedAnswerId={state.selectedAnswerId}
            isAnswerCorrect={state.isCurrentAnswerCorrect}
            onSelectAnswer={actions.selectAnswer}
            onNextQuestion={actions.nextQuestion}
          />
        )}

        {state.phase === "complete" && (
          <QuizResults
            correctAnswers={state.correctAnswers}
            totalQuestions={state.questions.length}
            missedQuestions={state.missedQuestions.length}
            onPlayAgain={actions.startRound}
            onChangePracticeSet={actions.changePracticeSet}
          />
        )}
      </main>
    </div>
  );
}
