import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HistoryItem, TargetPlace } from "../model/trainer.types";

interface HistoryTableProps {
  history: HistoryItem[];
  formatNumber: (value: number) => string;
}

function targetLabel(place: TargetPlace, t: (key: string, options?: Record<string, unknown>) => string): string {
  const key = place === 10 ? "tens" : place === 100 ? "hundreds" : "thousands";
  return t(`roundT.expl.target.${key}`);
}

export function HistoryTable({ history, formatNumber }: HistoryTableProps) {
  const { t } = useTranslation();

  return (
    <div className="trainer-history-table h-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted">
          <TableRow>
            <TableHead className="px-4 text-center">{t("roundT.table.example")}</TableHead>
            <TableHead className="px-4 text-center">{t("roundT.table.answer")}</TableHead>
            <TableHead className="px-4 text-center">{t("roundT.table.result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell className="px-4 py-3 text-muted-foreground" colSpan={3}>
                {t("roundT.table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            history.map((item, index) => (
              <TableRow key={index} className="border-t">
                <TableCell className="px-2 sm:px-4 py-2 text-center">
                  <span className="hidden sm:inline whitespace-nowrap">
                    {formatNumber(item.original)} → {targetLabel(item.target, t)}
                  </span>
                  <span className="inline sm:hidden leading-tight whitespace-normal">
                    <span className="block">{formatNumber(item.original)}</span>
                    <span className="block">→ {targetLabel(item.target, t)}</span>
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2 text-center">{formatNumber(item.user)}</TableCell>
                <TableCell className="px-4 py-2 align-top">
                  {item.correct ? (
                    <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                      <span role="img" aria-label={t("roundT.aria.correct")}>
                        ✅
                      </span>
                      {t("roundT.table.correct")}
                    </span>
                  ) : (
                    <div className="trainer-history-result-bad text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                      <span className="inline-flex items-center gap-1">
                        <span role="img" aria-label={t("roundT.aria.wrong")}>
                          ❌
                        </span>
                        {t("roundT.table.incorrect", {
                          explanation: item.explanation,
                          correct: formatNumber(item.correctRounded),
                        })}
                      </span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
