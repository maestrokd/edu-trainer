import { CheckCircle2, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HistoryItem } from "../model/trainer.types";

export function HistoryTable({ history, tr }: { history: HistoryItem[]; tr: any }) {
  return (
    <div className="trainer-history-table h-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted">
          <TableRow>
            <TableHead className="px-4 text-center">{tr("table.example")}</TableHead>
            <TableHead className="px-4 text-center">{tr("table.answer")}</TableHead>
            <TableHead className="px-4 text-center">{tr("table.result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="px-4 py-3 text-muted-foreground text-center">
                {tr("table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            history.map((row) => (
              <TableRow key={row.id} className="border-t">
                <TableCell className="px-4 py-2 text-center whitespace-nowrap">{row.prompt}</TableCell>
                <TableCell className="px-4 py-2 text-center">{row.userAnswer || "—"}</TableCell>
                <TableCell className="px-4 py-2 align-top">
                  {row.isCorrect ? (
                    <span className="trainer-history-result-ok inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="size-4" aria-hidden />
                      {tr("table.correct")}
                    </span>
                  ) : (
                    <div className="trainer-history-result-bad text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="size-4" aria-hidden />
                        {tr("table.incorrect", {
                          correct: row.correctAnswer,
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
