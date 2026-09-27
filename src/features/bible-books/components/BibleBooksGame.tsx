import { BookOpen, Home } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

import { useBibleBooksQuiz } from "../hooks/useBibleBooksQuiz";
import { GameSetup } from "./GameSetup";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResults } from "./QuizResults";

export function BibleBooksGame() {
  const { state, actions } = useBibleBooksQuiz();

  return (
    <div className="min-h-dvh bg-muted/25 text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span>Bible Books</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/" aria-label="Back to the Edu Trainer menu">
              <Home aria-hidden="true" />
              <span className="hidden sm:inline">Main Menu</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {state.phase === "setup" && (
          <GameSetup
            selectedPracticeSet={state.selectedPracticeSet}
            onPracticeSetChange={actions.setSelectedPracticeSet}
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
