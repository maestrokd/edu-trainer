import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Pencil, Plus, Search, Sparkles, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { cn } from "@/lib/utils";
import { rewardRedemptionsApi, starsApi } from "../api/rewardsApi";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { RewardLabelDropdown } from "../components/rewards/RewardLabelDropdown";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { FAMILY_TASK_ROUTES } from "../constants/routes";
import { canManageFamilyTask } from "../domain/access";
import { PROFILE_FALLBACK_COLORS, hexToRgba } from "../domain/dashboard/color";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useFamilyTaskErrorHandler } from "../hooks/useFamilyTaskErrorHandler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRewards, useStarsBalance } from "../hooks/useRewards";
import type { ChildProfileDto, RewardDto, RewardLabelDto, RewardsQuery } from "../models/dto";
import { FamilyRewardLabelKind, FamilyRewardLabelMatchMode } from "../models/enums";

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

function resolveRewardEmoji(reward?: RewardDto): string {
  if (reward?.emoji?.trim()) {
    return reward.emoji.trim();
  }

  return "🎁";
}

function sortRewards(left: RewardDto, right: RewardDto): number {
  if (left.starsCost !== right.starsCost) {
    return left.starsCost - right.starsCost;
  }

  return left.title.localeCompare(right.title);
}

const SEARCH_DEBOUNCE_MS = 300;

interface RewardCategoryGroup {
  categoryKey: string;
  categoryTitle: string;
  isUncategorized: boolean;
  rewards: RewardDto[];
}

const UNASSIGNED_PROFILE_UUID = "__unassigned_rewards__";

function resolveRewardCategory(
  reward: RewardDto,
  uncategorizedLabel: string
): Pick<RewardCategoryGroup, "categoryKey" | "categoryTitle" | "isUncategorized"> {
  const primaryCategory =
    reward.labels.find(
      (label) => label.kind === FamilyRewardLabelKind.CATEGORY && label.uuid === reward.primaryLabelUuid
    ) ?? reward.labels.find((label) => label.kind === FamilyRewardLabelKind.CATEGORY);

  const categoryTitle = primaryCategory?.name?.trim();
  if (primaryCategory && categoryTitle) {
    return {
      categoryKey: primaryCategory.uuid,
      categoryTitle,
      isUncategorized: false,
    };
  }

  return {
    categoryKey: "__uncategorized__",
    categoryTitle: uncategorizedLabel,
    isUncategorized: true,
  };
}

function groupRewardsByCategory(
  rewards: RewardDto[],
  uncategorizedLabel: string,
  locale: string
): RewardCategoryGroup[] {
  const grouped = new Map<string, RewardCategoryGroup>();

  for (const reward of rewards) {
    const category = resolveRewardCategory(reward, uncategorizedLabel);
    const existing = grouped.get(category.categoryKey);
    if (existing) {
      existing.rewards.push(reward);
      continue;
    }

    grouped.set(category.categoryKey, {
      ...category,
      rewards: [reward],
    });
  }

  const groups = [...grouped.values()];
  for (const group of groups) {
    group.rewards.sort(sortRewards);
  }

  groups.sort((left, right) => {
    if (left.isUncategorized !== right.isUncategorized) {
      return left.isUncategorized ? 1 : -1;
    }

    return left.categoryTitle.localeCompare(right.categoryTitle, locale, { sensitivity: "base" });
  });

  return groups;
}

function isRewardAssignedToProfile(reward: RewardDto, profileUuid: string): boolean {
  return (
    reward.assigneeProfileUuids.includes(profileUuid) || reward.redeemableAssigneeProfileUuids.includes(profileUuid)
  );
}

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

function createUnassignedRewardsProfile(label: string): ChildProfileDto {
  return {
    profileUuid: UNASSIGNED_PROFILE_UUID,
    memberUuid: UNASSIGNED_PROFILE_UUID,
    username: "unassigned-rewards",
    firstName: null,
    lastName: null,
    locale: "en-US",
    displayName: label,
    avatarEmoji: "⚠️",
    color: null,
    active: true,
  };
}

