import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { AssigneeProfileBadge } from "../components/shared/AssigneeProfileBadge";
import { PROFILE_FALLBACK_COLORS } from "../domain/dashboard/color";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRoutines } from "../hooks/useRoutines";
import { useTodayTasks } from "../hooks/useTaskOccurrences";
import type { TaskOccurrenceDto } from "../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus, FamilyTaskSourceType } from "../models/enums";

type TodayGroupKey = Lowercase<FamilyRoutineSlot> | "chore";

const SLOT_ORDER: TodayGroupKey[] = ["morning", "afternoon", "evening", "anytime", "chore"];

function statusClasses(status: string): string {
  if (status === FamilyTaskOccurrenceStatus.COMPLETED) {
    return "bg-green-100 text-green-700";
  }

  if (status === FamilyTaskOccurrenceStatus.SUBMITTED) {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-muted text-muted-foreground";
}

function resolveGroup(task: TaskOccurrenceDto, routineSlotByUuid: Record<string, FamilyRoutineSlot>): TodayGroupKey {
  if (task.sourceType !== FamilyTaskSourceType.ROUTINE) {
    return "chore";
  }

  const slot = routineSlotByUuid[task.sourceUuid] ?? FamilyRoutineSlot.ANYTIME;
  return slot.toLowerCase() as Lowercase<FamilyRoutineSlot>;
}

export function TodayPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("today");

  const { tasks, loading, error, refetch, submit } = useTodayTasks();
  const { profiles } = useFamilyContext();
  const { routines } = useRoutines();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const profileByUuid = useMemo(() => {
    return new Map(
      profiles.map((profile, index) => [
        profile.profileUuid,
        {
          profile,
          color: profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length],
        },
      ])
    );
  }, [profiles]);

  const routineSlotByUuid = useMemo(() => {
    const map: Record<string, FamilyRoutineSlot> = {};

    for (const routine of routines) {
      map[routine.uuid] = routine.routineSlot;
    }

    return map;
  }, [routines]);

  const grouped = useMemo(() => {
    const map: Partial<Record<TodayGroupKey, TaskOccurrenceDto[]>> = {};

    for (const task of tasks) {
      const groupKey = resolveGroup(task, routineSlotByUuid);
      map[groupKey] = [...(map[groupKey] ?? []), task];
    }

    return map;
  }, [tasks, routineSlotByUuid]);

  const handleSubmit = async (occurrenceUuid: string) => {
    setSubmitting(occurrenceUuid);

    try {
      await submit(occurrenceUuid, { note: t("familyTask.today.submitted", "Done") });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t("familyTask.today.title", "Today's Tasks")}</h1>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
            <span>{t(error, "Failed to load today's tasks.")}</span>
            <button className="underline" onClick={() => void refetch()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.today.empty", "No tasks scheduled for today.")}</p>
        )}

        {!loading &&
          !error &&
          SLOT_ORDER.map((slot) => {
            const group = grouped[slot];

            if (!group?.length) {
              return null;
            }

            return (
              <section key={slot}>
                <h2 className="text-base font-medium capitalize mb-2">{t(`familyTask.today.slots.${slot}`, slot)}</h2>
                <div className="space-y-2">
                  {group.map((task) => {
                    const assignee = profileByUuid.get(task.assigneeProfileUuid);

                    return (
                      <div
                        key={task.uuid}
                        className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <AssigneeProfileBadge
                              profile={assignee?.profile}
                              profileColor={assignee?.color}
                              unknownLabel={t("familyTask.profiles.unknown", "Unknown")}
                            />
                            <p className="text-xs text-muted-foreground">⭐ {task.starsReward}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses(task.status)}`}
                          >
                            {task.status}
                          </span>

                          {task.status === FamilyTaskOccurrenceStatus.OPEN && (
                            <button
                              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90 transition disabled:opacity-50"
                              onClick={() => void handleSubmit(task.uuid)}
                              disabled={submitting === task.uuid}
                            >
                              {submitting === task.uuid
                                ? t("common.saving", "Saving...")
                                : t("familyTask.today.submit", "Submit for Approval")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </FamilyTaskPageShell>
  );
}
