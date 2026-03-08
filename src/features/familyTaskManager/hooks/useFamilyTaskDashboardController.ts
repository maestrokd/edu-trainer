import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { FamilyTaskAnalyticsEvent } from "../constants/events";
import { addDays, isSameDay, normalizeDay, toLocalDateParam } from "../domain/dashboard/date";
import { groupTasksByProfile } from "../domain/dashboard/tasks";
import { useFamilyContext } from "./useFamilyContext";
import { useFamilyTaskAnalytics } from "./useFamilyTaskAnalytics";
import { useRoutines } from "./useRoutines";
import { useTaskOccurrences } from "./useTaskOccurrences";
import type { TaskOccurrenceDto } from "../models/dto";
import { FamilyRoutineSlot, FamilyTaskOccurrenceStatus } from "../models/enums";

export function useFamilyTaskDashboardController() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { family, profiles, error: familyError } = useFamilyContext();
  const routineFilters = useMemo(() => ({ active: true }), []);
  const { routines } = useRoutines(routineFilters);
  const { track } = useFamilyTaskAnalytics();

  const [selectedDate, setSelectedDate] = useState(() => normalizeDay(new Date()));
  const [profileFilter, setProfileFilter] = useState<string[]>([]);
  const [submittingByTaskUuid, setSubmittingByTaskUuid] = useState<Record<string, boolean>>({});

  const dayStart = useMemo(() => normalizeDay(selectedDate), [selectedDate]);
  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);
  const selectedLocalDate = useMemo(() => toLocalDateParam(dayStart), [dayStart]);
  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.active), [profiles]);
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;
  const isSecondaryWithoutManageProfiles = principal?.profileType === "SECONDARY" && !isParent;
  const ownProfileUuid = useMemo(() => {
    if (!isSecondaryWithoutManageProfiles || !principal?.username) {
      return null;
    }

    const username = principal.username.toLowerCase();
    return activeProfiles.find((profile) => profile.username.toLowerCase() === username)?.profileUuid ?? null;
  }, [activeProfiles, isSecondaryWithoutManageProfiles, principal?.username]);

  useEffect(() => {
    const activeProfileUuidSet = new Set(activeProfiles.map((profile) => profile.profileUuid));
    setProfileFilter((current) => {
      const normalized = current.filter((profileUuid) => activeProfileUuidSet.has(profileUuid));
      return normalized.length === current.length ? current : normalized;
    });
  }, [activeProfiles]);

  const effectiveProfileUuid = isSecondaryWithoutManageProfiles
    ? (ownProfileUuid ?? undefined)
    : profileFilter.length === 1
      ? profileFilter[0]
      : undefined;

  const occurrenceFilters = useMemo(
    () => ({
      from: selectedLocalDate,
      to: selectedLocalDate,
      profileUuid: effectiveProfileUuid,
    }),
    [effectiveProfileUuid, selectedLocalDate]
  );

  const { tasks, loading, error, refetch, submit } = useTaskOccurrences(occurrenceFilters);

  useEffect(() => {
    const filterKey = isSecondaryWithoutManageProfiles
      ? (ownProfileUuid ?? "self")
      : profileFilter.length === 0
        ? "all"
        : [...profileFilter].sort().join(",");

    track(FamilyTaskAnalyticsEvent.SESSION_STARTED, {
      screen: "dashboard",
      sessionId: `dashboard-${selectedLocalDate}-${filterKey}`,
    });
  }, [isSecondaryWithoutManageProfiles, ownProfileUuid, profileFilter, selectedLocalDate, track]);

  const routineSlotByUuid = useMemo(() => {
    const map: Record<string, FamilyRoutineSlot> = {};

    for (const routine of routines) {
      map[routine.uuid] = routine.routineSlot;
    }

    return map;
  }, [routines]);

  const visibleProfiles = useMemo(() => {
    if (isSecondaryWithoutManageProfiles) {
      if (!ownProfileUuid) {
        return [];
      }

      return activeProfiles.filter((profile) => profile.profileUuid === ownProfileUuid);
    }

    if (profileFilter.length === 0) {
      return activeProfiles;
    }

    const selectedProfileUuidSet = new Set(profileFilter);
    return activeProfiles.filter((profile) => selectedProfileUuidSet.has(profile.profileUuid));
  }, [activeProfiles, isSecondaryWithoutManageProfiles, ownProfileUuid, profileFilter]);

  const tasksByProfile = useMemo(() => groupTasksByProfile(tasks, routineSlotByUuid), [routineSlotByUuid, tasks]);
  const shiftDate = useCallback(
    (direction: "prev" | "next") => setSelectedDate((prev) => addDays(prev, direction === "prev" ? -1 : 1)),
    []
  );
  const resetToToday = useCallback(() => setSelectedDate(normalizeDay(new Date())), []);

  const handleComplete = async (task: TaskOccurrenceDto) => {
    if (task.status !== FamilyTaskOccurrenceStatus.OPEN) {
      return;
    }

    setSubmittingByTaskUuid((prev) => ({ ...prev, [task.uuid]: true }));

    try {
      await submit(task.uuid, { note: t("familyTask.today.submitted", "Done") });
      track(FamilyTaskAnalyticsEvent.TASK_SUBMITTED, {
        screen: "dashboard",
        featureId: task.sourceType,
        source: "task_card",
        status: task.status,
      });
    } catch {
      notifier.error(t("familyTask.errors.submitTask", "Failed to submit task completion."));
    } finally {
      setSubmittingByTaskUuid((prev) => {
        const next = { ...prev };
        delete next[task.uuid];
        return next;
      });
    }
  };

  return {
    family,
    familyError,
    selectedDate,
    isToday,
    activeProfiles,
    visibleProfiles,
    profileFilter,
    setProfileFilter,
    isSecondaryWithoutManageProfiles,
    tasksByProfile,
    routineSlotByUuid,
    submittingByTaskUuid,
    loading,
    error,
    refetch,
    handleComplete,
    setSelectedDate,
    shiftDate,
    resetToToday,
  };
}
