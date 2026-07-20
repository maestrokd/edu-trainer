import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FactResult } from "../../model/game.types";
import { factKey } from "../../lib/leitner";

interface FactBreakdownTableProps {
  factLog: FactResult[];
}

interface FactRow {
  key: string;
  label: string;
  answer: number;
  attempts: boolean[];
}

/** per-fact attempts in first-seen order — a ✘→✔ row shows learning happening */
export function FactBreakdownTable({ factLog }: FactBreakdownTableProps) {
  const { t } = useTranslation();
  if (factLog.length === 0) return null;

  const rows = new Map<string, FactRow>();
  for (const { fact, correct } of factLog) {
    const key = factKey(fact);
    const row = rows.get(key) ?? {
      key,
      label: `${fact.a} × ${fact.b}`,
      answer: fact.a * fact.b,
      attempts: [],
    };
    row.attempts.push(correct);
    rows.set(key, row);
  }

  return (
    <div className="w-full max-h-56 overflow-y-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("timesTableKnight.results.factTable.fact")}</TableHead>
            <TableHead className="text-right">{t("timesTableKnight.results.factTable.result")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...rows.values()].map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium tabular-nums">
                {row.label} = {row.answer}
              </TableCell>
              <TableCell className="text-right">
                <span
                  aria-label={
                    row.attempts.every(Boolean)
                      ? t("timesTableKnight.results.factTable.correct")
                      : t("timesTableKnight.results.factTable.wrong")
                  }
                >
                  {row.attempts.map((ok, i) => (
                    <span key={i} className={ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {ok ? " ✔" : " ✘"}
                    </span>
                  ))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
