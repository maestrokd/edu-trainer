import { BookOpen, Home } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useBibleBooksQuiz } from "../hooks/useBibleBooksQuiz";
import { GameSetup } from "./GameSetup";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResults } from "./QuizResults";

export function BibleBooksGame() {
  const { t } = useTranslation();
  const { state, actions } = useBibleBooksQuiz();

  return (
    <div className="min-h-dvh bg-muted/25 text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span>{t("bibleBooksGame.title")}</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/" aria-label={t("bibleBooksGame.header.mainMenuAria")}>
              <Home aria-hidden="true" />
              <span className="hidden sm:inline">{t("bibleBooksGame.actions.mainMenu")}</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
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
