import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureLockedPanelProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCtaClick?: () => void;
  footer?: ReactNode;
}

export function FeatureLockedPanel({
  title,
  description,
  ctaLabel,
  ctaTo,
  onCtaClick,
  footer,
}: FeatureLockedPanelProps) {
  return (
    <section
      className="rounded-xl border border-dashed bg-card p-5 text-card-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-muted p-2 text-muted-foreground">
          <Lock className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>

          {ctaLabel && ctaTo && (
            <div className="pt-2">
              <Button asChild size="sm" onClick={onCtaClick}>
                <Link to={ctaTo}>{ctaLabel}</Link>
              </Button>
            </div>
          )}

          {footer ? <div className="pt-3">{footer}</div> : null}
        </div>
      </div>
    </section>
  );
}
