import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveTaskIcon } from "../../domain/dashboard/tasks";
import type { SlotBucket } from "../../domain/dashboard/types";
import type { TaskOccurrenceDto } from "../../models/dto";
import { FamilyTaskOccurrenceStatus } from "../../models/enums";
import { NotoEmoji } from "../shared/NotoEmoji";

interface DashboardTaskCardProps {
  task: TaskOccurrenceDto;
  section: SlotBucket;
  profileColor: string;
  completedCardColor: string;
  statusBadgeColor: string;
  isSubmitting: boolean;
  onComplete: (task: TaskOccurrenceDto) => void;
}

export function DashboardTaskCard({
  task,
  section,
  profileColor,
  completedCardColor,
  statusBadgeColor,
  isSubmitting,
  onComplete,
}: DashboardTaskCardProps) {
  const { t } = useTranslation();
  const isOpen = task.status === FamilyTaskOccurrenceStatus.OPEN;
  const isSubmitted = task.status === FamilyTaskOccurrenceStatus.SUBMITTED;
  const isCompleted = task.status === FamilyTaskOccurrenceStatus.COMPLETED;
  const taskEmoji = resolveTaskIcon(task, section);

  let statusBackground = `rgba(255, 255, 255, 0.65)`;
  if (isSubmitted || isCompleted) {
    statusBackground = statusBadgeColor;
  }

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-white/70 px-3 py-2 shadow-sm"
      style={{ backgroundColor: statusBackground }}
    >
      {isSubmitted ? (
        <p className="absolute left-2 top-2 inline-flex h-5 items-center rounded-full bg-white/70 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
          {t("familyTask.today.submitted", "Submitted")}
        </p>
      ) : null}

      {task.starsReward > 0 ? (
        <p className="absolute right-3 top-2 text-xs font-medium text-slate-600">⭐ {task.starsReward}</p>
      ) : null}

      <div className="pr-10">
        <div className="mb-1 flex justify-center">
          <NotoEmoji emoji={taskEmoji} size={52} fallback="✅" />
        </div>
        <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
      </div>

      <button
        className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-slate-500 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-90"
        style={
          isCompleted || isSubmitted
            ? {
                backgroundColor: completedCardColor,
                borderColor: profileColor,
                color: "white",
              }
            : undefined
        }
        onClick={() => onComplete(task)}
        disabled={!isOpen || isSubmitting}
        aria-label={t("familyTask.dashboard.completeTask", "Complete task")}
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {!isSubmitting && isCompleted ? <Check className="size-4" /> : null}
        {!isSubmitting && isSubmitted ? "•" : null}
        {!isSubmitting && isOpen ? <span className="size-2.5 rounded-full bg-slate-200" /> : null}
      </button>
    </article>
  );
}
