import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { notifier } from "@/services/NotificationService";
import { cn } from "@/lib/utils";
import { starsApi } from "../api/rewardsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { FAMILY_TASK_ROUTES } from "../constants/routes";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ApiPageResponse, ChildProfileDto, StarLedgerEntryDto } from "../models/dto";

const MAX_REASON_LENGTH = 255;
const PAGE_SIZE = 20;
const PAGINATION_DEBOUNCE_MS = 250;
const FIELD_BLOCK_CLASS = "space-y-2";
const FIELD_LABEL_CLASS = "block text-sm font-medium text-foreground";
const SMALL_SCREEN_MAX_WIDTH_QUERY = "(max-width: 1023px)";

type AdjustmentDirection = "ADD" | "SUBTRACT";

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toInteger(value: unknown, fallback = 0): number {
  const resolved = asFiniteNumber(value);
  if (resolved === null) {
    return fallback;
  }

  return Math.trunc(resolved);
}

function toNonNegativeInteger(value: unknown, fallback = 0): number {
  return Math.max(0, toInteger(value, fallback));
}

function formatDateTime(value: string, locale: string, fallback: string, compact = false): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  if (compact) {
    return new Intl.DateTimeFormat(locale, {
      year: "2-digit",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(new Date(parsed))
      .replace(/,\s*/g, " ");
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function normalizeReason(value: string): string {
  return value.trim().slice(0, MAX_REASON_LENGTH);
}

function resolveProfileBadge(profile: ChildProfileDto): string {
  if (profile.avatarEmoji?.trim()) {
    return profile.avatarEmoji.trim();
  }

  const initials = profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "👤";
}

function useIsSmallScreen() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(SMALL_SCREEN_MAX_WIDTH_QUERY);
    const update = () => setIsSmallScreen(mediaQueryList.matches);
    update();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", update);
      return () => mediaQueryList.removeEventListener("change", update);
    }

    mediaQueryList.addListener(update);
    return () => mediaQueryList.removeListener(update);
  }, []);

  return isSmallScreen;
}

