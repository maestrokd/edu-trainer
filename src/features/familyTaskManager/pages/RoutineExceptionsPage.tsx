import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { cn } from "@/lib/utils";
import { routineExceptionsApi } from "../api/routineExceptionsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { FAMILY_TASK_ROUTES } from "../constants/routes";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useRoutines } from "../hooks/useRoutines";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ApiPagedItemsResponse, RoutineExceptionDto, RoutineExceptionsQuery } from "../models/dto";
import { FamilyRoutineExceptionType } from "../models/enums";

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface RoutineExceptionsUrlFilters {
  assigneeProfileUuid: string | null;
  createdByProfileUuid: string | null;
  exceptionType: FamilyRoutineExceptionType | null;
  fromDate: string;
  toDate: string;
  searchString: string;
  page: number;
  size: number;
}

function toNonNegativeInteger(value: string | null, fallback = 0): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.floor(parsed));
}

function toPageSize(value: string | null, fallback = DEFAULT_PAGE_SIZE): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function parseRoutineExceptionsUrlFilters(searchParams: URLSearchParams): RoutineExceptionsUrlFilters {
  const exceptionTypeParam = searchParams.get("exceptionType");
  const exceptionType = exceptionTypeParam === FamilyRoutineExceptionType.SKIP ? FamilyRoutineExceptionType.SKIP : null;

  return {
    assigneeProfileUuid: searchParams.get("assigneeProfileUuid")?.trim() || null,
    createdByProfileUuid: searchParams.get("createdByProfileUuid")?.trim() || null,
    exceptionType,
    fromDate: searchParams.get("fromDate")?.trim() || "",
    toDate: searchParams.get("toDate")?.trim() || "",
    searchString: searchParams.get("searchString")?.trim() || "",
    page: toNonNegativeInteger(searchParams.get("page")),
    size: toPageSize(searchParams.get("size")),
  };
}

function serializeRoutineExceptionsUrlFilters(filters: RoutineExceptionsUrlFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.assigneeProfileUuid) {
    params.set("assigneeProfileUuid", filters.assigneeProfileUuid);
  }

  if (filters.createdByProfileUuid) {
    params.set("createdByProfileUuid", filters.createdByProfileUuid);
  }

  if (filters.exceptionType) {
    params.set("exceptionType", filters.exceptionType);
  }

  if (filters.fromDate) {
    params.set("fromDate", filters.fromDate);
  }

  if (filters.toDate) {
    params.set("toDate", filters.toDate);
  }

  if (filters.searchString.trim()) {
    params.set("searchString", filters.searchString.trim());
  }

  if (filters.page > 0) {
    params.set("page", String(filters.page));
  }

  if (filters.size !== DEFAULT_PAGE_SIZE) {
    params.set("size", String(filters.size));
  }

  return params;
}

