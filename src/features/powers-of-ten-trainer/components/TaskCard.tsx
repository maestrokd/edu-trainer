import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { DecimalValue, TaskState } from "../model/trainer.types";
import { AnswerInput } from "./AnswerInput";
import { PowerFactor } from "./PowerFactor";
import { QuizOptions } from "./QuizOptions";

interface Props {
  task: TaskState;
  answerMode: "quiz" | "input";
  showHint: boolean;
  disabled: boolean;
  inputValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  lastAnswer: DecimalValue | null;
  lastCorrect: boolean | null;
  formatValue: (value: DecimalValue, preserveScale?: boolean) => string;
  formatInteger: (value: number) => string;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onAnswer: (value: DecimalValue) => void;
}

export function TaskCard({
  task,
  answerMode,
  showHint,
  disabled,
  inputValue,
  inputRef,
  lastAnswer,
  lastCorrect,
  formatValue,
  formatInteger,
  onInputChange,
  onInputSubmit,
  onAnswer,
}: Props) {
  const { t } = useTranslation();
  const operator = task.operation === "multiply" ? "×" : "÷";
  const direction = task.operation === "multiply" ? t("powersTenT.hint.right") : t("powersTenT.hint.left");

  return (
    <div className="text-center">
      <div className="select-none text-3xl font-semibold tracking-wide sm:text-5xl">
        {formatValue(task.left, task.operation === "multiply" && task.numberType === "decimal")}{" "}
        <span aria-hidden>{operator}</span>
        <span className="sr-only">
          {t(task.operation === "multiply" ? "powersTenT.sr.multiply" : "powersTenT.sr.divide")}
        </span>{" "}
        <PowerFactor
          power={task.power}
          notation={task.notation}
          powerAriaLabel={t("powersTenT.sr.power", { power: task.power })}
          formatInteger={formatInteger}
        />{" "}
        =
      </div>
      {showHint && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("powersTenT.hint.template", { direction, count: task.power })}
        </p>
      )}
      <div className="mt-4 flex w-full items-center justify-center gap-3">
        {answerMode === "input" ? (
          <AnswerInput
            value={inputValue}
            inputRef={inputRef}
            disabled={disabled}
            onChange={onInputChange}
            onSubmit={onInputSubmit}
            labels={{
              placeholder: t("powersTenT.input.placeholder"),
              submit: t("powersTenT.input.submit"),
              hint: t("powersTenT.input.hint"),
            }}
          />
        ) : (
          <QuizOptions
            taskId={task.taskId}
            options={task.options}
            disabled={disabled}
            formatValue={formatValue}
            onSelect={onAnswer}
            optionAria={(value) => t("powersTenT.quiz.optionAria", { value })}
          />
        )}
      </div>
      <div className="mt-4 min-h-7 text-lg sm:text-xl" aria-live="polite" aria-atomic="true">
        {lastAnswer && lastCorrect != null && (
          <span className="inline-flex items-center gap-2">
            <span className="font-medium">{formatValue(lastAnswer)}</span>
            <span role="img" aria-label={t(lastCorrect ? "powersTenT.aria.correct" : "powersTenT.aria.wrong")}>
              {lastCorrect ? "✅" : "❌"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
