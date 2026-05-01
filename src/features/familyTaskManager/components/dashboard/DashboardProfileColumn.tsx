import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "../../domain/dashboard/color";
import {
  calculateCompletedCount,
  calculateEarnedStars,
  resolveTaskBucket,
  toTopSlot,
} from "../../domain/dashboard/tasks";
import { SECTION_ORDER, TOP_SLOT_ORDER, type SlotBucket, type TopSlot } from "../../domain/dashboard/types";
import type { ChildProfileDto, TaskOccurrenceDto } from "../../models/dto";
import { FamilyTaskOccurrenceStatus, type FamilyRoutineSlot } from "../../models/enums";
import { DashboardTaskCard } from "./DashboardTaskCard";
import { NotoEmoji } from "../shared/NotoEmoji";

interface DashboardProfileColumnProps {
  profile: ChildProfileDto;
  profileColor: string;
  profileTasks: TaskOccurrenceDto[];
  routineSlotByUuid: Record<string, FamilyRoutineSlot>;
  submittingByTaskUuid: Record<string, boolean>;
  onComplete: (task: TaskOccurrenceDto) => void;
}

const TOP_SLOT_ICONS: Record<TopSlot, string> = {
  morning: "☀️",
  afternoon: "🌤️",
  anytime: "🕘",
  evening: "🌙",
  chores: "🧹",
};

