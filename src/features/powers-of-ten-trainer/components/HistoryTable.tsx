import { useTranslation } from "react-i18next";
import { ResultHistoryTable } from "@/components/ui/result-history-table";
import type { DecimalValue, HistoryItem } from "../model/trainer.types";
import { PowerFactor } from "./PowerFactor";

interface Props {
  history: HistoryItem[];
  formatValue: (value: DecimalValue, preserveScale?: boolean) => string;
  formatInteger: (value: number) => string;
}

export function HistoryTable({ history, formatValue, formatInteger }: Props) {
  const { t } = useTranslation();
  return (
    <ResultHistoryTable
      rows={history}
      emptyText={t("powersTenT.table.empty")}
      getRowKey={(item) => item.id}
      columns={[
        {
          id: "example",
          role: "example",
          header: t("powersTenT.table.example"),
          renderCell: (item) => (
            <>
              {formatValue(item.task.left, item.task.operation === "multiply" && item.task.numberType === "decimal")}{" "}
              {item.task.operation === "multiply" ? "×" : "÷"}{" "}
              <PowerFactor
                power={item.task.power}
                notation={item.task.notation}
                powerAriaLabel={t("powersTenT.sr.power", { power: item.task.power })}
                formatInteger={formatInteger}
              />
            </>
          ),
        },
        {
          id: "answer",
          role: "answer",
          header: t("powersTenT.table.answer"),
          renderCell: (item) => formatValue(item.answer),
        },
        {
          id: "result",
          role: "result",
          header: t("powersTenT.table.result"),
          renderCell: (item) =>
            item.correct ? (
              <span className="inline-flex items-center gap-1 text-green-700">
                <span aria-hidden>✅</span>
                {t("powersTenT.table.correct")}
              </span>
            ) : (
              <span className="text-red-700">
                <span aria-hidden>❌</span>
                {t("powersTenT.table.incorrect", { correct: formatValue(item.task.correctAnswer, true) })}
              </span>
            ),
        },
      ]}
    />
  );
}
