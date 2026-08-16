import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { RabbitQuizQuestion } from "../model/rabbit.types";

interface RabbitQuizPanelProps {
  quiz: RabbitQuizQuestion[];
  quizIndex: number;
  onAnswer: (value: number) => void;
}

export function RabbitQuizPanel({ quiz, quizIndex, onAnswer }: RabbitQuizPanelProps) {
  const { t } = useTranslation();
  const question = quiz[quizIndex];
  if (!question) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm">
      <section
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-xl"
        role="dialog"
        aria-labelledby="rabbit-quiz-title"
      >
        <h2 id="rabbit-quiz-title" className="text-xl font-bold">
          {t("rabbitGame.quiz.title", { count: quiz.length })}
        </h2>

        <div className="flex gap-1" aria-hidden>
          {quiz.map((item, index) => (
            <div
              key={`${item.a}-${item.b}`}
              className={`h-2 flex-1 rounded ${
                index < quizIndex
                  ? "bg-emerald-500"
                  : index === quizIndex && item.correct === false
                    ? "bg-red-500"
                    : index === quizIndex
                      ? "bg-primary"
                      : "bg-muted"
              }`}
            />
          ))}
        </div>

        <p className="text-lg font-medium">
          {question.a} × {question.b} = ?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((option) => {
            const selected = question.answer === option;
            const correct = selected && question.correct === true;
            const wrong = selected && question.correct === false;
            return (
              <Button
                key={option}
                type="button"
                variant="outline"
                onClick={() => onAnswer(option)}
                className={`h-11 text-lg font-semibold ${
                  correct
                    ? "border-emerald-500 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200"
                    : wrong
                      ? "border-red-500 bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
                      : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                aria-label={t("rabbitGame.quiz.answerAria", { answer: option })}
              >
                {option}
                {correct ? " ✅" : ""}
              </Button>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">{t("rabbitGame.quiz.tip")}</p>
      </section>
    </div>
  );
}