function resolveProfileBadge(profile: ChildProfileDto): string {
  if (profile.avatarEmoji?.trim()) {
    return profile.avatarEmoji.trim();
  }

  const words = profile.displayName.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardProfileColumn({
  profile,
  profileColor,
  profileTasks,
  routineSlotByUuid,
  submittingByTaskUuid,
  onComplete,
}: DashboardProfileColumnProps) {
  const { t } = useTranslation();
  const [slotFilters, setSlotFilters] = useState<Record<TopSlot, boolean>>(() =>
    TOP_SLOT_ORDER.reduce<Record<TopSlot, boolean>>(
      (accumulator, slot) => {
        accumulator[slot] = true;
        return accumulator;
      },
      {} as Record<TopSlot, boolean>
    )
  );

  const groupedTasks = useMemo(() => {
    const taskGroups: Partial<Record<SlotBucket, TaskOccurrenceDto[]>> = {};
    const slotProgress = TOP_SLOT_ORDER.reduce<Record<TopSlot, { done: number; total: number }>>(
      (accumulator, slot) => {
        accumulator[slot] = { done: 0, total: 0 };
        return accumulator;
      },
      {} as Record<TopSlot, { done: number; total: number }>
    );

    for (const task of profileTasks) {
      const bucket = resolveTaskBucket(task, routineSlotByUuid);
      taskGroups[bucket] = [...(taskGroups[bucket] ?? []), task];

      const topSlot = toTopSlot(bucket);
      slotProgress[topSlot].total += 1;

      if (task.status === FamilyTaskOccurrenceStatus.COMPLETED) {
        slotProgress[topSlot].done += 1;
      }
    }

    return { taskGroups, slotProgress };
  }, [profileTasks, routineSlotByUuid]);

  const totalCount = profileTasks.length;
  const completedCount = calculateCompletedCount(profileTasks);
  const completionRate = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const earnedStars = calculateEarnedStars(profileTasks);

  const progressBarColor = hexToRgba(profileColor, 0.5);
  const completedCardColor = hexToRgba(profileColor, 0.7);
  const statusBadgeColor = hexToRgba(profileColor, 0.8);
  const slotHasTasks = useMemo(
    () =>
      TOP_SLOT_ORDER.reduce<Record<TopSlot, boolean>>(
        (accumulator, slot) => {
          accumulator[slot] = (groupedTasks.taskGroups[slot]?.length ?? 0) > 0;
          return accumulator;
        },
        {} as Record<TopSlot, boolean>
      ),
    [groupedTasks.taskGroups]
  );
  const hasVisibleSections = SECTION_ORDER.some((section) => {
    const sectionTasks = groupedTasks.taskGroups[section] ?? [];
    return sectionTasks.length > 0 && slotFilters[section];
  });

  const handleSlotFilterToggle = (slot: TopSlot) => {
    if (!slotHasTasks[slot]) {
      return;
    }

    setSlotFilters((current) => ({
      ...current,
      [slot]: !current[slot],
    }));
  };

  return (
    <article
      className="flex h-full w-[300px] shrink-0 snap-start flex-col rounded-[32px] border border-border/70 p-4 shadow-sm sm:w-[320px]"
      style={{
        background: `linear-gradient(165deg, ${hexToRgba(profileColor, 0.26)}, ${hexToRgba(profileColor, 0.1)})`,
      }}
    >
      <header className="space-y-1">
        <div className="flex items-stretch gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center self-stretch rounded-full shadow-sm"
            style={{ backgroundColor: profileColor }}
          >
            <NotoEmoji
              emoji={resolveProfileBadge(profile)}
              size={40}
              className="text-white text-lg font-semibold"
              fallback="?"
            />
          </span>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
            <h2 className="truncate text-xl font-semibold leading-tight text-foreground">{profile.displayName}</h2>

            <div className="flex items-center gap-2">
              <div className="relative h-5 min-w-0 flex-1 overflow-hidden rounded-full bg-background/70">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%`, backgroundColor: progressBarColor }}
                />
                <p className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-foreground/80">
                  ✓ {completedCount}/{totalCount}
                </p>
              </div>

              {earnedStars > 0 ? (
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-300/30 dark:text-amber-100">
                  ⭐ {earnedStars}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          {TOP_SLOT_ORDER.map((slot) => {
            const slotData = groupedTasks.slotProgress[slot];
            const ratio = slotData.total === 0 ? 0 : slotData.done / slotData.total;
            const ringDegrees = Math.max(0, Math.min(360, Math.round(360 * ratio)));
            const icon = TOP_SLOT_ICONS[slot];
            const slotLabel = t(`familyTask.today.slots.${slot}`, slot);
            const isDisabled = !slotHasTasks[slot];
            const isOn = slotFilters[slot];
            const isOff = !isDisabled && !isOn;
            const ringColor = hexToRgba(profileColor, isDisabled ? 0.25 : isOff ? 0.45 : 1);
            const ringTrackColor = hexToRgba(profileColor, isDisabled ? 0.16 : 0.24);
            const ringBackgroundImage =
              ringDegrees > 0 ? `conic-gradient(${ringColor} ${ringDegrees}deg, ${ringTrackColor} 0deg)` : undefined;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotFilterToggle(slot)}
                disabled={isDisabled}
                aria-pressed={isOn}
                className={`min-w-0 flex-1 space-y-1 text-center transition ${isDisabled ? "cursor-not-allowed opacity-45 grayscale" : ""} ${isOff ? "opacity-60 saturate-50" : "opacity-100"}`}
                title={slotLabel}
              >
                <div
                  className="mx-auto size-10 rounded-full p-[2px]"
                  style={{
                    backgroundColor: ringTrackColor,
                    backgroundImage: ringBackgroundImage,
                  }}
                >
                  <div
                    className={`flex size-full items-center justify-center rounded-full text-base ${isDisabled ? "bg-background/55 text-muted-foreground" : isOff ? "bg-background/70 text-foreground/70" : "bg-background/85 text-foreground"}`}
                  >
                    {icon}
                  </div>
                </div>
                <p
                  className={`text-[10px] font-medium capitalize leading-tight ${isDisabled ? "text-muted-foreground/70" : isOff ? "text-foreground/65" : "text-foreground/80"}`}
                >
                  {slotLabel}
                </p>
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {SECTION_ORDER.map((section) => {
          const sectionTasks = groupedTasks.taskGroups[section] ?? [];

          if (!sectionTasks.length || !slotFilters[section]) {
            return null;
          }

          return (
            <section key={section} className="space-y-1">
              <h3 className="text-xl font-semibold leading-tight text-foreground/80">
                {t(`familyTask.today.slots.${section}`, section)}
              </h3>
              <div className="space-y-2">
                {sectionTasks.map((task) => (
                  <DashboardTaskCard
                    key={task.uuid}
                    task={task}
                    section={section}
                    profileColor={profileColor}
                    completedCardColor={completedCardColor}
                    statusBadgeColor={statusBadgeColor}
                    isSubmitting={Boolean(submittingByTaskUuid[task.uuid])}
                    onComplete={onComplete}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {profileTasks.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card/65 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("familyTask.today.empty", "No tasks scheduled for today.")}
          </div>
        ) : !hasVisibleSections ? (
          <div className="rounded-2xl border border-border/70 bg-card/65 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("familyTask.dashboard.filtersEmpty", "No tasks in the enabled filters.")}
          </div>
        ) : null}
      </div>
    </article>
  );
}
