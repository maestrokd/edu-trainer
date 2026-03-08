import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { HistoryItem } from "../model/trainer.types";

interface HistoryTableProps {
  history: HistoryItem[];
  labels: {
    exampleColumn: string;
    answerColumn: string;
    resultColumn: string;
    emptyText: string;
    correctResultText: string;
    incorrectResultText: (correctAnswer: number) => string;
    correctAria: string;
    wrongAria: string;
  };
}

export function HistoryTable({ history, labels }: HistoryTableProps) {
  return (
    <div className="h-full overflow-auto rounded-xl border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted">
          <TableRow>
            <TableHead className="px-4 text-center">{labels.exampleColumn}</TableHead>
            <TableHead className="px-4 text-center">{labels.answerColumn}</TableHead>
            <TableHead className="px-4 text-center">{labels.resultColumn}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell className="px-4 py-3 text-muted-foreground" colSpan={3}>
                {labels.emptyText}
              </TableCell>
            </TableRow>
          ) : (
            history.map((h, idx) => {
              const correctAnswer = h.op === "mul" ? h.a * h.b : Math.floor(h.a / h.b);
              return (
                <TableRow key={idx} className="border-t">
                  <TableCell className="px-4 py-2 text-center whitespace-nowrap">
                    {h.a} {h.op === "mul" ? "×" : "÷"} {h.b}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">{h.answer}</TableCell>
                  <TableCell className="px-4 py-2 align-top">
                    {h.correct ? (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <span role="img" aria-label={labels.correctAria}>
                          ✅
                        </span>
                        {labels.correctResultText}
                      </span>
                    ) : (
                      <div className="text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                        <span className="inline-flex items-center gap-1">
                          <span role="img" aria-label={labels.wrongAria}>
                            ❌
                          </span>
                          {labels.incorrectResultText(correctAnswer)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
