import { Filter, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { cn } from "@/lib/utils";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { RewardLabelDropdown } from "../components/rewards/RewardLabelDropdown";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { PROFILE_FALLBACK_COLORS, hexToRgba } from "../domain/dashboard/color";
import {
  groupRedemptionsByProfileDate,
  isKnownRedemptionDateKey,
  resolveRedemptionDate,
} from "../domain/dashboard/redemptions";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useRewardRedemptions } from "../hooks/useRewards";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ChildProfileDto, RewardLabelDto, RewardRedemptionsQuery } from "../models/dto";
import { FamilyRewardLabelKind, FamilyRewardLabelMatchMode, FamilyRewardRedemptionStatus } from "../models/enums";

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

const SEARCH_DEBOUNCE_MS = 300;

interface RewardsUrlFilters {
  active: boolean;
  searchString: string;
  primaryLabelUuid: string | null;
  labelUuids: string[];
  labelMatchMode: (typeof FamilyRewardLabelMatchMode)[keyof typeof FamilyRewardLabelMatchMode];
}

function parseLabelUuids(searchParams: URLSearchParams): string[] {
  const values = searchParams.getAll("labelUuids");
  if (values.length === 0) {
    return [];
  }

  return [
    ...new Set(
      values
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

function parseRewardsUrlFilters(searchParams: URLSearchParams): RewardsUrlFilters {
  const activeParam = searchParams.get("active");
  const active = activeParam === null ? true : activeParam !== "false";

  const searchString = searchParams.get("searchString")?.trim() ?? "";
  const primaryLabelUuid = searchParams.get("primaryLabelUuid")?.trim() || null;
  const labelUuids = parseLabelUuids(searchParams);
  const labelMatchModeParam = searchParams.get("labelMatchMode");
  const labelMatchMode =
    labelMatchModeParam === FamilyRewardLabelMatchMode.ALL
      ? FamilyRewardLabelMatchMode.ALL
      : FamilyRewardLabelMatchMode.ANY;

  return {
    active,
    searchString,
    primaryLabelUuid,
    labelUuids,
    labelMatchMode,
  };
}

function serializeRewardsUrlFilters(filters: RewardsUrlFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (!filters.active) {
    params.set("active", "false");
  }

  if (filters.searchString.trim()) {
    params.set("searchString", filters.searchString.trim());
  }

  if (filters.primaryLabelUuid) {
    params.set("primaryLabelUuid", filters.primaryLabelUuid);
  }

  if (filters.labelUuids.length > 0) {
    params.set("labelUuids", filters.labelUuids.join(","));
  }

  if (filters.labelMatchMode === FamilyRewardLabelMatchMode.ALL) {
    params.set("labelMatchMode", FamilyRewardLabelMatchMode.ALL);
  }

  return params;
}

function mergeLabelsByUuid(
  previous: Record<string, RewardLabelDto>,
  labels: RewardLabelDto[]
): Record<string, RewardLabelDto> {
  if (labels.length === 0) {
    return previous;
  }

  const next = { ...previous };
  let changed = false;

  for (const label of labels) {
    const existing = next[label.uuid];
    if (!existing || existing.name !== label.name || existing.active !== label.active || existing.kind !== label.kind) {
      next[label.uuid] = label;
      changed = true;
    }
  }

  return changed ? next : previous;
}

function createUnknownProfile(profileUuid: string, label: string): ChildProfileDto {
  return {
    profileUuid,
    memberUuid: `unknown-member-${profileUuid}`,
    username: `unknown-${profileUuid}`,
    firstName: null,
    lastName: null,
    locale: "en",
    displayName: label,
    avatarEmoji: "❓",
    color: null,
    active: true,
  };
}

function formatDateSeparatorLabel(dateKey: string, locale: string, fallbackLabel: string): string {
  if (!isKnownRedemptionDateKey(dateKey)) {
    return fallbackLabel;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackLabel;
  }

  const currentYear = new Date().getFullYear();
  const formatOptions: Intl.DateTimeFormatOptions =
    parsed.getFullYear() === currentYear
      ? { weekday: "short", month: "short", day: "numeric" }
      : { weekday: "short", month: "short", day: "numeric", year: "numeric" };

  return new Intl.DateTimeFormat(locale, formatOptions).format(parsed);
}

function formatRedemptionTime(value: string, locale: string, fallbackLabel: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackLabel;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function RewardRedemptionsPage() {
  const { t, i18n } = useTranslation();
  useTrackFamilyTaskPageView("reward_redemptions");
  const { profiles, loading: familyLoading, error: familyError, refetch: refetchFamilyContext } = useFamilyContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => parseRewardsUrlFilters(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(urlFilters.searchString);
  const [debouncedSearchString, setDebouncedSearchString] = useState(urlFilters.searchString);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftActive, setDraftActive] = useState(urlFilters.active);
  const [draftCategoryUuid, setDraftCategoryUuid] = useState<string[]>(
    urlFilters.primaryLabelUuid ? [urlFilters.primaryLabelUuid] : []
  );
  const [draftTagUuids, setDraftTagUuids] = useState<string[]>(urlFilters.labelUuids);
  const [draftMatchMode, setDraftMatchMode] = useState(urlFilters.labelMatchMode);
  const [labelByUuid, setLabelByUuid] = useState<Record<string, RewardLabelDto>>({});
  const serializedUrlFilters = useMemo(() => serializeRewardsUrlFilters(urlFilters).toString(), [urlFilters]);

  const redemptionsQuery = useMemo<RewardRedemptionsQuery>(
    () => ({
      status: FamilyRewardRedemptionStatus.APPROVED,
      active: urlFilters.active,
      primaryLabelUuid: urlFilters.primaryLabelUuid ?? undefined,
      labelUuids: urlFilters.labelUuids.length > 0 ? urlFilters.labelUuids : undefined,
      labelMatchMode: urlFilters.labelUuids.length > 0 ? urlFilters.labelMatchMode : undefined,
      searchString: debouncedSearchString || undefined,
      page: 0,
      size: 200,
      sort: ["redeemedDate,desc", "createdDate,desc"],
    }),
    [
      debouncedSearchString,
      urlFilters.active,
      urlFilters.labelMatchMode,
      urlFilters.labelUuids,
      urlFilters.primaryLabelUuid,
    ]
  );

  const {
    redemptions,
    loading: redemptionsLoading,
    error: redemptionsError,
    refetch: refetchRedemptions,
  } = useRewardRedemptions(redemptionsQuery);

  const updateLabelCache = useCallback((labels: RewardLabelDto[]) => {
    setLabelByUuid((previous) => mergeLabelsByUuid(previous, labels));
  }, []);

  const updateUrlFilters = useCallback(
    (next: RewardsUrlFilters, replace = false) => {
      const nextParams = serializeRewardsUrlFilters(next);
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

    updateUrlFilters({ ...urlFilters, searchString: debouncedSearchString }, true);
  }, [debouncedSearchString, updateUrlFilters, urlFilters]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    setDraftActive(urlFilters.active);
    setDraftCategoryUuid(urlFilters.primaryLabelUuid ? [urlFilters.primaryLabelUuid] : []);
    setDraftTagUuids(urlFilters.labelUuids);
    setDraftMatchMode(urlFilters.labelMatchMode);
  }, [filtersOpen, urlFilters.active, urlFilters.labelMatchMode, urlFilters.labelUuids, urlFilters.primaryLabelUuid]);

  const approvedRedemptions = useMemo(
    () => redemptions.filter((redemption) => redemption.status === FamilyRewardRedemptionStatus.APPROVED),
    [redemptions]
  );

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles]);
  const visibleProfiles = useMemo(() => {
    const activeProfileUuidSet = new Set(activeProfiles.map((profile) => profile.profileUuid));
    const profileUuidsFromRedemptions = new Set(
      approvedRedemptions.map((redemption) => redemption.assigneeProfileUuid)
    );
    const extraProfileUuids = [...profileUuidsFromRedemptions].filter(
      (profileUuid) => !activeProfileUuidSet.has(profileUuid)
    );

    const unknownLabel = t("familyTask.profiles.unknown", "Unknown");
    const extraProfiles = extraProfileUuids.map(
      (profileUuid) =>
        profiles.find((profile) => profile.profileUuid === profileUuid) ??
        createUnknownProfile(profileUuid, unknownLabel)
    );

    return [...activeProfiles, ...extraProfiles];
  }, [activeProfiles, approvedRedemptions, profiles, t]);

  const profileColorByUuid = useMemo(() => {
    return Object.fromEntries(
      visibleProfiles.map((profile, index) => [
        profile.profileUuid,
        profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length],
      ])
    );
  }, [visibleProfiles]);

  const dateGroupsByProfile = useMemo(() => groupRedemptionsByProfileDate(approvedRedemptions), [approvedRedemptions]);

  const columns = useMemo(
    () =>
      visibleProfiles.map((profile) => {
        const dateGroups = dateGroupsByProfile[profile.profileUuid] ?? [];
        const redemptionCount = dateGroups.reduce((sum, group) => sum + group.redemptions.length, 0);
        const starsSpent = dateGroups.reduce(
          (sum, group) =>
            sum + group.redemptions.reduce((inner, redemption) => inner + (redemption.reward?.starsCost ?? 0), 0),
          0
        );

        return {
          profile,
          dateGroups,
          redemptionCount,
          starsSpent,
        };
      }),
    [dateGroupsByProfile, visibleProfiles]
  );

  const refreshDashboard = async () => {
    await Promise.all([refetchFamilyContext(), refetchRedemptions()]);
  };

  const pageLoading = familyLoading || redemptionsLoading;
  const hasBlockingError = Boolean(familyError || redemptionsError);

  const hasActiveFilters =
    !urlFilters.active ||
    Boolean(urlFilters.primaryLabelUuid) ||
    urlFilters.labelUuids.length > 0 ||
    (urlFilters.labelMatchMode === FamilyRewardLabelMatchMode.ALL && urlFilters.labelUuids.length > 0);
  const activeFiltersCount =
    Number(!urlFilters.active) +
    Number(Boolean(urlFilters.primaryLabelUuid)) +
    Number(urlFilters.labelUuids.length > 0) +
    Number(urlFilters.labelMatchMode === FamilyRewardLabelMatchMode.ALL && urlFilters.labelUuids.length > 1);
  const hasSearchFilter = Boolean(urlFilters.searchString);

  const applyFilterDraft = () => {
    const nextCategoryUuid = draftCategoryUuid[0] ?? null;
    const nextTagUuids = [...new Set(draftTagUuids)];

    updateUrlFilters(
      {
        ...urlFilters,
        active: draftActive,
        primaryLabelUuid: nextCategoryUuid,
        labelUuids: nextTagUuids,
        labelMatchMode: draftMatchMode,
      },
      false
    );
    setFiltersOpen(false);
  };

  const resetFilterDraft = () => {
    setDraftActive(true);
    setDraftCategoryUuid([]);
    setDraftTagUuids([]);
    setDraftMatchMode(FamilyRewardLabelMatchMode.ANY);
  };

  const clearAppliedFilters = () => {
    updateUrlFilters(
      {
        ...urlFilters,
        active: true,
        primaryLabelUuid: null,
        labelUuids: [],
        labelMatchMode: FamilyRewardLabelMatchMode.ANY,
        searchString: "",
      },
      false
    );
    setSearchDraft("");
    setDebouncedSearchString("");
    resetFilterDraft();
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.sidebar.redemptions", "Redemptions")}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden w-[300px] items-center lg:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t("common.search", "Search")}
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
        </div>
      </div>
    ),
    [activeFiltersCount, hasActiveFilters, searchDraft, t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-background bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
      <ParentFeatureGate featureId="reward_redemptions">
        <div className="mx-auto flex h-full w-full min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t("common.search", "Search")}
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
              {!urlFilters.active ? <span className="rounded-full bg-background px-2 py-0.5">Inactive</span> : null}
              {urlFilters.primaryLabelUuid ? (
                <span className="rounded-full bg-background px-2 py-0.5">
                  {labelByUuid[urlFilters.primaryLabelUuid]?.name ?? t("familyTask.rewards.category", "Category")}
                </span>
              ) : null}
              {urlFilters.labelUuids.length > 0 ? (
                <span className="rounded-full bg-background px-2 py-0.5">
                  {t("familyTask.rewards.tags", "Tags")}: {urlFilters.labelUuids.length}
                </span>
              ) : null}
              {urlFilters.labelMatchMode === FamilyRewardLabelMatchMode.ALL && urlFilters.labelUuids.length > 1 ? (
                <span className="rounded-full bg-background px-2 py-0.5">ALL</span>
              ) : null}
              <button type="button" onClick={clearAppliedFilters} className="font-semibold underline">
                {t("common.clear", "Clear")}
              </button>
            </div>
          ) : null}

          {pageLoading ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
              {t("common.loading", "Loading...")}
            </div>
          ) : null}

          {familyError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(familyError, "Failed to load family context.")}</span>
              <button className="font-medium underline" onClick={() => void refreshDashboard()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {redemptionsError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(redemptionsError, "Failed to load redemptions.")}</span>
              <button className="font-medium underline" onClick={() => void refreshDashboard()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {!pageLoading && !hasBlockingError && visibleProfiles.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
              {t("familyTask.profiles.noProfiles", "No child profiles yet.")}
            </div>
          ) : null}

          {!pageLoading && !hasBlockingError && visibleProfiles.length > 0 ? (
            <section className="min-h-0 min-w-0 flex-1 overflow-x-auto pb-2">
              <div className="flex h-full w-max min-w-full snap-x gap-4 pr-4">
                {columns.map(({ profile, dateGroups, redemptionCount, starsSpent }, index) => {
                  const profileColor =
                    profileColorByUuid[profile.profileUuid] ??
                    PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length];

                  return (
                    <article
                      key={profile.profileUuid}
                      className="flex h-full w-[300px] shrink-0 snap-start flex-col rounded-[32px] border border-border/70 p-4 shadow-sm sm:w-[320px]"
                      style={{
                        background: `linear-gradient(165deg, ${hexToRgba(profileColor, 0.26)}, ${hexToRgba(profileColor, 0.1)})`,
                      }}
                    >
                      <header className="space-y-1">
                        <div className="flex items-stretch gap-3">
                          <span
                            className="flex size-12 shrink-0 items-center justify-center self-stretch rounded-full text-lg font-semibold text-white shadow-sm"
                            style={{ backgroundColor: profileColor }}
                          >
                            <NotoEmoji
                              emoji={resolveProfileBadge(profile)}
                              size={40}
                              className="text-lg font-semibold text-white"
                              fallback="?"
                            />
                          </span>

                          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                            <h2 className="truncate text-xl font-semibold leading-tight text-foreground">
                              {profile.displayName}
                            </h2>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 items-center rounded-full bg-background/75 px-2 text-[11px] font-semibold text-foreground/80">
                                🎁 {redemptionCount}
                              </span>
                              <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-300/30 dark:text-amber-100">
                                ⭐ {starsSpent}
                              </span>
                            </div>
                          </div>
                        </div>
                      </header>

                      <div className="mt-1 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                        {dateGroups.map((group) => (
                          <section key={`${profile.profileUuid}-${group.dateKey}`} className="space-y-2">
                            <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
                              <span className="h-px flex-1 bg-border/70" />
                              {formatDateSeparatorLabel(
                                group.dateKey,
                                i18n.language,
                                t("familyTask.redemptions.noDate", "Unknown date")
                              )}
                              <span className="h-px flex-1 bg-border/70" />
                            </h4>

                            <div className="space-y-2">
                              {group.redemptions.map((redemption) => {
                                const reward = redemption.reward;
                                const rewardUuid = reward?.uuid ?? redemption.rewardUuid;
                                const redeemedAt = resolveRedemptionDate(redemption);
                                const timeLabel = formatRedemptionTime(
                                  redeemedAt,
                                  i18n.language,
                                  t("familyTask.redemptions.noDate", "Unknown date")
                                );

                                return (
                                  <article
                                    key={redemption.uuid}
                                    className="rounded-2xl border border-border/60 bg-card/75 px-3 py-2 shadow-sm"
                                  >
                                    <div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                                      <div className="flex justify-start">
                                        <span className="inline-flex h-6 items-center rounded-full border border-border bg-muted px-2 text-[11px] font-semibold text-muted-foreground">
                                          ⭐ {reward?.starsCost ?? 0}
                                        </span>
                                      </div>

                                      <div className="flex justify-center opacity-75">
                                        <NotoEmoji emoji={reward?.emoji?.trim() || "🎁"} size={52} fallback="🎁" />
                                      </div>

                                      <div className="flex justify-end">
                                        {rewardUuid ? (
                                          <Link
                                            to={`/family-tasks/rewards/${rewardUuid}`}
                                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                            aria-label={t("common.edit", "Edit")}
                                            title={t("common.edit", "Edit")}
                                          >
                                            <Pencil className="size-3.5" />
                                          </Link>
                                        ) : (
                                          <span className="inline-flex size-7 shrink-0" />
                                        )}
                                      </div>
                                    </div>

                                    <p className="truncate text-sm font-semibold text-foreground/90">
                                      {reward?.title ?? t("familyTask.rewards.unknownReward", "Reward")}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{timeLabel}</p>
                                    {redemption.note ? (
                                      <p className="mt-2 text-xs text-muted-foreground">{redemption.note}</p>
                                    ) : null}
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        ))}

                        {redemptionCount === 0 ? (
                          <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground">
                            {hasActiveFilters || hasSearchFilter
                              ? t("familyTask.dashboard.filtersEmpty", "No tasks in the enabled filters.")
                              : t("familyTask.redemptions.empty", "No redemptions yet.")}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </ParentFeatureGate>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-[min(94vw,560px)] rounded-3xl border border-border/80 bg-popover/95 p-5 shadow-2xl sm:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("familyTask.rewards.filtersHint", "Refine rewards by active state, category, and tags.")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("familyTask.chores.active", "Active")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftActive(true)}
                    className={cn(
                      "h-9 rounded-full border text-sm font-medium transition-colors",
                      draftActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground/80 hover:bg-accent"
                    )}
                  >
                    {t("familyTask.rewards.activeOnly", "Active")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftActive(false)}
                    className={cn(
                      "h-9 rounded-full border text-sm font-medium transition-colors",
                      !draftActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground/80 hover:bg-accent"
                    )}
                  >
                    {t("familyTask.rewards.inactiveOnly", "Inactive")}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("familyTask.rewards.matchMode", "Tag match mode")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftMatchMode(FamilyRewardLabelMatchMode.ANY)}
                    className={cn(
                      "h-9 rounded-full border text-sm font-medium transition-colors",
                      draftMatchMode === FamilyRewardLabelMatchMode.ANY
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground/80 hover:bg-accent"
                    )}
                  >
                    ANY
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMatchMode(FamilyRewardLabelMatchMode.ALL)}
                    className={cn(
                      "h-9 rounded-full border text-sm font-medium transition-colors",
                      draftMatchMode === FamilyRewardLabelMatchMode.ALL
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-foreground/80 hover:bg-accent"
                    )}
                  >
                    ALL
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("familyTask.rewards.category", "Category")}</p>
              <RewardLabelDropdown
                kind={FamilyRewardLabelKind.CATEGORY}
                value={draftCategoryUuid}
                onChange={(next) => setDraftCategoryUuid(next.slice(0, 1))}
                placeholder={t("familyTask.rewards.selectCategory", "Select category")}
                searchPlaceholder={t("common.search", "Search")}
                emptyText={t("familyTask.rewards.noCategories", "No categories found.")}
                knownLabels={labelByUuid}
                onLabelsLoaded={updateLabelCache}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("familyTask.rewards.tags", "Tags")}</p>
              <RewardLabelDropdown
                kind={FamilyRewardLabelKind.TAG}
                value={draftTagUuids}
                onChange={setDraftTagUuids}
                placeholder={t("familyTask.rewards.selectTags", "Select tags")}
                searchPlaceholder={t("common.search", "Search")}
                emptyText={t("familyTask.rewards.noTags", "No tags found.")}
                multiple
                knownLabels={labelByUuid}
                onLabelsLoaded={updateLabelCache}
              />
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
