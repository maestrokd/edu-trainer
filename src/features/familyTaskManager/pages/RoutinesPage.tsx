import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRoutines } from "../hooks/useRoutines";
import { useFamilyContext } from "../hooks/useFamilyContext";
import type { RoutineDto } from "../models/dto";
import { FamilyRoutineSlot } from "../models/enums";

export function RoutinesPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("routines");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profiles } = useFamilyContext();
  const profileNameByUuid = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.profileUuid, profile.displayName])),
    [profiles]
  );

  const { routines, loading, error, refetch, remove } = useRoutines();
  const [deleting, setDeleting] = useState<string | null>(null);

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
          {isParent && (
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
                {group.map((routine) => (
                  <div
                    key={routine.uuid}
                    className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-sm">{routine.title}</p>
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

                    {isParent && (
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
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </FamilyTaskPageShell>
  );
}
