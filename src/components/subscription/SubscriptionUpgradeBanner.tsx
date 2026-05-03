import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionUpgradeBannerProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  className?: string;
  onActionClick?: () => void;
}

export function SubscriptionUpgradeBanner({
  title,
  description,
  actionLabel,
  actionTo,
  className,
  onActionClick,
}: SubscriptionUpgradeBannerProps) {
  const showAction = Boolean(actionLabel && actionTo);

  return (
    <Alert
      role="status"
      aria-live="polite"
      className={cn(
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50",
        className
      )}
    >
      <Sparkles className="text-amber-700 dark:text-amber-300" />
      <div className="col-start-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <AlertTitle className="line-clamp-none text-sm font-semibold">{title}</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">{description}</AlertDescription>
        </div>

        {showAction ? (
          <Button asChild size="sm" className="sm:shrink-0" onClick={onActionClick}>
            <Link to={actionTo!}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
