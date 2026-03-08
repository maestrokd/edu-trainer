import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { DashboardAppHeader, DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardProfileColumn } from "../components/dashboard/DashboardProfileColumn";
import { CapabilitySuggestions } from "../components/gates/CapabilitySuggestions";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { PROFILE_FALLBACK_COLORS } from "../domain/dashboard/color";
import { useFamilyTaskDashboardController } from "../hooks/useFamilyTaskDashboardController";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";

export function FamilyTaskDashboardPage() {
  const { t, i18n } = useTranslation();
  const {
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
    shiftDate,
    resetToToday,
  } = useFamilyTaskDashboardController();

  useTrackFamilyTaskPageView("dashboard");

  const appHeaderContent = useMemo(
    () => (
      <DashboardAppHeader
        familyName={family?.name}
        selectedDate={selectedDate}
        locale={i18n.language}
        isToday={isToday}
        activeProfiles={activeProfiles}
        profileFilter={profileFilter}
        showProfileFilter={!isSecondaryWithoutManageProfiles}
        onProfileFilterChange={setProfileFilter}
        onPreviousDay={() => shiftDate("prev")}
        onNextDay={() => shiftDate("next")}
        onToday={resetToToday}
      />
    ),
    [
      activeProfiles,
      family?.name,
      i18n.language,
      isSecondaryWithoutManageProfiles,
      isToday,
      profileFilter,
      resetToToday,
      selectedDate,
      setProfileFilter,
      shiftDate,
    ]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  return (
    <FamilyTaskPageShell className="h-full min-w-0 overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 p-4 sm:p-6">
      <div className="mx-auto flex h-full w-full min-w-0 flex-col gap-4">
        <DashboardHeader
          isToday={isToday}
          activeProfiles={activeProfiles}
          profileFilter={profileFilter}
          showProfileFilter={!isSecondaryWithoutManageProfiles}
          onProfileFilterChange={setProfileFilter}
          onPreviousDay={() => shiftDate("prev")}
          onNextDay={() => shiftDate("next")}
          onToday={resetToToday}
          className="hidden max-[560px]:flex"
        />

        <CapabilitySuggestions source="family_task_dashboard" />

        {familyError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {t(familyError, "Failed to load family context.")}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
            {t("common.loading", "Loading...")}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{t(error, "Failed to load task dashboard.")}</span>
            <button className="font-medium underline" onClick={() => void refetch()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        ) : null}

        {!loading && !error && visibleProfiles.length === 0 ? (
          <div className="rounded-2xl border border-white/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm">
            {t("familyTask.profiles.noProfiles", "No child profiles yet.")}
          </div>
        ) : null}

        {!loading && !error && visibleProfiles.length > 0 ? (
          <section className="min-h-0 min-w-0 flex-1 overflow-x-auto pb-2">
            <div className="flex h-full w-max min-w-full snap-x gap-4 pr-4">
              {visibleProfiles.map((profile, index) => (
                <DashboardProfileColumn
                  key={profile.profileUuid}
                  profile={profile}
                  profileColor={profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length]}
                  profileTasks={tasksByProfile[profile.profileUuid] ?? []}
                  routineSlotByUuid={routineSlotByUuid}
                  submittingByTaskUuid={submittingByTaskUuid}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </FamilyTaskPageShell>
  );
}
