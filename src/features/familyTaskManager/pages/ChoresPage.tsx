import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useChores } from "../hooks/useChores";
import { useFamilyContext } from "../hooks/useFamilyContext";

const DATE_TOKEN_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ChoreDueState = "no_due_date" | "upcoming" | "due_today" | "overdue";

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

function resolveChoreDueState(dueDate: string | null | undefined, today: string): ChoreDueState {
  const dateToken = normalizeDateToken(dueDate);
  if (!dateToken) {
    return "no_due_date";
  }

  if (dateToken > today) {
    return "upcoming";
  }

  if (dateToken < today) {
    return "overdue";
  }

  return "due_today";
}

function formatDateToken(dateToken: string | null, locale: string): string {
  if (!dateToken) {
    return "—";
  }

  const [year, month, day] = dateToken.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return dateToken;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function ChoresPage() {
  const { t, i18n } = useTranslation();
  useTrackFamilyTaskPageView("chores");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const [assigneeProfileUuid, setAssigneeProfileUuid] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filters = useMemo(() => {
    const normalizedActive = activeFilter === "all" ? undefined : activeFilter === "active";

    return {
      assigneeProfileUuid: assigneeProfileUuid || undefined,
      active: normalizedActive,
    };
  }, [activeFilter, assigneeProfileUuid]);

  const { profiles } = useFamilyContext();
  const profileNameByUuid = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.profileUuid, profile.displayName])),
    [profiles]
  );
  const { chores, loading, error, refetch, remove } = useChores(filters);
  const today = todayDateToken();

  const handleDelete = async (choreUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setDeleting(choreUuid);

    try {
      await remove(choreUuid);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{t("familyTask.chores.title", "Chores")}</h1>
          {isParent && (
            <Link
              to="/family-tasks/chores/new"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              {t("common.new", "+ New")}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm space-y-1">
            <span>{t("familyTask.chores.assignee", "Assignee")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={assigneeProfileUuid}
              onChange={(event) => setAssigneeProfileUuid(event.target.value)}
            >
              <option value="">{t("familyTask.common.noAssigned", "Everyone")}</option>
              {profiles.map((profile) => (
                <option key={profile.profileUuid} value={profile.profileUuid}>
                  {profile.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm space-y-1">
            <span>{t("familyTask.chores.active", "Status")}</span>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
            >
              <option value="active">{t("familyTask.chores.activeOnly", "Active")}</option>
              <option value="inactive">{t("familyTask.chores.archivedOnly", "Archived")}</option>
              <option value="all">{t("familyTask.chores.all", "All")}</option>
            </select>
          </label>
        </div>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
            <span>{t(error, "Failed to load chores.")}</span>
            <button className="underline" onClick={() => void refetch()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {!loading && !error && chores.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.chores.noChores", "No chores defined yet.")}</p>
        )}

        <div className="space-y-2">
          {chores.map((chore) => {
            const dueDateToken = normalizeDateToken(chore.dueDate);
            const dueState = resolveChoreDueState(chore.dueDate, today);
            const isInactive = !chore.active;

            return (
              <div
                key={chore.uuid}
                className={cn(
                  "rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4",
                  isInactive && "border-dashed bg-muted/20"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-medium text-sm", isInactive && "text-muted-foreground")}>{chore.title}</p>
                    {isInactive ? (
                      <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {t("familyTask.templateCollections.filters.inactive", "Inactive")}
                      </span>
                    ) : null}
                    {dueState === "upcoming" ? (
                      <span className="inline-flex rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/35 dark:text-sky-200">
                        {t("familyTask.chores.badges.upcoming", "Upcoming")}
                      </span>
                    ) : null}
                    {dueState === "due_today" ? (
                      <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {t("familyTask.chores.badges.dueToday", "Due today")}
                      </span>
                    ) : null}
                    {dueState === "overdue" ? (
                      <span className="inline-flex rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/35 dark:text-rose-200">
                        {t("familyTask.chores.badges.overdue", "Overdue")}
                      </span>
                    ) : null}
                    {dueState === "no_due_date" ? (
                      <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {t("familyTask.chores.badges.noDueDate", "No due date")}
                      </span>
                    ) : null}
                  </div>
                  {chore.description && <p className="text-xs text-muted-foreground">{chore.description}</p>}
                  {chore.assigneeProfileUuids?.length ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      👥{" "}
                      {chore.assigneeProfileUuids
                        .map((uuid) => profileNameByUuid[uuid] ?? t("familyTask.profiles.unknown", "Unknown"))
                        .join(", ")}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    📅 {t("familyTask.chores.dueDate", "Due Date")}: {formatDateToken(dueDateToken, i18n.language)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">⭐ {chore.starsReward}</p>
                </div>

                {isParent && (
                  <div className="flex gap-2">
                    <Link
                      to={`/family-tasks/chores/${chore.uuid}`}
                      className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                    >
                      {t("common.edit", "Edit")}
                    </Link>
                    <button
                      disabled={deleting === chore.uuid}
                      className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition disabled:opacity-50"
                      onClick={() => void handleDelete(chore.uuid)}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </FamilyTaskPageShell>
  );
}
