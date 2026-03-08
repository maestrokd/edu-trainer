import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useTodayTasks } from "../hooks/useTaskOccurrences";

export function SharedDisplayPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("shared_display");

  const { profiles } = useFamilyContext();
  const [profileUuid, setProfileUuid] = useState("");
  const { tasks, loading, error, refetch } = useTodayTasks(profileUuid || undefined);

  const completedCount = useMemo(() => tasks.filter((task) => task.status === "COMPLETED").length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter((task) => task.status !== "COMPLETED").length, [tasks]);

  return (
    <FamilyTaskPageShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{t("familyTask.display.title", "Shared Display")}</h1>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={profileUuid}
            onChange={(event) => setProfileUuid(event.target.value)}
          >
            <option value="">{t("familyTask.common.noAssigned", "Everyone")}</option>
            {profiles.map((profile) => (
              <option key={profile.profileUuid} value={profile.profileUuid}>
                {profile.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("familyTask.today.title", "Today's Tasks")}</p>
            <p className="text-4xl font-bold mt-2">{tasks.length}</p>
          </article>
          <article className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("familyTask.display.completed", "Completed")}</p>
            <p className="text-4xl font-bold mt-2">{completedCount}</p>
          </article>
          <article className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t("familyTask.display.pending", "Pending")}</p>
            <p className="text-4xl font-bold mt-2">{pendingCount}</p>
          </article>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("familyTask.today.title", "Today's Tasks")}</h2>
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
          {!loading && !error && tasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <div key={task.uuid} className="rounded-lg border bg-card px-4 py-3">
                  <p className="text-lg font-semibold">{task.title}</p>
                  <p className="text-sm text-muted-foreground">⭐ {task.starsReward}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </FamilyTaskPageShell>
  );
}