export function StarsAdjustmentsPage() {
  const { t, i18n } = useTranslation();
  const isSmallScreen = useIsSmallScreen();
  useTrackFamilyTaskPageView("stars_adjustments");
  const { getErrorMessage } = useApiErrorHandler();

  const { profiles, loading: familyLoading, error: familyError, refetch: refetchFamilyContext } = useFamilyContext();

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles]);
  const profileByUuid = useMemo(
    () => new Map(activeProfiles.map((profile) => [profile.profileUuid, profile])),
    [activeProfiles]
  );

  const [selectedProfileUuid, setSelectedProfileUuid] = useState("");
  const [direction, setDirection] = useState<AdjustmentDirection>("ADD");
  const [starsAmount, setStarsAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [debouncedPageIndex, setDebouncedPageIndex] = useState(0);

  const [balance, setBalance] = useState<number | null>(null);
  const [entriesPage, setEntriesPage] = useState<ApiPageResponse<StarLedgerEntryDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (activeProfiles.length === 0) {
      setSelectedProfileUuid("");
      return;
    }

    setSelectedProfileUuid((current) => {
      if (current && activeProfiles.some((profile) => profile.profileUuid === current)) {
        return current;
      }

      return activeProfiles[0].profileUuid;
    });
  }, [activeProfiles]);

  useEffect(() => {
    setPageIndex(0);
    setDebouncedPageIndex(0);
  }, [selectedProfileUuid]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedPageIndex(pageIndex);
    }, PAGINATION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pageIndex]);

  const loadStarsData = useCallback(
    async (profileUuid: string, nextPage: number, showLoader: boolean) => {
      if (!profileUuid) {
        setBalance(null);
        setEntriesPage(null);
        setLoading(false);
        setScreenError(null);
        return;
      }

      const requestId = ++requestIdRef.current;

      if (showLoader) {
        setLoading(true);
      }
      setScreenError(null);

      try {
        const [nextBalances, nextEntriesPage] = await Promise.all([
          starsApi.getBalances({ secondaryProfileUuids: [profileUuid] }),
          starsApi.getEntries({
            secondaryProfileUuid: profileUuid,
            page: nextPage,
            size: PAGE_SIZE,
            sort: "createdDate,desc",
          }),
        ]);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const resolvedBalance =
          nextBalances.find((entry) => entry.secondaryProfileUuid === profileUuid)?.balance ?? nextBalances[0]?.balance;
        setBalance(asFiniteNumber(resolvedBalance));
        setEntriesPage(nextEntriesPage);

        const serverPageable = (nextEntriesPage as { pageable?: { pageNumber?: unknown } }).pageable;
        const resolvedServerPage = toNonNegativeInteger(nextEntriesPage.number ?? serverPageable?.pageNumber, nextPage);
        if (resolvedServerPage !== nextPage) {
          setPageIndex(resolvedServerPage);
          setDebouncedPageIndex(resolvedServerPage);
        }
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setBalance(null);
        setEntriesPage(null);
        setScreenError(
          getErrorMessage(error, {
            fallbackKey: "familyTask.errors.starManagementLoad",
            fallbackMessage: "Failed to load stars data.",
          })
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [getErrorMessage]
  );

  useEffect(() => {
    void loadStarsData(selectedProfileUuid, debouncedPageIndex, true);
  }, [debouncedPageIndex, loadStarsData, selectedProfileUuid]);

  const selectedProfileName = selectedProfileUuid ? (profileByUuid.get(selectedProfileUuid)?.displayName ?? "") : "";
  const normalizedReason = normalizeReason(reason);
  const effectiveAmount = Math.max(1, Math.trunc(starsAmount) || 1);
  const canSubmit = selectedProfileUuid.length > 0 && normalizedReason.length > 0 && effectiveAmount > 0 && !saving;

  const entries = Array.isArray(entriesPage?.content) ? entriesPage.content : [];
  const pageable = (entriesPage as { pageable?: { pageNumber?: unknown; pageSize?: unknown } } | null)?.pageable;
  const resolvedPageSize = Math.max(1, toNonNegativeInteger(entriesPage?.size ?? pageable?.pageSize, PAGE_SIZE));
  const resolvedPageNumber = toNonNegativeInteger(entriesPage?.number ?? pageable?.pageNumber, pageIndex);
  const resolvedTotalElements = toNonNegativeInteger(entriesPage?.totalElements, entries.length);
  const resolvedNumberOfElements = toNonNegativeInteger(entriesPage?.numberOfElements, entries.length);
  const inferredTotalPages = resolvedTotalElements > 0 ? Math.ceil(resolvedTotalElements / resolvedPageSize) : 1;
  const resolvedTotalPages = Math.max(1, toNonNegativeInteger(entriesPage?.totalPages, inferredTotalPages));
  const safeCurrentPage = Math.min(resolvedPageNumber, Math.max(0, resolvedTotalPages - 1));
  const countOnPage = Math.min(resolvedPageSize, resolvedNumberOfElements || entries.length);
  const pageStart =
    resolvedTotalElements === 0 ? 0 : Math.min(resolvedTotalElements, safeCurrentPage * resolvedPageSize + 1);
  const pageEnd =
    resolvedTotalElements === 0
      ? 0
      : Math.min(resolvedTotalElements, Math.max(pageStart, safeCurrentPage * resolvedPageSize + countOnPage));
  const canGoPrev = safeCurrentPage > 0;
  const canGoNext = safeCurrentPage + 1 < resolvedTotalPages && pageEnd < resolvedTotalElements;
  const renderedBalance = balance === null ? null : asFiniteNumber(balance);
  const hasProfiles = !familyLoading && activeProfiles.length > 0;

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.stars.manageTitle", "Adjust Stars")}
        </h1>
      </div>
    ),
    [t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const deltaStars = direction === "ADD" ? effectiveAmount : -effectiveAmount;

    setSaving(true);
    setScreenError(null);

    try {
      await starsApi.createAdjustment({
        secondaryProfileUuid: selectedProfileUuid,
        deltaStars,
        reason: normalizedReason,
      });

      notifier.success(t("familyTask.stars.saved", "Stars adjustment saved."));
      setReason("");
      setStarsAmount(1);

      if (pageIndex !== 0) {
        setPageIndex(0);
        setDebouncedPageIndex(0);
      } else {
        await loadStarsData(selectedProfileUuid, 0, false);
      }
    } catch (error: unknown) {
      setScreenError(
        getErrorMessage(error, {
          fallbackKey: "familyTask.errors.starAdjustmentSave",
          fallbackMessage: "Failed to save stars adjustment.",
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-background bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
      <ParentFeatureGate featureId="stars_adjustments">
        <div className="mx-auto flex h-full w-full min-w-0 flex-col gap-4">
          {familyError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(familyError, "Failed to load family context.")}</span>
              <button type="button" className="font-medium underline" onClick={() => void refetchFamilyContext()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {screenError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              {t(screenError, "Failed to load stars data.")}
            </div>
          ) : null}

          {!familyLoading && !hasProfiles ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
              {t("familyTask.profiles.noProfiles", "No child profiles yet.")}
            </div>
          ) : null}

          {hasProfiles ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(150px,190px)] gap-3">
                  <div className={FIELD_BLOCK_CLASS}>
                    <span className={FIELD_LABEL_CLASS}>{t("familyTask.stars.child", "Child Profile")}</span>
                    <Select value={selectedProfileUuid} onValueChange={setSelectedProfileUuid}>
                      <SelectTrigger className="h-11 w-full rounded-xl border-input bg-background px-3 text-sm">
                        <SelectValue placeholder={t("familyTask.stars.child", "Child Profile")}>
                          {selectedProfileName || undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeProfiles.map((profile) => (
                          <SelectItem key={profile.profileUuid} value={profile.profileUuid}>
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <NotoEmoji emoji={resolveProfileBadge(profile)} size={18} fallback="👤" />
                              <span className="truncate">{profile.displayName}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(FIELD_LABEL_CLASS, "text-right")}>
                      {t("familyTask.stars.currentBalance", "Current Balance")}
                    </span>
                    <div className="flex items-center">
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
                        <Star className="size-4" />
                        {renderedBalance ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={FIELD_BLOCK_CLASS}>
                  <span className={FIELD_LABEL_CLASS}>{t("familyTask.stars.adjustmentType", "Adjustment Type")}</span>
                  <div className="grid grid-cols-[128px_1fr_1fr] gap-2">
                    <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-background px-3">
                      <Star className="size-4 text-amber-500" />
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={effectiveAmount}
                        onChange={(event) => {
                          const nextValue = Math.trunc(Number(event.target.value));
                          setStarsAmount(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1);
                        }}
                        className="w-full bg-transparent text-center text-sm font-semibold text-foreground outline-none"
                        aria-label={t("familyTask.stars.amount", "Stars Amount")}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setDirection("ADD")}
                      className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                        direction === "ADD"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      <ArrowUpCircle className="size-4" />
                      {t("familyTask.stars.add", "Add")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDirection("SUBTRACT")}
                      className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                        direction === "SUBTRACT"
                          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-200"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      <ArrowDownCircle className="size-4" />
                      {t("familyTask.stars.subtract", "Subtract")}
                    </button>
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className={FIELD_LABEL_CLASS}>{t("familyTask.stars.reason", "Reason")}</span>
                  <input
                    value={reason}
                    maxLength={MAX_REASON_LENGTH}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t(
                      "familyTask.stars.reasonPlaceholder",
                      "MANUAL_BONUS_WEEKEND_HELP or MANUAL_CORRECTION"
                    )}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  />
                  <span className="block text-xs text-muted-foreground">
                    {reason.length}/{MAX_REASON_LENGTH}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <Link
                    to={FAMILY_TASK_ROUTES.rewards}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <ArrowLeft className="mr-1 size-4" />
                    {t("common.back", "Back")}
                  </Link>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="h-11 flex-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? t("common.saving", "Saving...")
                      : direction === "ADD"
                        ? t("familyTask.stars.addStars", "Add Stars")
                        : t("familyTask.stars.subtractStars", "Subtract Stars")}
                  </button>
                </div>
              </form>

              <section className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80">
                <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {t("familyTask.stars.ledgerTitle", "Stars Ledger")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t("familyTask.stars.ledgerSubtitle", "Latest entries for selected child profile")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.stars.totalEntries", "Total: {{count}}", { count: resolvedTotalElements })}
                  </p>
                </header>

                <div className="min-h-0 flex-1 overflow-auto">
                  {loading && entries.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">{t("common.loading", "Loading...")}</div>
                  ) : null}

                  {!loading && entries.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      {t("familyTask.stars.noEntries", "No stars entries found.")}
                    </div>
                  ) : null}

                  {entries.length > 0 ? (
                    <table className="w-full min-w-[420px] table-fixed text-sm sm:min-w-[560px]">
                      <colgroup>
                        <col className="w-[7.25rem] sm:w-[10.25rem] md:w-[11.25rem]" />
                        <col className="w-[4.75rem] sm:w-[5.5rem]" />
                        <col />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-[0.08em] text-muted-foreground backdrop-blur">
                        <tr>
                          <th className="px-2 py-2 text-left sm:px-4">{t("familyTask.stars.date", "Date")}</th>
                          <th className="px-2 py-2 text-right sm:px-4">{t("familyTask.stars.delta", "Delta")}</th>
                          <th className="px-2 py-2 text-left sm:px-4">{t("familyTask.stars.reason", "Reason")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => {
                          const deltaStars = toInteger(entry.deltaStars, 0);
                          const isPositive = deltaStars > 0;
                          const dateLabel = formatDateTime(
                            entry.createdDate,
                            i18n.language,
                            t("familyTask.redemptions.noDate", "Unknown date"),
                            isSmallScreen
                          );
                          const entryProfile = profileByUuid.get(entry.secondaryProfileUuid);
                          const reasonLabel = entry.reason?.trim() || t("familyTask.stars.noReason", "No reason");
                          const profileLabel = entryProfile?.displayName ?? t("familyTask.profiles.unknown", "Unknown");

                          return (
                            <tr key={entry.uuid} className="border-t border-border">
                              <td className="px-2 py-2.5 text-foreground sm:px-4 sm:py-3">
                                <span className="block truncate" title={dateLabel}>
                                  {dateLabel}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 text-right sm:px-4 sm:py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-1.5 py-0.5 text-[11px] font-semibold sm:px-2 sm:py-1 sm:text-xs",
                                    isPositive
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200"
                                  )}
                                >
                                  {isPositive ? `+${deltaStars}` : deltaStars}
                                </span>
                              </td>
                              <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                                <div className="space-y-0.5">
                                  <p className="truncate font-medium text-foreground" title={reasonLabel}>
                                    {reasonLabel}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground" title={profileLabel}>
                                    {profileLabel}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : null}
                </div>

                {entriesPage ? (
                  <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {t("familyTask.stars.pageSummary", "{{from}}-{{to}} of {{total}}", {
                        from: pageStart,
                        to: pageEnd,
                        total: resolvedTotalElements,
                      })}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                        disabled={!canGoPrev || loading}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ChevronLeft className="size-3.5" />
                        {t("common.previous", "Previous")}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {t("familyTask.stars.pageNumber", "Page {{current}}/{{total}}", {
                          current: safeCurrentPage + 1,
                          total: resolvedTotalPages,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPageIndex((current) => Math.min(Math.max(0, resolvedTotalPages - 1), current + 1))
                        }
                        disabled={!canGoNext || loading}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("common.next", "Next")}
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </footer>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
