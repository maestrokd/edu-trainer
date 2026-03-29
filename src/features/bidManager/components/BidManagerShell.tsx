import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BidManagerShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function BidManagerShell({ title, subtitle, actions, children, className }: BidManagerShellProps) {
  return (
    <div className={cn("w-full min-w-0 bg-background p-4 sm:p-6", className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
