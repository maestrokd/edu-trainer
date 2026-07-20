import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnswerFormat, Encounter } from "../../model/game.types";
import { QuizOptions } from "./QuizOptions";
import { AnswerInput } from "./AnswerInput";

interface EncounterPanelProps {
  encounter: Encounter;
  format: AnswerFormat;
  onAnswer: (value: number) => void;
  /** stationId -2 marks the pre-boss review volley */
  isReview?: boolean;
}

const KIND_EMOJI: Record<Encounter["kind"], string> = {
  "forge-anvil": "⚒️",
  "armor-scroll": "📜",
  "practice-creature": "🛡️",
  "boss-scroll": "📜",
  "practice-boss": "👑",
};

/**
 * The question surface for every stop. It overlays a fully frozen world:
 * no countdown, no moving threat — the child owns the clock (§1/§6.9).
 */
export function EncounterPanel({ encounter, format, onAnswer, isReview }: EncounterPanelProps) {
  const { t } = useTranslation();
  const problem = encounter.problems[encounter.index];
  if (!problem) return null;

  const result = encounter.results[encounter.index];
  const answered = result !== null;
  const problemKey = `${encounter.stationId}-${encounter.index}`;
  const title = isReview ? t("timesTableKnight.encounter.review") : t(`timesTableKnight.encounter.${encounter.kind}`);
  const hint = isReview ? null : t(`timesTableKnight.encounter.${encounter.kind}Hint`);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 rounded-xl p-3">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-3">
          <div className="text-center">
            <div className="font-semibold text-lg">
              {KIND_EMOJI[encounter.kind]} {title}
            </div>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>

          {encounter.problems.length > 1 && (
            <div
              className="flex gap-1.5"
              aria-label={t("timesTableKnight.encounter.problemOf", {
                current: encounter.index + 1,
                total: encounter.problems.length,
              })}
            >
              {encounter.results.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-2.5 rounded-full",
                    r === true ? "bg-green-500" : r === false ? "bg-red-500" : i === encounter.index ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}

          <div className="text-4xl sm:text-5xl font-bold tabular-nums" aria-live="polite">
            {problem.fact.a} × {problem.fact.b} = {answered ? problem.answer : "?"}
          </div>

          <div
            className={cn("min-h-7 text-lg font-semibold flex items-center gap-1", !answered && "invisible")}
            role="status"
          >
            {result === true && <span className="text-green-600 dark:text-green-400">✔ {t("timesTableKnight.encounter.correct")}</span>}
            {result === false && (
              <span className="text-red-600 dark:text-red-400">
                ✘ {t("timesTableKnight.encounter.wrong", { answer: problem.answer })}
              </span>
            )}
          </div>

          {format === "mcq" ? (
            <QuizOptions options={problem.options} onSelect={onAnswer} disabled={answered} problemKey={problemKey} />
          ) : (
            <AnswerInput onSubmit={onAnswer} disabled={answered} problemKey={problemKey} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