export function RewardsPage() {
  const { t, i18n } = useTranslation();
  useTrackFamilyTaskPageView("rewards");
  const { getErrorMessage } = useFamilyTaskErrorHandler();

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);
  const isSecondaryWithoutManageProfiles = principal?.profileType === "SECONDARY" && !canManage;

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

  const rewardQuery = useMemo<RewardsQuery>(
    () => ({
      active: urlFilters.active,
      primaryLabelUuid: urlFilters.primaryLabelUuid ?? undefined,
      labelUuids: urlFilters.labelUuids.length > 0 ? urlFilters.labelUuids : undefined,
      labelMatchMode: urlFilters.labelUuids.length > 0 ? urlFilters.labelMatchMode : undefined,
      searchString: debouncedSearchString || undefined,
    }),
    [
      debouncedSearchString,
      urlFilters.active,
      urlFilters.labelMatchMode,
      urlFilters.labelUuids,
      urlFilters.primaryLabelUuid,
    ]
  );

  const { rewards, loading, error, refetch } = useRewards(rewardQuery);
  const {
    balance,
    loading: ownBalanceLoading,
    error: ownBalanceError,
    refetch: refetchOwnBalance,
  } = useStarsBalance(undefined, !canManage);

  const [balancesByProfileUuid, setBalancesByProfileUuid] = useState<Record<string, number>>({});
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemCandidate, setRedeemCandidate] = useState<RewardDto | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const serializedUrlFilters = useMemo(() => serializeRewardsUrlFilters(urlFilters).toString(), [urlFilters]);

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

  useEffect(() => {
    const labels = rewards.flatMap((reward) => reward.labels ?? []);
    updateLabelCache(labels);
  }, [rewards, updateLabelCache]);

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles]);
  const ownProfileUuid = useMemo(() => {
    if (!isSecondaryWithoutManageProfiles || !principal?.username) {
      return null;
    }

    const username = principal.username.toLowerCase();
    return activeProfiles.find((profile) => profile.username.toLowerCase() === username)?.profileUuid ?? null;
  }, [activeProfiles, isSecondaryWithoutManageProfiles, principal?.username]);

  const fallbackOwnProfileUuid = ownProfileUuid ?? balance?.secondaryProfileUuid ?? null;

  const visibleProfiles = useMemo(() => {
    if (!isSecondaryWithoutManageProfiles) {
      return activeProfiles;
    }

    if (!fallbackOwnProfileUuid) {
      return [];
    }

    const matchedProfile = activeProfiles.find((profile) => profile.profileUuid === fallbackOwnProfileUuid);
    if (matchedProfile) {
      return [matchedProfile];
    }

    const fallbackDisplayName =
      principal?.firstName?.trim() || principal?.username || t("familyTask.profiles.unknown", "Unknown");

    return [
      {
        profileUuid: fallbackOwnProfileUuid,
        memberUuid: fallbackOwnProfileUuid,
        username: principal?.username ?? "child",
        firstName: principal?.firstName ?? null,
        lastName: principal?.lastName ?? null,
        locale: "en-US",
        displayName: fallbackDisplayName,
        avatarEmoji: null,
        color: null,
        active: true,
      },
    ];
  }, [
    activeProfiles,
    fallbackOwnProfileUuid,
    isSecondaryWithoutManageProfiles,
    principal?.firstName,
    principal?.lastName,
    principal?.username,
    t,
  ]);

  const profileColorByUuid = useMemo(() => {
    return Object.fromEntries(
      visibleProfiles.map((profile, index) => [
        profile.profileUuid,
        profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length],
      ])
    );
  }, [visibleProfiles]);

  const loadParentBalances = useCallback(async () => {
    if (!canManage) {
      setBalancesByProfileUuid({});
      setBalancesError(null);
      setBalancesLoading(false);
      return;
    }

    if (activeProfiles.length === 0) {
      setBalancesByProfileUuid({});
      setBalancesError(null);
      setBalancesLoading(false);
      return;
    }

    setBalancesLoading(true);
    setBalancesError(null);
    try {
      const balanceItems = await starsApi.getBalances();
      const nextBalances: Record<string, number> = {};

      for (const item of balanceItems) {
        nextBalances[item.secondaryProfileUuid] = item.balance;
      }

      setBalancesByProfileUuid(nextBalances);
      setBalancesError(null);
    } catch (error: unknown) {
      setBalancesByProfileUuid({});
      setBalancesError(
        getErrorMessage(error, {
          fallbackKey: "familyTask.errors.starBalance",
          fallbackMessage: "Failed to load stars balance.",
        })
      );
    } finally {
      setBalancesLoading(false);
    }
  }, [activeProfiles, canManage, getErrorMessage]);

  useEffect(() => {
    void loadParentBalances();
  }, [loadParentBalances]);

  const refreshDashboard = async () => {
    await Promise.all([refetchFamilyContext(), refetch(), canManage ? loadParentBalances() : refetchOwnBalance()]);
  };

  const columns = useMemo(() => {
    const uncategorizedCategoryLabel = t("familyTask.rewards.uncategorized", "Uncategorized");
    const unassignedProfileLabel = t("familyTask.rewards.unassignedColumn", "Unassigned");
    const unassignedRewards = rewards.filter((reward) => reward.assigneeProfileUuids.length === 0);

    const profileColumns = visibleProfiles.map((profile) => {
      const starsBalance = canManage
        ? (balancesByProfileUuid[profile.profileUuid] ?? 0)
        : profile.profileUuid === fallbackOwnProfileUuid
          ? (balance?.balance ?? 0)
          : 0;

      const availableRewards = rewards
        .filter((reward) => isRewardAssignedToProfile(reward, profile.profileUuid))
        .sort(sortRewards);

      const availableRewardGroups = groupRewardsByCategory(availableRewards, uncategorizedCategoryLabel, i18n.language);

      return {
        profile,
        starsBalance,
        availableRewardGroups,
        availableRewardsCount: availableRewards.length,
        canRedeem: true,
      };
    });

    if (!canManage || unassignedRewards.length === 0) {
      return profileColumns;
    }

    const availableRewardGroups = groupRewardsByCategory(unassignedRewards, uncategorizedCategoryLabel, i18n.language);

    return [
      ...profileColumns,
      {
        profile: createUnassignedRewardsProfile(unassignedProfileLabel),
        starsBalance: 0,
        availableRewardGroups,
        availableRewardsCount: unassignedRewards.length,
        canRedeem: false,
      },
    ];
  }, [
    balance?.balance,
    balancesByProfileUuid,
    fallbackOwnProfileUuid,
    i18n.language,
    canManage,
    rewards,
    t,
    visibleProfiles,
  ]);

  const requestRedeem = (reward: RewardDto) => {
    if (redeeming) {
      return;
    }

    setRedeemError(null);
    setRedeemCandidate(reward);
  };

  const handleRedeem = async () => {
    if (!redeemCandidate) {
      return;
    }

    setRedeeming(redeemCandidate.uuid);

    try {
      await rewardRedemptionsApi.create({
        rewardUuid: redeemCandidate.uuid,
        note: t("familyTask.rewards.redeem", "Redeem"),
      });

      await Promise.all([refetch(), refetchOwnBalance()]);
      setRedeemCandidate(null);
      setRedeemError(null);
    } catch (reason: unknown) {
      setRedeemError(
        getErrorMessage(reason, {
          fallbackKey: "familyTask.errors.redemptionSave",
          fallbackMessage: "Failed to create redemption.",
        })
      );
    } finally {
      setRedeeming(null);
    }
  };

  const pageLoading = familyLoading || loading || (!canManage && ownBalanceLoading) || (canManage && balancesLoading);
  const hasBlockingError = Boolean(error || (canManage && familyError));
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
      },
      false
    );
    resetFilterDraft();
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.rewards.title", "Rewards")}
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
              "hidden h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent min-[561px]:inline-flex sm:px-3.5",
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

          {canManage ? (
            <Link
              to={FAMILY_TASK_ROUTES.rewardsStars}
              aria-label={t("familyTask.stars.manageTitle", "Adjust Stars")}
              title={t("familyTask.stars.manageTitle", "Adjust Stars")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent sm:px-3.5"
            >
              <Sparkles className="size-4" />
              <span className="hidden min-[561px]:inline">{t("familyTask.stars.title", "Stars")}</span>
            </Link>
          ) : null}

          {canManage ? (
            <Link
              to={FAMILY_TASK_ROUTES.rewardsNew}
              aria-label={t("common.new", "+ New")}
              title={t("common.new", "+ New")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-3.5"
            >
              <Plus className="size-4" />
              <span className="hidden min-[561px]:inline">{t("common.new", "New")}</span>
            </Link>
          ) : null}
        </div>
      </div>
    ),
    [activeFiltersCount, canManage, hasActiveFilters, searchDraft, t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-background bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
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

        {familyError && canManage ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
            <span>{t(familyError, "Failed to load family context.")}</span>
            <button className="font-medium underline" onClick={() => void refreshDashboard()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
            <span>{t(error, "Failed to load rewards.")}</span>
            <button className="font-medium underline" onClick={() => void refreshDashboard()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        ) : null}

        {ownBalanceError && !canManage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
            {t(ownBalanceError, "Failed to load stars balance.")}
          </div>
        ) : null}

        {balancesError && canManage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
            {t(balancesError, "Failed to load stars balance.")}
          </div>
        ) : null}

        {!pageLoading && !hasBlockingError && columns.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
            {t("familyTask.profiles.noProfiles", "No child profiles yet.")}
          </div>
        ) : null}

        {!pageLoading && !hasBlockingError && columns.length > 0 ? (
          <section className="min-h-0 min-w-0 flex-1 overflow-x-auto pb-2">
            <div className="flex h-full w-max min-w-full snap-x gap-4 pr-4">
              {columns.map(
                ({ profile, starsBalance, availableRewardGroups, availableRewardsCount, canRedeem }, index) => {
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
                            <span className="inline-flex h-5 w-fit items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-300/30 dark:text-amber-100">
                              ⭐ {starsBalance}
                            </span>
                          </div>
                        </div>
                      </header>

                      <div className="mt-1 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                        {availableRewardGroups.map((group) => (
                          <section key={`${profile.profileUuid}-${group.categoryKey}`} className="space-y-2">
                            <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
                              <span className="h-px flex-1 bg-border/70" />
                              {group.categoryTitle}
                              <span className="h-px flex-1 bg-border/70" />
                            </h4>

                            <div className="space-y-2">
                              {group.rewards.map((reward) => {
                                const costDivider = reward.starsCost > 0 ? reward.starsCost : 1;
                                const progressPercent = Math.max(
                                  0,
                                  Math.min(100, Math.round((starsBalance / costDivider) * 100))
                                );
                                const canAfford = starsBalance >= reward.starsCost;
                                const showRedeemAction = canRedeem && canAfford;
                                const showProgressBar = !canAfford;
                                const progressTrackColor = hexToRgba(profileColor, 0.24);
                                const progressFillColor = hexToRgba(profileColor, 0.5);

                                return (
                                  <article
                                    key={reward.uuid}
                                    className="rounded-2xl border border-border/70 bg-card/85 px-3 py-2 shadow-sm"
                                  >
                                    <div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                                      <div className="flex justify-start">
                                        {reward.availableQuantity !== null || !reward.active ? (
                                          <div className="flex flex-wrap items-center gap-1">
                                            {reward.availableQuantity !== null ? (
                                              <span className="inline-flex h-6 items-center rounded-full border border-border bg-muted px-2 text-[11px] font-semibold text-muted-foreground">
                                                {t("familyTask.rewards.quantityShort", "Qty")}:{" "}
                                                {reward.availableQuantity}
                                              </span>
                                            ) : null}
                                            {!reward.active ? (
                                              <span className="inline-flex h-6 items-center rounded-full border border-amber-300 bg-amber-100 px-2 text-[11px] font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100">
                                                {t("familyTask.rewards.inactiveOnly", "Inactive")}
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : (
                                          <span className="inline-flex h-6" />
                                        )}
                                      </div>

                                      <div className="flex justify-center">
                                        <NotoEmoji emoji={resolveRewardEmoji(reward)} size={52} fallback="🎁" />
                                      </div>

                                      <div className="flex justify-end">
                                        {canManage ? (
                                          <Link
                                            to={`/family-tasks/rewards/${reward.uuid}`}
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

                                    <p className="truncate text-sm font-semibold text-foreground">{reward.title}</p>

                                    {showProgressBar ? (
                                      <div
                                        className="relative mt-2 h-5 overflow-hidden rounded-full border border-white/60"
                                        style={{ backgroundColor: progressTrackColor }}
                                      >
                                        <div
                                          className="h-full rounded-full transition-all duration-300"
                                          style={{ width: `${progressPercent}%`, backgroundColor: progressFillColor }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <p
                                            className="inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[11px] font-semibold leading-none shadow-sm"
                                            style={{ backgroundColor: "rgba(255, 255, 255, 0.88)", color: "#111827" }}
                                          >
                                            <Star className="size-3" />
                                            {starsBalance}/{reward.starsCost}
                                          </p>
                                        </div>
                                      </div>
                                    ) : null}

                                    {showRedeemAction ? (
                                      <button
                                        disabled={redeeming === reward.uuid}
                                        onClick={() => requestRedeem(reward)}
                                        className="mt-2 h-10 w-full rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                                      >
                                        {redeeming === reward.uuid
                                          ? t("common.saving", "Saving...")
                                          : t("familyTask.rewards.redeemFor", "Redeem ⭐ {{cost}}", {
                                              cost: reward.starsCost,
                                            })}
                                      </button>
                                    ) : null}
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        ))}

                        {availableRewardsCount === 0 ? (
                          <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-6 text-center text-sm text-muted-foreground">
                            <p>
                              {t("familyTask.rewards.emptyBoard", "Ready for a new goal?")}
                              <br />
                              {t("familyTask.rewards.emptyBoardHint", "Create a reward in the app.")}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        ) : null}
      </div>

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

      <Dialog
        open={Boolean(redeemCandidate)}
        onOpenChange={(open) => {
          if (!open && !redeeming) {
            setRedeemCandidate(null);
            setRedeemError(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[min(92vw,430px)] rounded-[28px] border border-border/80 bg-popover/95 p-6 shadow-2xl"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-muted">
              <NotoEmoji emoji={resolveRewardEmoji(redeemCandidate ?? undefined)} size={72} fallback="🎁" />
            </div>

            <div>
              <h3 className="text-3xl font-semibold leading-tight text-foreground">
                {t("familyTask.rewards.confirmTitle", 'Redeem "{{title}}"?', {
                  title: redeemCandidate?.title ?? t("familyTask.rewards.unknownReward", "Reward"),
                })}
              </h3>
              <p className="mt-2 text-base text-muted-foreground">
                {t("familyTask.rewards.confirmBody", "This will spend {{cost}} stars.", {
                  cost: redeemCandidate?.starsCost ?? 0,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRedeem()}
              disabled={Boolean(redeeming)}
              className="h-12 w-full rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {redeeming ? t("common.saving", "Saving...") : t("familyTask.rewards.redeem", "Redeem")}
            </button>
            <button
              type="button"
              disabled={Boolean(redeeming)}
              onClick={() => {
                setRedeemCandidate(null);
                setRedeemError(null);
              }}
              className="h-11 w-full rounded-full border border-border px-4 text-base font-medium text-foreground/80 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("common.cancel", "Cancel")}
            </button>
            {redeemError ? (
              <p className="text-sm text-destructive">{t(redeemError, "Failed to create redemption.")}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </FamilyTaskPageShell>
  );
}
