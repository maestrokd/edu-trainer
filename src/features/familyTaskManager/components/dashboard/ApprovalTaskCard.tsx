import { Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveTaskIcon } from "../../domain/dashboard/tasks";
import type { SlotBucket } from "../../domain/dashboard/types";
import type { TaskOccurrenceDto } from "../../models/dto";
import { NotoEmoji } from "../shared/NotoEmoji";

interface ApprovalTaskCardProps {
  task: TaskOccurrenceDto;
  section: SlotBucket;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (task: TaskOccurrenceDto) => void;
  onReject: (task: TaskOccurrenceDto) => void;
}

export function ApprovalTaskCard({
  task,
  section,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
}: ApprovalTaskCardProps) {
  const { t } = useTranslation();
  const taskEmoji = resolveTaskIcon(task, section);
  const isSubmitting = isApproving || isRejecting;

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm">
      <div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex justify-start">
          <p className="inline-flex h-5 items-center rounded-full bg-background/80 px-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
            {t("familyTask.today.submitted", "Submitted")}
          </p>
        </div>

        <div className="flex justify-center">
          <NotoEmoji emoji={taskEmoji} size={52} fallback="✅" />
        </div>

        <div className="flex justify-end">
          {task.starsReward > 0 ? (
            <p className="text-xs font-medium text-muted-foreground">⭐ {task.starsReward}</p>
          ) : (
            <span className="inline-flex h-5" />
          )}
        </div>
      </div>

      <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onApprove(task)}
          disabled={isSubmitting}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70 dark:text-emerald-200"
        >
          {isApproving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          {t("common.approve", "Approve")}
        </button>
        <button
          type="button"
          onClick={() => onReject(task)}
          disabled={isSubmitting}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-destructive/50 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRejecting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          {t("common.reject", "Reject")}
        </button>
      </div>
    </article>
  );
}
