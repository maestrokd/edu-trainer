import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface FamilyTaskLoadingStateProps {
  message?: string;
}

interface FamilyTaskErrorStateProps {
  message: string;
  onRetry?: () => void;
}

interface FamilyTaskEmptyStateProps {
  message: string;
}

export function FamilyTaskLoadingState({ message }: FamilyTaskLoadingStateProps) {
  const { t } = useTranslation();

  return <p className="text-muted-foreground">{message ?? t("common.loading", "Loading...")}</p>;
}

export function FamilyTaskErrorState({ message, onRetry }: FamilyTaskErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="link" className="h-auto p-0 text-destructive" onClick={onRetry}>
            {t("common.retry", "Retry")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FamilyTaskEmptyState({ message }: FamilyTaskEmptyStateProps) {
  return <p className="text-muted-foreground">{message}</p>;
}
