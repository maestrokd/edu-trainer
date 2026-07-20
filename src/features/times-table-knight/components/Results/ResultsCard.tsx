import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionState } from "../../model/game.types";
import { selectSummary } from "../../model/game.selectors";
import { StarsBanner } from "./StarsBanner";
import { FactBreakdownTable } from "./FactBreakdownTable";

interface ResultsCardProps {
  state: SessionState;
  onRetry: () => void;
  onBackToSetup: () => void;
  /** Adventure victory below Level 15: jump straight into the next stage */
  onNextStage?: () => void;
}

export function ResultsCard({ state, onRetry, onBackToSetup, onNextStage }: ResultsCardProps) {
  const { t } = useTranslation();
  const summary = selectSummary(state);

  return (
    <Card className="w-full">
      <CardContent className="p-5 sm:p-6 flex flex-col items-center gap-4 text-center">
        <div className="text-2xl font-bold">
          {summary.gameCompleted
            ? `👑 ${t("timesTableKnight.results.gameComplete")}`
            : summary.victory
              ? `🏆 ${t("timesTableKnight.results.victory")}`
              : `💔 ${t("timesTableKnight.results.defeat")}`}
        </div>

        {summary.victory ? (
          <StarsBanner stars={summary.stars} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("timesTableKnight.results.defeatHint")}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm w-full max-w-xs">
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.accuracy")}</dt>
          <dd className="text-right font-semibold">{summary.accuracy}%</dd>
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.answered")}</dt>
          <dd className="text-right font-semibold">{summary.answered}</dd>
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.factsMastered")}</dt>
          <dd className="text-right font-semibold">{summary.factsMastered}</dd>
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.bestStreak")}</dt>
          <dd className="text-right font-semibold">{summary.bestStreak}</dd>
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.coins")}</dt>
          <dd className="text-right font-semibold">🪙 {summary.coins}</dd>
          <dt className="text-muted-foreground text-left">{t("timesTableKnight.results.score")}</dt>
          <dd className="text-right font-semibold tabular-nums">{summary.score}</dd>
        </dl>

        <div className="w-full">
          <h3 className="text-sm font-semibold text-left mb-1">{t("timesTableKnight.results.factTable.title")}</h3>
          <FactBreakdownTable factLog={state.factLog} />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {!summary.victory && <Button onClick={onRetry}>{t("timesTableKnight.results.retry")}</Button>}
          {summary.victory && onNextStage && !summary.gameCompleted && (
            <Button onClick={onNextStage}>{t("timesTableKnight.results.nextStage")}</Button>
          )}
          <Button variant="outline" onClick={onBackToSetup}>
            {t("timesTableKnight.results.backToSetup")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
