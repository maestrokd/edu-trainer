import { ArrowLeft, CalendarDays, CircleOff, MessageSquare, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { routineExceptionsApi } from "../api/routineExceptionsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { AssigneeProfilesField } from "../components/tasks/AssigneeProfilesField";
import { FAMILY_TASK_ROUTES } from "../constants/routes";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useFamilyTaskErrorHandler } from "../hooks/useFamilyTaskErrorHandler";
import { useRoutines } from "../hooks/useRoutines";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { RoutineDto, RoutineExceptionDto } from "../models/dto";
import { FamilyRoutineExceptionType } from "../models/enums";

type ExceptionOperationMode = "create" | "reopen";

function todayDateToken(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseOperationMode(value: string | null): ExceptionOperationMode {
  return value === "reopen" ? "reopen" : "create";
}

function routineSummaryLabel(routine: RoutineDto): string {
  return `${routine.emoji ? `${routine.emoji} ` : ""}${routine.title}`;
}

function routineMetaLabel(routine: RoutineDto): string {
  return `${routine.routineSlot} · ${routine.recurrenceType}${routine.weekdays ? ` (${routine.weekdays})` : ""} · ⭐ ${
    routine.starsReward
  }`;
}

function formatDateToken(value: string, locale: string, fallback: string): string {
  const token = value.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
  if (!match) {
    return fallback;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

function formatDateTime(value: string, locale: string, fallback: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
}

export function RoutineExceptionDetailsPage() {
  const { t, i18n } = useTranslation();
  useTrackFamilyTaskPageView("routine_exception_details");
  const { handleError } = useFamilyTaskErrorHandler();
  const { profiles, members, error: familyError, refetch: refetchFamilyContext } = useFamilyContext();
  const { routines, loading: routinesLoading, error: routinesError, refetch: refetchRoutines } = useRoutines();
  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { routineUuid: routeRoutineUuidRaw, exceptionUuid } = useParams<{
    routineUuid?: string;
    exceptionUuid?: string;
  }>();
  const routeRoutineUuid = routeRoutineUuidRaw?.trim() || null;
  const isNew = !exceptionUuid || exceptionUuid === "new";

  const [searchParams, setSearchParams] = useSearchParams();
  const operationMode = parseOperationMode(searchParams.get("mode"));
  const location = useLocation();
  const navigate = useNavigate();

  const seededException = (location.state as { exception?: RoutineExceptionDto } | null)?.exception ?? null;

  const [originalException, setOriginalException] = useState<RoutineExceptionDto | null>(null);
  const [fromDate, setFromDate] = useState(todayDateToken());
  const [toDate, setToDate] = useState(todayDateToken());
  const [assigneeProfileUuids, setAssigneeProfileUuids] = useState<string[]>([]);
  const [exceptionType, setExceptionType] = useState<FamilyRoutineExceptionType>(FamilyRoutineExceptionType.SKIP);
  const [note, setNote] = useState("");
  const [exceptionLoading, setExceptionLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routinesByUuid = useMemo(() => new Map(routines.map((routine) => [routine.uuid, routine])), [routines]);
  const selectedRoutine = routeRoutineUuid ? (routinesByUuid.get(routeRoutineUuid) ?? null) : null;

  const updateOperationMode = useCallback(
    (nextMode: ExceptionOperationMode) => {
      const currentMode = parseOperationMode(searchParams.get("mode"));
      if (currentMode === nextMode) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("mode", nextMode);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (!isNew) {
      return;
    }

    const rawModeParam = searchParams.get("mode");
    const currentQueryMode = parseOperationMode(rawModeParam);
    if (currentQueryMode === operationMode && rawModeParam != null && !searchParams.has("routineUuid")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("routineUuid");
    nextParams.set("mode", operationMode);

    setSearchParams(nextParams, { replace: true });
  }, [isNew, operationMode, searchParams, setSearchParams]);

  const applyExceptionToState = useCallback((exception: RoutineExceptionDto) => {
    setOriginalException(exception);
    setFromDate(exception.exceptionDate);
    setToDate(exception.exceptionDate);
    setAssigneeProfileUuids([exception.assigneeProfileUuid]);
    setExceptionType(exception.exceptionType);
    setNote(exception.note ?? "");
  }, []);

  useEffect(() => {
    if (isNew) {
      setExceptionLoading(false);
      return;
    }

    if (!isParent || !exceptionUuid) {
      setExceptionLoading(false);
      return;
    }

    if (
      seededException &&
      seededException.uuid === exceptionUuid &&
      (!routeRoutineUuid || seededException.routineUuid === routeRoutineUuid)
    ) {
      applyExceptionToState(seededException);
      setExceptionLoading(false);
      return;
    }

    const sourceRoutineUuid = routeRoutineUuid;
    if (!sourceRoutineUuid) {
      setExceptionLoading(false);
      setError(
        t("familyTask.errors.routineLoad", {
          defaultValue: "Failed to load routine.",
        })
      );
      return;
    }

    const assigneeProfileUuid = searchParams.get("assigneeProfileUuid")?.trim();
    const exceptionDate = searchParams.get("exceptionDate")?.trim();

    setExceptionLoading(true);
    setError(null);

    routineExceptionsApi
      .getAll(sourceRoutineUuid, {
        assigneeProfileUuid: assigneeProfileUuid || undefined,
        fromDate: exceptionDate || undefined,
        toDate: exceptionDate || undefined,
        page: 0,
        size: 200,
        sort: ["exceptionDate,asc", "createdDate,asc"],
      })
      .then((pageResponse) => {
        const matched = pageResponse.items.find((item) => item.uuid === exceptionUuid);
        if (!matched) {
          setError(
            t("familyTask.errors.routineExceptionLoad", {
              defaultValue: "Failed to load routine exception.",
            })
          );
          return;
        }

        applyExceptionToState(matched);
      })
      .catch((reason: unknown) =>
        handleError(reason, {
          fallbackKey: "familyTask.errors.routineExceptionLoad",
          fallbackMessage: "Failed to load routine exception.",
          setError,
        })
      )
      .finally(() => setExceptionLoading(false));
  }, [
    applyExceptionToState,
    exceptionUuid,
    handleError,
    isNew,
    isParent,
    routeRoutineUuid,
    searchParams,
    seededException,
    t,
  ]);

  const availableAssignees = useMemo(() => {
    if (!selectedRoutine) {
      return [];
    }

    const allowed = new Set(selectedRoutine.assigneeProfileUuids ?? []);
    return profiles.filter((profile) => allowed.has(profile.profileUuid));
  }, [profiles, selectedRoutine]);

  useEffect(() => {
    if (!isNew) {
      return;
    }

    if (!selectedRoutine) {
      setAssigneeProfileUuids([]);
      return;
    }

    const allowed = new Set(selectedRoutine.assigneeProfileUuids ?? []);
    setAssigneeProfileUuids((current) => current.filter((profileUuid) => allowed.has(profileUuid)));
  }, [isNew, selectedRoutine]);

  useEffect(() => {
    if (!isNew || !selectedRoutine || assigneeProfileUuids.length > 0 || availableAssignees.length === 0) {
      return;
    }

    setAssigneeProfileUuids([availableAssignees[0].profileUuid]);
  }, [assigneeProfileUuids.length, availableAssignees, isNew, selectedRoutine]);

  const profileNameByUuid = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.profileUuid, profile.displayName])),
    [profiles]
  );
  const actorNameByProfileUuid = useMemo(
    () => Object.fromEntries(members.map((member) => [member.profileUuid, member.displayName])),
    [members]
  );

  const effectiveRoutineUuid = routeRoutineUuid || originalException?.routineUuid || "";
  const dashboardPath = effectiveRoutineUuid
    ? FAMILY_TASK_ROUTES.routineExceptionsForRoutine(effectiveRoutineUuid)
    : FAMILY_TASK_ROUTES.routines;

  const hasValidDateRange = Boolean(fromDate) && Boolean(toDate) && fromDate <= toDate;
  const canSubmitNew =
    isNew &&
    Boolean(routeRoutineUuid) &&
    hasValidDateRange &&
    assigneeProfileUuids.length > 0 &&
    exceptionType === FamilyRoutineExceptionType.SKIP;

  const refreshPage = async () => {
    await Promise.all([refetchFamilyContext(), refetchRoutines()]);
  };

  const handleSubmitNew = async () => {
    if (!canSubmitNew) {
      return;
    }

    const targetRoutineUuid = routeRoutineUuid?.trim() || "";
    if (!targetRoutineUuid) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (operationMode === "reopen") {
        await routineExceptionsApi.reopen(targetRoutineUuid, {
          fromDate,
          toDate,
          assigneeProfileUuids,
        });
      } else {
        await routineExceptionsApi.create(targetRoutineUuid, {
          fromDate,
          toDate,
          assigneeProfileUuids,
          exceptionType: FamilyRoutineExceptionType.SKIP,
          note: note.trim() || undefined,
        });
      }

      navigate(FAMILY_TASK_ROUTES.routineExceptionsForRoutine(targetRoutineUuid));
    } catch (reason: unknown) {
      handleError(reason, {
        fallbackKey: "familyTask.errors.routineExceptionSave",
        fallbackMessage: "Failed to save routine exception.",
        setError,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExact = async () => {
    if (!originalException) {
      return;
    }

    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await routineExceptionsApi.reopen(originalException.routineUuid, {
        fromDate: originalException.exceptionDate,
        toDate: originalException.exceptionDate,
        assigneeProfileUuids: [originalException.assigneeProfileUuid],
      });

      navigate(FAMILY_TASK_ROUTES.routineExceptionsForRoutine(originalException.routineUuid));
    } catch (reason: unknown) {
      handleError(reason, {
        fallbackKey: "familyTask.errors.routineExceptionDelete",
        fallbackMessage: "Failed to delete routine exception.",
        setError,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!routeRoutineUuid) {
    return (
      <FamilyTaskPageShell>
        <div className="text-muted-foreground">{t("familyTask.errors.routineLoad", "Failed to load routine.")}</div>
      </FamilyTaskPageShell>
    );
  }

  if (routinesLoading || exceptionLoading) {
    return (
      <FamilyTaskPageShell>
        <div className="text-muted-foreground">{t("common.loading", "Loading...")}</div>
      </FamilyTaskPageShell>
    );
  }

  const assigneeLabel =
    originalException?.assigneeProfileUuid != null
      ? (profileNameByUuid[originalException.assigneeProfileUuid] ?? t("familyTask.profiles.unknown", "Unknown"))
      : t("familyTask.profiles.unknown", "Unknown");
  const createdByLabel =
    originalException?.createdByProfileUuid != null
      ? (actorNameByProfileUuid[originalException.createdByProfileUuid] ?? t("familyTask.profiles.unknown", "Unknown"))
      : t("familyTask.profiles.unknown", "Unknown");
  const detailRoutineTitle = originalException?.routine?.title ?? selectedRoutine?.title ?? "—";
  const detailRoutineMeta =
    originalException?.routine != null
      ? `${originalException.routine.routineSlot} · ${originalException.routine.recurrenceType}${
          originalException.routine.weekdays ? ` (${originalException.routine.weekdays})` : ""
        }`
      : selectedRoutine
        ? routineMetaLabel(selectedRoutine)
        : "—";

  return (
    <FamilyTaskPageShell className="h-full min-w-0 bg-background bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100 p-0 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-4">
      <ParentFeatureGate featureId="routine_exception_details">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1500px]">
          <div className="hidden flex-1 items-center justify-center px-10 lg:flex">
            <div className="max-w-md space-y-2 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("familyTask.routineExceptions.title", "Routine Exceptions")}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {isNew
                  ? t("familyTask.routineExceptions.manage", "Manage Exceptions")
                  : t("familyTask.routineExceptions.details", "Exception Details")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isNew
                  ? t(
                      "familyTask.routineExceptions.lifecycleHint",
                      "Use Create to add skip exceptions, or Delete/Reopen to remove existing skip exceptions in bulk."
                    )
                  : t(
                      "familyTask.routineExceptions.readOnlyHint",
                      "Existing exception entries are read-only; use Delete to remove the exact exception."
                    )}
              </p>
            </div>
          </div>

          <section className="flex h-full w-full min-w-0 flex-col bg-card lg:ml-auto lg:max-w-[460px] lg:rounded-[30px] lg:border lg:border-border lg:shadow-xl">
            <header className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={t("common.back", "Back")}
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-foreground">
                  {isNew
                    ? t("familyTask.routineExceptions.manage", "Manage Exceptions")
                    : t("familyTask.routineExceptions.details", "Exception Details")}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {t("familyTask.routineExceptions.forRoutine", "Exceptions for {{routine}}", {
                    routine: selectedRoutine?.title ?? routeRoutineUuid ?? "—",
                  })}
                </p>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {familyError ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                  <span>{t(familyError, "Failed to load family context.")}</span>
                  <button type="button" className="font-medium underline" onClick={() => void refreshPage()}>
                    {t("common.retry", "Retry")}
                  </button>
                </div>
              ) : null}

              {routinesError ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                  <span>{t(routinesError, "Failed to load routines.")}</span>
                  <button type="button" className="font-medium underline" onClick={() => void refreshPage()}>
                    {t("common.retry", "Retry")}
                  </button>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                  {t(error, "Failed to save routine exception.")}
                </p>
              ) : null}

              {isNew ? (
                <>
                  <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
                    <p className="text-sm font-medium text-foreground">
                      {t("familyTask.routineExceptions.operationMode", "Operation mode")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateOperationMode("create")}
                        className={cn(
                          "h-9 rounded-full border text-sm font-medium transition-colors",
                          operationMode === "create"
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border bg-background text-foreground/80 hover:bg-accent"
                        )}
                      >
                        {t("familyTask.routineExceptions.modeCreate", "Create")}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOperationMode("reopen")}
                        className={cn(
                          "h-9 rounded-full border text-sm font-medium transition-colors",
                          operationMode === "reopen"
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border bg-background text-foreground/80 hover:bg-accent"
                        )}
                      >
                        {t("familyTask.routineExceptions.modeReopen", "Delete/Reopen")}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {operationMode === "create"
                        ? t(
                            "familyTask.routineExceptions.modeCreateHint",
                            "Create SKIP exceptions for selected assignees in the date range."
                          )
                        : t(
                            "familyTask.routineExceptions.modeReopenHint",
                            "Remove existing SKIP exceptions for selected assignees in the date range."
                          )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {t("familyTask.routines.title", "Routines")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {selectedRoutine ? routineSummaryLabel(selectedRoutine) : (routeRoutineUuid ?? "—")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoutine ? routineMetaLabel(selectedRoutine) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("familyTask.routineExceptions.assigneeCount", "Assignees: {{count}}", {
                        count: selectedRoutine?.assigneeProfileUuids?.length ?? 0,
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        {t("familyTask.routineExceptions.fromDate", "From date")}
                      </span>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        {t("familyTask.routineExceptions.toDate", "To date")}
                      </span>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                      />
                    </label>
                  </div>

                  <AssigneeProfilesField
                    profiles={availableAssignees}
                    value={assigneeProfileUuids}
                    onChange={setAssigneeProfileUuids}
                    label={t("familyTask.chores.form.assignedTo", "Assigned To")}
                    emptyHint={t("familyTask.routineExceptions.noAssignees", "No eligible assignees for this routine.")}
                  />

                  {operationMode === "create" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                          <CircleOff className="size-4 text-muted-foreground" />
                          {t("familyTask.routineExceptions.type", "Exception type")}
                        </span>
                        <select
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                          value={exceptionType}
                          onChange={(event) => setExceptionType(event.target.value as FamilyRoutineExceptionType)}
                        >
                          <option value={FamilyRoutineExceptionType.SKIP}>{FamilyRoutineExceptionType.SKIP}</option>
                        </select>
                      </label>

                      <label className="block space-y-2">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                          <MessageSquare className="size-4 text-muted-foreground" />
                          {t("familyTask.routineExceptions.note", "Note")}
                        </span>
                        <textarea
                          className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                          rows={3}
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder={t(
                            "familyTask.routineExceptions.notePlaceholder",
                            "Optional note, for example: Summer camp"
                          )}
                        />
                      </label>
                    </>
                  ) : null}

                  {!hasValidDateRange ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                      {t(
                        "familyTask.routineExceptions.invalidDateRange",
                        "From date must be before or equal to To date."
                      )}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  {originalException ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {t("familyTask.routines.title", "Routines")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">{detailRoutineTitle}</p>
                        <p className="text-xs text-muted-foreground">{detailRoutineMeta}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                        <p className="text-muted-foreground">{t("familyTask.chores.form.assignedTo", "Assigned To")}</p>
                        <p className="font-medium text-foreground">{assigneeLabel}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                        <p className="text-muted-foreground">{t("familyTask.routineExceptions.date", "Date")}</p>
                        <p className="font-medium text-foreground">
                          {formatDateToken(
                            originalException.exceptionDate,
                            i18n.language,
                            t("familyTask.redemptions.noDate", "Unknown date")
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                        <p className="text-muted-foreground">{t("familyTask.routineExceptions.type", "Type")}</p>
                        <p className="font-medium text-foreground">{originalException.exceptionType}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                        <p className="text-muted-foreground">{t("familyTask.routineExceptions.note", "Note")}</p>
                        <p className="font-medium text-foreground">{originalException.note?.trim() || "—"}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                        <p className="text-muted-foreground">
                          {t("familyTask.routineExceptions.createdBy", "Created by")}
                        </p>
                        <p className="font-medium text-foreground">{createdByLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(
                            originalException.createdDate,
                            i18n.language,
                            t("familyTask.redemptions.noDate", "Unknown date")
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-background px-3 py-4 text-sm text-muted-foreground">
                      {t("familyTask.errors.routineExceptionLoad", "Failed to load routine exception.")}
                    </div>
                  )}
                </>
              )}
            </div>

            <footer className="border-t border-border px-4 py-4 sm:px-5">
              {isNew ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled={saving || !canSubmitNew}
                    onClick={() => void handleSubmitNew()}
                    className="h-11 flex-1 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? t("common.saving", "Saving...")
                      : operationMode === "reopen"
                        ? t("familyTask.routineExceptions.modeReopen", "Delete/Reopen")
                        : t("familyTask.routineExceptions.modeCreate", "Create")}
                  </button>
                  <Link
                    to={dashboardPath}
                    className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                  >
                    {t("common.cancel", "Cancel")}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDeleteExact()}
                    disabled={deleting || !originalException}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-full border border-destructive/40 bg-destructive/5 px-5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? t("common.saving", "Saving...") : t("common.delete", "Delete")}
                  </button>
                  <Link
                    to={dashboardPath}
                    className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                  >
                    {t("common.close", "Close")}
                  </Link>
                </div>
              )}
            </footer>
          </section>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
