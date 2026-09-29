import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SessionEndReason } from "../model/trainer.types";

export function FinishedBanner({ reason, total }: { reason: SessionEndReason | null; total: number }) {
  const { t } = useTranslation();
  if (!reason) return null;
  return (
    <Alert>
      <AlertDescription>
        {reason === "time" ? t("powersTenT.finished.time") : t("powersTenT.finished.exercises", { count: total })}
      </AlertDescription>
    </Alert>
  );
}
