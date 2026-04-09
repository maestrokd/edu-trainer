import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HistoryEntry, HistoryOrder } from "../model/trainer.types";
import { relationLabel } from "../lib/format";

type Translator = (key: string, options?: Record<string, unknown>) => string | null;

interface CompareNumbersHistoryTableProps {
  history: HistoryEntry[];
  historyDisplay: HistoryEntry[];
  historyOrder: HistoryOrder;
  tr: Translator;
}

export function CompareNumbersHistoryTable({
  history,
  historyDisplay,
  historyOrder,
  tr,
}: CompareNumbersHistoryTableProps) {
  return (
    <aside className="trainer-history-table compare-history-table h-full overflow-hidden rounded-xl border bg-muted/40">
      <div className="compare-history-table__header flex items-center justify-between border-b bg-muted/60 px-4 py-3">
        <div className="text-base font-semibold">{tr("history.title")}</div>
        <span className="text-xs text-muted-foreground">{tr("history.total", { count: history.length })}</span>
      </div>

      <div className="h-[420px] overflow-auto">
        <Table>
          <TableHeader className="compare-history-table__head sticky top-0 bg-muted/70 backdrop-blur">
            <TableRow>
              <TableHead className="w-10 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">{tr("history.example")}</TableHead>
              <TableHead className="text-xs">{tr("history.answer")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                  {tr("history.empty")}
                </TableCell>
              </TableRow>
            ) : (
              historyDisplay.map((entry, index) => (
                <TableRow
                  key={entry.id}
                  className={entry.isCorrect ? "" : "compare-history-row-incorrect bg-destructive/5"}
                >
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {historyOrder === "asc" ? index + 1 : history.length - index}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium leading-tight">
                      {entry.left.display} ? {entry.right.display}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tr("history.correct", {
                        relation: relationLabel(entry.correctRelation, tr),
                        left: entry.left.display,
                        right: entry.right.display,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.isCorrect ? (
                      <div className="trainer-history-result-ok text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {tr("history.result.correct", {
                          relation: relationLabel(entry.userRelation, tr),
                        })}
                      </div>
                    ) : (
                      <div className="trainer-history-result-bad grid gap-1 text-sm text-destructive">
                        <span>
                          {tr("history.result.user", {
                            relation: relationLabel(entry.userRelation, tr),
                          })}
                        </span>
                        <span>
                          {tr("history.result.expected", {
                            relation: relationLabel(entry.correctRelation, tr),
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
    </aside>
  );
}
