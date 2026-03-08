import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { ApprovalsProfileColumn } from "../components/dashboard/ApprovalsProfileColumn";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { PROFILE_FALLBACK_COLORS } from "../domain/dashboard/color";
import { groupApprovalsByProfileDateAndSlot } from "../domain/dashboard/approvals";
import { SECTION_ORDER } from "../domain/dashboard/types";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useRewardRedemptions } from "../hooks/useRewards";
import { useRoutines } from "../hooks/useRoutines";
import { useApprovalQueue } from "../hooks/useTaskOccurrences";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ChildProfileDto, RewardRedemptionDto, TaskOccurrenceDto } from "../models/dto";
import { FamilyRewardRedemptionStatus, FamilyRoutineSlot } from "../models/enums";

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

function toDateValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function ApprovalsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("approvals");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;
  const { profiles, loading: familyLoading, error: familyError, refetch: refetchFamily } = useFamilyContext();
  const routineFilters = useMemo(() => ({ active: true }), []);
  const redemptionFilters = useMemo(
    () => ({
      status: FamilyRewardRedemptionStatus.PENDING,
      page: 0,
      size: 200,
      sort: ["createdDate,desc"],
    }),
    []
  );
  const { routines, loading: routinesLoading } = useRoutines(routineFilters);

  const {
    queue,
    loading: taskLoading,
    error: taskError,
    approve: approveTask,
    reject: rejectTask,
    refetch: refetchQueue,
  } = useApprovalQueue(isParent);

  const {
    redemptions,
    loading: redeemLoading,
    error: redeemError,
    approve: approveRedemption,
    reject: rejectRedemption,
    refetch: refetchRedemptions,
  } = useRewardRedemptions(redemptionFilters);

  const [taskActionByTaskUuid, setTaskActionByTaskUuid] = useState<Record<string, "approve" | "reject" | undefined>>(
    {}
  );
  const [redemptionActionByUuid, setRedemptionActionByUuid] = useState<
    Record<string, "approve" | "reject" | undefined>
  >({});

  const pendingRedemptions = useMemo(
    () => redemptions.filter((redemption) => redemption.status === FamilyRewardRedemptionStatus.PENDING),
    [redemptions]
  );

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles]);
  const visibleProfiles = useMemo(() => {
    const activeProfileUuidSet = new Set(activeProfiles.map((profile) => profile.profileUuid));
    const profileUuidsFromApprovals = new Set([
      ...queue.map((task) => task.assigneeProfileUuid),
      ...pendingRedemptions.map((redemption) => redemption.assigneeProfileUuid),
    ]);
    const extraProfileUuids = [...profileUuidsFromApprovals].filter(
      (profileUuid) => !activeProfileUuidSet.has(profileUuid)
    );

    const unknownLabel = t("familyTask.profiles.unknown", "Unknown");
    const extraProfiles = extraProfileUuids.map(
      (profileUuid) =>
        profiles.find((profile) => profile.profileUuid === profileUuid) ??
        createUnknownProfile(profileUuid, unknownLabel)
    );

    return [...activeProfiles, ...extraProfiles];
  }, [activeProfiles, pendingRedemptions, profiles, queue, t]);

  const routineSlotByUuid = useMemo(() => {
    const map: Record<string, FamilyRoutineSlot> = {};

    for (const routine of routines) {
      map[routine.uuid] = routine.routineSlot;
    }

    return map;
  }, [routines]);

  const taskQueueByProfile = useMemo(() => {
    const grouped: Record<string, TaskOccurrenceDto[]> = {};

    for (const profile of visibleProfiles) {
      grouped[profile.profileUuid] = [];
    }

    for (const task of queue) {
      const profileTasks = grouped[task.assigneeProfileUuid] ?? [];
      profileTasks.push(task);
      grouped[task.assigneeProfileUuid] = profileTasks;
    }

    return grouped;
  }, [queue, visibleProfiles]);

  const pendingRedemptionsByProfile = useMemo(() => {
    const grouped: Record<string, RewardRedemptionDto[]> = {};

    for (const profile of visibleProfiles) {
      grouped[profile.profileUuid] = [];
    }

    for (const redemption of pendingRedemptions) {
      const profileRedemptions = grouped[redemption.assigneeProfileUuid] ?? [];
      profileRedemptions.push(redemption);
      grouped[redemption.assigneeProfileUuid] = profileRedemptions;
    }

    for (const profileUuid of Object.keys(grouped)) {
      grouped[profileUuid].sort((left, right) => {
        const leftDateValue = toDateValue(left.createdDate);
        const rightDateValue = toDateValue(right.createdDate);

        if (leftDateValue !== rightDateValue) {
          return rightDateValue - leftDateValue;
        }

        return left.uuid.localeCompare(right.uuid);
      });
    }

    return grouped;
  }, [pendingRedemptions, visibleProfiles]);

  const dateGroupsByProfile = useMemo(
    () => groupApprovalsByProfileDateAndSlot(queue, routineSlotByUuid, SECTION_ORDER),
    [queue, routineSlotByUuid]
  );

  const profileColumns = useMemo(
    () =>
      visibleProfiles.map((profile, index) => ({
        profile,
        profileColor: profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length],
        tasks: taskQueueByProfile[profile.profileUuid] ?? [],
        dateGroups: dateGroupsByProfile[profile.profileUuid] ?? [],
        pendingRedemptions: pendingRedemptionsByProfile[profile.profileUuid] ?? [],
      })),
    [dateGroupsByProfile, pendingRedemptionsByProfile, taskQueueByProfile, visibleProfiles]
  );

  const pageLoading = taskLoading || redeemLoading || familyLoading || routinesLoading;

  const handleApproveTask = async (task: TaskOccurrenceDto) => {
    setTaskActionByTaskUuid((prev) => ({ ...prev, [task.uuid]: "approve" }));

    try {
      await approveTask(task.uuid, { note: t("common.approve", "Approve") });
    } finally {
      setTaskActionByTaskUuid((prev) => {
        const next = { ...prev };
        delete next[task.uuid];
        return next;
      });
    }
  };

  const handleRejectTask = async (task: TaskOccurrenceDto) => {
    setTaskActionByTaskUuid((prev) => ({ ...prev, [task.uuid]: "reject" }));

    try {
      await rejectTask(task.uuid, { note: t("common.reject", "Reject") });
    } finally {
      setTaskActionByTaskUuid((prev) => {
        const next = { ...prev };
        delete next[task.uuid];
        return next;
      });
    }
  };

  const handleApproveRedemption = async (redemption: RewardRedemptionDto) => {
    setRedemptionActionByUuid((prev) => ({ ...prev, [redemption.uuid]: "approve" }));

    try {
      await approveRedemption(redemption.uuid, { reviewedNote: t("common.approve", "Approve") });
    } finally {
      setRedemptionActionByUuid((prev) => {
        const next = { ...prev };
        delete next[redemption.uuid];
        return next;
      });
    }
  };

  const handleRejectRedemption = async (redemption: RewardRedemptionDto) => {
    setRedemptionActionByUuid((prev) => ({ ...prev, [redemption.uuid]: "reject" }));

    try {
      await rejectRedemption(redemption.uuid, { reviewedNote: t("common.reject", "Reject") });
    } finally {
      setRedemptionActionByUuid((prev) => {
        const next = { ...prev };
        delete next[redemption.uuid];
        return next;
      });
    }
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.approvals.title", "Approvals")}
        </h1>
      </div>
    ),
    [t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-background bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-6">
      <ParentFeatureGate featureId="approvals">
        <div className="mx-auto flex h-full w-full min-w-0 flex-col gap-4">
          {pageLoading ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
              {t("common.loading", "Loading...")}
            </div>
          ) : null}

          {familyError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(familyError, "Failed to load family context.")}</span>
              <button className="font-medium underline" onClick={() => void refetchFamily()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {taskError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(taskError, "Failed to load task approvals.")}</span>
              <button className="font-medium underline" onClick={() => void refetchQueue()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {redeemError ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
              <span>{t(redeemError, "Failed to load redemption requests.")}</span>
              <button className="font-medium underline" onClick={() => void refetchRedemptions()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : null}

          {!pageLoading && visibleProfiles.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
              {t("familyTask.profiles.noProfiles", "No child profiles yet.")}
            </div>
          ) : null}

          {!pageLoading && visibleProfiles.length > 0 ? (
            <section className="min-h-0 min-w-0 flex-1 overflow-x-auto pb-2">
              <div className="flex h-full w-max min-w-full snap-x gap-4 pr-4">
                {profileColumns.map((column) => (
                  <ApprovalsProfileColumn
                    key={column.profile.profileUuid}
                    profile={column.profile}
                    profileColor={column.profileColor}
                    profileTasks={column.tasks}
                    dateGroups={column.dateGroups}
                    pendingRedemptions={column.pendingRedemptions}
                    actionByTaskUuid={taskActionByTaskUuid}
                    actionByRedemptionUuid={redemptionActionByUuid}
                    onApproveTask={handleApproveTask}
                    onRejectTask={handleRejectTask}
                    onApproveRedemption={handleApproveRedemption}
                    onRejectRedemption={handleRejectRedemption}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