function formatDate(value: string, locale: string, fallback: string): string {
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

export function RoutineExceptionsPage() {
  const { t, i18n } = useTranslation();
  useTrackFamilyTaskPageView("routine_exceptions");
  const { getErrorMessage } = useApiErrorHandler();
  const {
    profiles,
    members,
    loading: familyLoading,
    error: familyError,
    refetch: refetchFamilyContext,
  } = useFamilyContext();
  const { routines, loading: routinesLoading, error: routinesError, refetch: refetchRoutines } = useRoutines();

  const { routineUuid: routeRoutineUuidRaw } = useParams<{ routineUuid: string }>();
  const routeRoutineUuid = routeRoutineUuidRaw?.trim() || "";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => parseRoutineExceptionsUrlFilters(searchParams), [searchParams]);
  const serializedUrlFilters = useMemo(() => serializeRoutineExceptionsUrlFilters(urlFilters).toString(), [urlFilters]);

  const [searchDraft, setSearchDraft] = useState(urlFilters.searchString);
  const [debouncedSearchString, setDebouncedSearchString] = useState(urlFilters.searchString);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftAssigneeProfileUuid, setDraftAssigneeProfileUuid] = useState(urlFilters.assigneeProfileUuid ?? "");
  const [draftCreatedByProfileUuid, setDraftCreatedByProfileUuid] = useState(urlFilters.createdByProfileUuid ?? "");
  const [draftExceptionType, setDraftExceptionType] = useState(urlFilters.exceptionType ?? "");
  const [draftFromDate, setDraftFromDate] = useState(urlFilters.fromDate);
  const [draftToDate, setDraftToDate] = useState(urlFilters.toDate);
  const [draftSize, setDraftSize] = useState(urlFilters.size);

  const [exceptionsPage, setExceptionsPage] = useState<ApiPagedItemsResponse<RoutineExceptionDto> | null>(null);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [exceptionsError, setExceptionsError] = useState<string | null>(null);
  const [deletingExceptionUuid, setDeletingExceptionUuid] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const updateUrlFilters = useCallback(
    (next: RoutineExceptionsUrlFilters, replace = false) => {
      const nextParams = serializeRoutineExceptionsUrlFilters(next);
      if (nextParams.toString() === serializedUrlFilters) {
        return;
      }

      setSearchParams(nextParams, { replace });
    },
    [serializedUrlFilters, setSearchParams]
  );

  useEffect(() => {
    setSearchDraft(urlFilters.searchString);
    setDebouncedSearchString(urlFilters.searchString);
  }, [urlFilters.searchString]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchString(searchDraft.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchDraft]);

  useEffect(() => {
    if (debouncedSearchString === urlFilters.searchString) {
      return;
    }

    updateUrlFilters({ ...urlFilters, searchString: debouncedSearchString, page: 0 }, true);
  }, [debouncedSearchString, updateUrlFilters, urlFilters]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    setDraftAssigneeProfileUuid(urlFilters.assigneeProfileUuid ?? "");
    setDraftCreatedByProfileUuid(urlFilters.createdByProfileUuid ?? "");
    setDraftExceptionType(urlFilters.exceptionType ?? "");
    setDraftFromDate(urlFilters.fromDate);
    setDraftToDate(urlFilters.toDate);
    setDraftSize(urlFilters.size);
  }, [
    filtersOpen,
    urlFilters.assigneeProfileUuid,
    urlFilters.createdByProfileUuid,
    urlFilters.exceptionType,
    urlFilters.fromDate,
    urlFilters.size,
    urlFilters.toDate,
  ]);

  const exceptionsQuery = useMemo<RoutineExceptionsQuery>(
    () => ({
      assigneeProfileUuid: urlFilters.assigneeProfileUuid ?? undefined,
      createdByProfileUuid: urlFilters.createdByProfileUuid ?? undefined,
      exceptionType: urlFilters.exceptionType ?? undefined,
      fromDate: urlFilters.fromDate || undefined,
      toDate: urlFilters.toDate || undefined,
      searchString: debouncedSearchString || undefined,
      page: urlFilters.page,
      size: urlFilters.size,
      sort: ["exceptionDate,asc", "createdDate,asc"],
    }),
    [
      debouncedSearchString,
      urlFilters.assigneeProfileUuid,
      urlFilters.createdByProfileUuid,
      urlFilters.exceptionType,
      urlFilters.fromDate,
      urlFilters.page,
      urlFilters.size,
      urlFilters.toDate,
    ]
  );

  const loadExceptions = useCallback(async () => {
    if (!routeRoutineUuid) {
      setExceptionsPage(null);
      setExceptionsLoading(false);
      setExceptionsError(t("familyTask.errors.routineLoad", "Failed to load routine."));
      return;
    }

    const requestId = ++requestIdRef.current;
    setExceptionsLoading(true);
    setExceptionsError(null);

    try {
      const nextPage = await routineExceptionsApi.getAll(routeRoutineUuid, exceptionsQuery);
      if (requestId !== requestIdRef.current) {
        return;
      }

      setExceptionsPage(nextPage);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setExceptionsPage(null);
      setExceptionsError(
        getErrorMessage(error, {
          fallbackKey: "familyTask.errors.routineExceptions",
          fallbackMessage: "Failed to load routine exceptions.",
        })
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setExceptionsLoading(false);
      }
    }
  }, [exceptionsQuery, getErrorMessage, routeRoutineUuid, t]);

  useEffect(() => {
    void loadExceptions();
  }, [loadExceptions]);

  useEffect(() => {
    if (!exceptionsPage) {
      return;
    }

    const serverPage = Math.max(0, exceptionsPage.page);
    if (serverPage !== urlFilters.page) {
      updateUrlFilters({ ...urlFilters, page: serverPage }, true);
    }
  }, [exceptionsPage, updateUrlFilters, urlFilters]);

  const routinesByUuid = useMemo(() => new Map(routines.map((routine) => [routine.uuid, routine])), [routines]);
  const selectedRoutine = routeRoutineUuid ? (routinesByUuid.get(routeRoutineUuid) ?? null) : null;

  const assigneeNameByUuid = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.profileUuid, profile.displayName])),
    [profiles]
  );
  const actorNameByProfileUuid = useMemo(
    () => Object.fromEntries(members.map((member) => [member.profileUuid, member.displayName])),
    [members]
  );

  const items = exceptionsPage?.items ?? [];
  const currentPage = Math.max(0, exceptionsPage?.page ?? urlFilters.page);
  const pageSize = Math.max(1, exceptionsPage?.requestedSize ?? urlFilters.size);
  const totalItems = Math.max(0, exceptionsPage?.totalItems ?? 0);
  const totalPages = Math.max(1, exceptionsPage?.totalPages ?? 1);
  const pageStart = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(totalItems, pageStart + items.length - 1);
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage + 1 < totalPages;

  const hasActiveFilters = Boolean(
    urlFilters.assigneeProfileUuid ||
      urlFilters.createdByProfileUuid ||
      urlFilters.exceptionType ||
      urlFilters.fromDate ||
      urlFilters.toDate ||
      urlFilters.size !== DEFAULT_PAGE_SIZE
  );
  const activeFiltersCount =
    Number(Boolean(urlFilters.assigneeProfileUuid)) +
    Number(Boolean(urlFilters.createdByProfileUuid)) +
    Number(Boolean(urlFilters.exceptionType)) +
    Number(Boolean(urlFilters.fromDate)) +
    Number(Boolean(urlFilters.toDate)) +
    Number(urlFilters.size !== DEFAULT_PAGE_SIZE);
  const hasSearchFilter = Boolean(urlFilters.searchString);

  const clearAppliedFilters = () => {
    updateUrlFilters(
      {
        ...urlFilters,
        assigneeProfileUuid: null,
        createdByProfileUuid: null,
        exceptionType: null,
        fromDate: "",
        toDate: "",
        searchString: "",
        size: DEFAULT_PAGE_SIZE,
        page: 0,
      },
      false
    );
    setSearchDraft("");
    setDebouncedSearchString("");
  };

  const handleDeleteException = async (exception: RoutineExceptionDto) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setDeletingExceptionUuid(exception.uuid);

    try {
      await routineExceptionsApi.reopen(exception.routineUuid, {
        fromDate: exception.exceptionDate,
        toDate: exception.exceptionDate,
        assigneeProfileUuids: [exception.assigneeProfileUuid],
      });
      await loadExceptions();
    } catch (error: unknown) {
      setExceptionsError(
        getErrorMessage(error, {
          fallbackKey: "familyTask.errors.routineExceptionDelete",
          fallbackMessage: "Failed to delete routine exception.",
        })
      );
    } finally {
      setDeletingExceptionUuid(null);
    }
  };

  const applyFilterDraft = () => {
    updateUrlFilters(
      {
        ...urlFilters,
        assigneeProfileUuid: draftAssigneeProfileUuid || null,
        createdByProfileUuid: draftCreatedByProfileUuid || null,
        exceptionType: draftExceptionType === FamilyRoutineExceptionType.SKIP ? FamilyRoutineExceptionType.SKIP : null,
        fromDate: draftFromDate,
        toDate: draftToDate,
        size: Math.max(1, draftSize),
        page: 0,
      },
      false
    );
    setFiltersOpen(false);
  };

  const resetFilterDraft = () => {
    setDraftAssigneeProfileUuid("");
    setDraftCreatedByProfileUuid("");
    setDraftExceptionType("");
    setDraftFromDate("");
    setDraftToDate("");
    setDraftSize(DEFAULT_PAGE_SIZE);
  };

  const openCreatePath = routeRoutineUuid
    ? `${FAMILY_TASK_ROUTES.routineExceptionsNewForRoutine(routeRoutineUuid)}?mode=create`
    : FAMILY_TASK_ROUTES.routines;
  const routineBackPath = routeRoutineUuid
    ? `${FAMILY_TASK_ROUTES.routines}/${encodeURIComponent(routeRoutineUuid)}`
    : FAMILY_TASK_ROUTES.routines;

  const refreshPage = async () => {
    await Promise.all([refetchFamilyContext(), refetchRoutines()]);
    await loadExceptions();
  };

  const pageLoading = familyLoading || routinesLoading || exceptionsLoading;
  const hasBlockingError = Boolean(familyError || routinesError || exceptionsError);

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.routineExceptions.title", "Routine Exceptions")}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden w-[300px] items-center lg:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t("familyTask.routineExceptions.searchPlaceholder", "Search note")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={t("common.filters", "Filters")}
            title={t("common.filters", "Filters")}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent sm:px-3.5",
              hasActiveFilters && "border-primary/40 bg-primary/10 text-primary"
            )}
          >
            <Filter className="size-4" />
            <span className="hidden min-[561px]:inline">{t("common.filters", "Filters")}</span>
            {activeFiltersCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>

          <Link
            to={routineBackPath}
            aria-label={t("common.back", "Back")}
            title={t("common.back", "Back")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent sm:px-3.5"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden min-[561px]:inline">{t("common.back", "Back")}</span>
          </Link>

          <Link
            to={openCreatePath}
            aria-label={t("familyTask.routineExceptions.new", "New exception")}
            title={t("familyTask.routineExceptions.new", "New exception")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-3.5"
          >
            <Plus className="size-4" />
            <span className="hidden min-[561px]:inline">{t("common.new", "New")}</span>
          </Link>
        </div>
      </div>
    ),
    [activeFiltersCount, hasActiveFilters, openCreatePath, routineBackPath, searchDraft, t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  if (!routeRoutineUuid) {
    return (
      <FamilyTaskPageShell>
        <div className="text-muted-foreground">{t("familyTask.errors.routineLoad", "Failed to load routine.")}</div>
      </FamilyTaskPageShell>
    );
  }

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-background bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
      <ParentFeatureGate featureId="routine_exceptions">
        <div className="mx-auto flex h-full w-full min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t("familyTask.routineExceptions.searchPlaceholder", "Search note")}
                className="h-10 rounded-full border-border bg-card/80 pl-9 pr-3 text-sm shadow-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent",
                hasActiveFilters && "border-primary/40 bg-primary/10 text-primary"
              )}
            >
              <Filter className="size-4" />
              {activeFiltersCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground lg:hidden">
              <span className="font-medium">{t("common.filters", "Filters")}:</span>
              {urlFilters.assigneeProfileUuid ? (
                <span className="rounded-full bg-background px-2 py-0.5">
                  {t("familyTask.chores.form.assignedTo", "Assigned To")}
                </span>
              ) : null}
              {urlFilters.createdByProfileUuid ? (
                <span className="rounded-full bg-background px-2 py-0.5">
                  {t("familyTask.routineExceptions.createdBy", "Created by")}
                </span>
              ) : null}
              {urlFilters.exceptionType ? (
                <span className="rounded-full bg-background px-2 py-0.5">{urlFilters.exceptionType}</span>
              ) : null}
              {urlFilters.fromDate ? (
                <span className="rounded-full bg-background px-2 py-0.5">{urlFilters.fromDate}</span>
              ) : null}
              {urlFilters.toDate ? (
                <span className="rounded-full bg-background px-2 py-0.5">{urlFilters.toDate}</span>
              ) : null}
              {urlFilters.size !== DEFAULT_PAGE_SIZE ? (
                <span className="rounded-full bg-background px-2 py-0.5">
                  {t("common.pageSize", "Page size")}: {urlFilters.size}
                </span>
              ) : null}
              <button type="button" onClick={clearAppliedFilters} className="font-semibold underline">
                {t("common.clear", "Clear")}
              </button>
            </div>
          ) : null}

          {familyError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(familyError, "Failed to load family context.")}</span>
              <button type="button" className="font-medium underline" onClick={() => void refreshPage()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {routinesError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(routinesError, "Failed to load routines.")}</span>
              <button type="button" className="font-medium underline" onClick={() => void refreshPage()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {exceptionsError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(exceptionsError, "Failed to load routine exceptions.")}</span>
              <button type="button" className="font-medium underline" onClick={() => void loadExceptions()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("familyTask.routines.title", "Routines")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {selectedRoutine
                ? `${selectedRoutine.emoji ? `${selectedRoutine.emoji} ` : ""}${selectedRoutine.title}`
                : routeRoutineUuid}
            </p>
            {selectedRoutine ? (
              <p className="text-xs text-muted-foreground">
                {selectedRoutine.routineSlot} · {selectedRoutine.recurrenceType}
                {selectedRoutine.weekdays ? ` (${selectedRoutine.weekdays})` : ""} · ⭐ {selectedRoutine.starsReward}
              </p>
            ) : null}
          </div>

          <section className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("familyTask.routineExceptions.forRoutine", "Exceptions for {{routine}}", {
                    routine: selectedRoutine?.title ?? routeRoutineUuid,
                  })}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("familyTask.routineExceptions.total", "Total: {{count}}", { count: totalItems })}
                </p>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto">
              {pageLoading && !hasBlockingError && items.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">{t("common.loading", "Loading...")}</div>
              ) : null}

              {!familyLoading && !routinesLoading && !exceptionsLoading && !hasBlockingError && items.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  {hasActiveFilters || hasSearchFilter
                    ? t("familyTask.dashboard.filtersEmpty", "No tasks in the enabled filters.")
                    : t("familyTask.routineExceptions.empty", "No exceptions found.")}
                </div>
              ) : null}

              {items.length > 0 ? (
                <table className="w-full min-w-[900px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[130px]" />
                    <col className="w-[180px]" />
                    <col className="w-[110px]" />
                    <col />
                    <col className="w-[180px]" />
                    <col className="w-[180px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-[0.08em] text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="px-4 py-2 text-left">{t("familyTask.routineExceptions.date", "Date")}</th>
                      <th className="px-4 py-2 text-left">{t("familyTask.chores.form.assignedTo", "Assigned To")}</th>
                      <th className="px-4 py-2 text-left">{t("familyTask.routineExceptions.type", "Type")}</th>
                      <th className="px-4 py-2 text-left">{t("familyTask.routineExceptions.note", "Note")}</th>
                      <th className="px-4 py-2 text-left">
                        {t("familyTask.routineExceptions.createdBy", "Created by")}
                      </th>
                      <th className="px-4 py-2 text-left">{t("common.createdDate", "Created")}</th>
                      <th className="px-4 py-2 text-right">{t("common.actions", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((exception) => {
                      const assigneeName =
                        assigneeNameByUuid[exception.assigneeProfileUuid] ??
                        t("familyTask.profiles.unknown", "Unknown");
                      const actorName =
                        actorNameByProfileUuid[exception.createdByProfileUuid] ??
                        t("familyTask.profiles.unknown", "Unknown");
                      const detailsPath = `${FAMILY_TASK_ROUTES.routineExceptionDetailsForRoutine(
                        exception.routineUuid,
                        exception.uuid
                      )}?assigneeProfileUuid=${encodeURIComponent(
                        exception.assigneeProfileUuid
                      )}&exceptionDate=${encodeURIComponent(exception.exceptionDate)}`;

                      return (
                        <tr key={exception.uuid} className="border-t border-border">
                          <td className="px-4 py-3 text-foreground">
                            {formatDate(
                              exception.exceptionDate,
                              i18n.language,
                              t("familyTask.redemptions.noDate", "Unknown date")
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">{assigneeName}</td>
                          <td className="px-4 py-3 text-foreground">{exception.exceptionType}</td>
                          <td className="px-4 py-3 text-muted-foreground">{exception.note ?? "—"}</td>
                          <td className="px-4 py-3 text-foreground">{actorName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDateTime(
                              exception.createdDate,
                              i18n.language,
                              t("familyTask.redemptions.noDate", "Unknown date")
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={detailsPath}
                                state={{ exception }}
                                className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                aria-label={t("common.details", "Details")}
                                title={t("common.details", "Details")}
                              >
                                <Eye className="size-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => void handleDeleteException(exception)}
                                disabled={deletingExceptionUuid === exception.uuid}
                                className="inline-flex size-8 items-center justify-center rounded-full border border-destructive/30 bg-background text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={t("common.delete", "Delete")}
                                title={t("common.delete", "Delete")}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("familyTask.stars.pageSummary", "{{from}}-{{to}} of {{total}}", {
                  from: pageStart,
                  to: pageEnd,
                  total: totalItems,
                })}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateUrlFilters(
                      {
                        ...urlFilters,
                        page: Math.max(0, currentPage - 1),
                      },
                      false
                    )
                  }
                  disabled={!canGoPrev || exceptionsLoading}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ChevronLeft className="size-3.5" />
                  {t("common.previous", "Previous")}
                </button>
                <span className="text-xs text-muted-foreground">
                  {t("familyTask.stars.pageNumber", "Page {{current}}/{{total}}", {
                    current: currentPage + 1,
                    total: totalPages,
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateUrlFilters(
                      {
                        ...urlFilters,
                        page: Math.min(Math.max(0, totalPages - 1), currentPage + 1),
                      },
                      false
                    )
                  }
                  disabled={!canGoNext || exceptionsLoading}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("common.next", "Next")}
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </ParentFeatureGate>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-[min(94vw,560px)] rounded-3xl border border-border/80 bg-popover/95 p-5 shadow-2xl sm:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "familyTask.routineExceptions.filtersHint",
                  "Filter routine exceptions by assignee, creator, type, and date range."
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.chores.form.assignedTo", "Assigned To")}
                </p>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={draftAssigneeProfileUuid}
                  onChange={(event) => setDraftAssigneeProfileUuid(event.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {profiles.map((profile) => (
                    <option key={profile.profileUuid} value={profile.profileUuid}>
                      {profile.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.routineExceptions.createdBy", "Created by")}
                </p>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={draftCreatedByProfileUuid}
                  onChange={(event) => setDraftCreatedByProfileUuid(event.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {members.map((member) => (
                    <option key={member.memberUuid} value={member.profileUuid}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.routineExceptions.type", "Exception type")}
                </p>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={draftExceptionType}
                  onChange={(event) => setDraftExceptionType(event.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  <option value={FamilyRoutineExceptionType.SKIP}>{FamilyRoutineExceptionType.SKIP}</option>
                </select>
              </label>

              <label className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.routineExceptions.fromDate", "From date")}
                </p>
                <input
                  type="date"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={draftFromDate}
                  onChange={(event) => setDraftFromDate(event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.routineExceptions.toDate", "To date")}
                </p>
                <input
                  type="date"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={draftToDate}
                  onChange={(event) => setDraftToDate(event.target.value)}
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <p className="text-sm font-medium text-foreground">{t("common.pageSize", "Page size")}</p>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  value={String(draftSize)}
                  onChange={(event) => setDraftSize(toPageSize(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                    <option key={sizeOption} value={String(sizeOption)}>
                      {sizeOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={clearAppliedFilters}
                className="inline-flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {t("common.clear", "Clear")}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetFilterDraft}
                  className="inline-flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                >
                  {t("common.reset", "Reset")}
                </button>
                <button
                  type="button"
                  onClick={applyFilterDraft}
                  className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("common.apply", "Apply")}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FamilyTaskPageShell>
  );
}
