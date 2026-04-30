import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { canManageFamilyTask } from "../domain/access";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRoutines } from "../hooks/useRoutines";
import { useFamilyContext } from "../hooks/useFamilyContext";
import type { RoutineDto } from "../models/dto";
import { FamilyRoutineSlot } from "../models/enums";

const DATE_TOKEN_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateToken(value: string | null | undefined): string | null {
  const token = value?.trim().slice(0, 10);
  if (!token || !DATE_TOKEN_PATTERN.test(token)) {
    return null;
  }

  return token;
}

function todayDateToken(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type RoutineDateRangeState = "active_today" | "not_started" | "ended";

function resolveDateRangeState(startDate: string, endDate: string | null, dayToken: string): RoutineDateRangeState {
  const normalizedStart = normalizeDateToken(startDate);
  const normalizedEnd = normalizeDateToken(endDate);
  if (normalizedStart && normalizedStart > dayToken) {
    return "not_started";
  }

  if (normalizedEnd && normalizedEnd < dayToken) {
    return "ended";
  }

  return "active_today";
}

export function RoutinesPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("routines");

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);

  const { profiles } = useFamilyContext();
  const profileNameByUuid = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.profileUuid, profile.displayName])),
    [profiles]
  );

  const { routines, loading, error, refetch, remove } = useRoutines();
  const [deleting, setDeleting] = useState<string | null>(null);
  const today = todayDateToken();

  const grouped = useMemo(() => {
    const map: Partial<Record<FamilyRoutineSlot, RoutineDto[]>> = {};

    for (const routine of routines) {
      map[routine.routineSlot] = [...(map[routine.routineSlot] ?? []), routine];
    }

    return map;
  }, [routines]);

  const handleDelete = async (routineUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setDeleting(routineUuid);

    try {
      await remove(routineUuid);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("familyTask.routines.title", "Routines")}</h1>
          {canManage && (
            <Link
              to="/family-tasks/routines/new"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              {t("common.new", "+ New")}
            </Link>
          )}
        </div>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
            <span>{t(error, "Failed to load routines.")}</span>
            <button className="underline" onClick={() => void refetch()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {!loading && !error && routines.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.routines.noRoutines", "No routines defined yet.")}</p>
        )}

        {(Object.values(FamilyRoutineSlot) as FamilyRoutineSlot[]).map((slot) => {
          const group = grouped[slot];
          if (!group?.length) {
            return null;
          }

          return (
            <section key={slot}>
              <h2 className="text-base font-medium capitalize mb-2">
                {t(`familyTask.today.slots.${slot.toLowerCase()}`, slot)}
              </h2>
              <div className="space-y-2">
                {group.map((routine) => {
                  const dateRangeState = resolveDateRangeState(routine.startDate, routine.endDate, today);
                  const isDateRangeActiveToday = dateRangeState === "active_today";
                  const isEffectivelyInactive = !routine.active || !isDateRangeActiveToday;

                  return (
                    <div
                      key={routine.uuid}
                      className={cn(
                        "rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4",
                        isEffectivelyInactive && "border-dashed bg-muted/20"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-medium text-sm", isEffectivelyInactive && "text-muted-foreground")}>
                            {routine.title}
                          </p>
                          {isEffectivelyInactive ? (
                            <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              {t("familyTask.templateCollections.filters.inactive", "Inactive")}
                            </span>
                          ) : null}
                          {dateRangeState === "not_started" ? (
                            <span className="inline-flex rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/35 dark:text-sky-200">
                              {t("familyTask.routines.dateRangeNotStarted", "Not started yet")}
                            </span>
                          ) : null}
                          {dateRangeState === "ended" ? (
                            <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
                              {t("familyTask.routines.dateRangeEnded", "Date range ended")}
                            </span>
                          ) : null}
                        </div>
                        {routine.assigneeProfileUuids?.length ? (
                          <p className="text-xs text-muted-foreground">
                            👥{" "}
                            {routine.assigneeProfileUuids
                              .map((uuid) => profileNameByUuid[uuid] ?? t("familyTask.profiles.unknown", "Unknown"))
                              .join(", ")}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          ⭐ {routine.starsReward} · {routine.recurrenceType}
                          {routine.weekdays ? ` (${routine.weekdays})` : ""}
                        </p>
                      </div>

                      {canManage && (
                        <div className="flex gap-2">
                          <Link
                            to={`/family-tasks/routines/${routine.uuid}`}
                            className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                          >
                            {t("common.edit", "Edit")}
                          </Link>
                          <button
                            disabled={deleting === routine.uuid}
                            className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition disabled:opacity-50"
                            onClick={() => void handleDelete(routine.uuid)}
                          >
                            {t("common.delete", "Delete")}
                          </button>
                        </div>
                      )}
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
