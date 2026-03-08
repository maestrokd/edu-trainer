import type { ChildProfileDto } from "../../models/dto";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Filter, Info, SunMedium } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatHeaderDate } from "../../domain/dashboard/date";
import { PROFILE_FALLBACK_COLORS } from "../../domain/dashboard/color";
import { NotoEmoji } from "../shared/NotoEmoji";

interface DashboardSharedControlsProps {
  isToday: boolean;
  activeProfiles: ChildProfileDto[];
  profileFilter: string[];
  showProfileFilter: boolean;
  onProfileFilterChange: (value: string[]) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

interface DashboardDateControlsProps {
  isToday: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  className?: string;
}

interface DashboardProfileFilterProps {
  activeProfiles: ChildProfileDto[];
  profileFilter: string[];
  showProfileFilter: boolean;
  onProfileFilterChange: (value: string[]) => void;
  className?: string;
}

interface DashboardHeaderProps extends DashboardSharedControlsProps {
  className?: string;
}

interface DashboardAppHeaderProps extends DashboardSharedControlsProps {
  familyName?: string | null;
  selectedDate: Date;
  locale: string;
}

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

function DashboardDateControls({ isToday, onPreviousDay, onNextDay, onToday, className }: DashboardDateControlsProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <button
        className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        onClick={onPreviousDay}
        aria-label={t("familyTask.dashboard.previousDay", "Previous day")}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        className="h-9 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onToday}
        disabled={isToday}
      >
        {t("familyTask.dashboard.today", "Today")}
      </button>
      <button
        className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        onClick={onNextDay}
        aria-label={t("familyTask.dashboard.nextDay", "Next day")}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function DashboardProfileFilter({
  activeProfiles,
  profileFilter,
  showProfileFilter,
  onProfileFilterChange,
  className,
}: DashboardProfileFilterProps) {
  const { t } = useTranslation();

  if (!showProfileFilter) {
    return null;
  }

  const selectedProfiles = new Set(profileFilter);
  const isAllSelected = profileFilter.length === 0;
  const handleProfileToggle = (profileUuid: string) => {
    const next = selectedProfiles.has(profileUuid)
      ? profileFilter.filter((item) => item !== profileUuid)
      : [...profileFilter, profileUuid];

    if (next.length === 0 || next.length === activeProfiles.length) {
      onProfileFilterChange([]);
      return;
    }

    onProfileFilterChange(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border bg-white text-slate-700 shadow-sm transition hover:bg-slate-50",
            isAllSelected ? "border-slate-200" : "border-sky-300 bg-sky-50 text-sky-700",
            className
          )}
          aria-label={t("familyTask.dashboard.filterKids", "Filter kids")}
        >
          <Filter className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,360px)] rounded-2xl border-slate-200 bg-white/95 p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {t("familyTask.dashboard.filterKids", "Filter kids")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={isAllSelected}
            onClick={() => onProfileFilterChange([])}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition",
              isAllSelected
                ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <Filter className="size-4" />
            {t("familyTask.dashboard.allKids", "All kids")}
          </button>

          {activeProfiles.map((profile, index) => {
            const isSelected = selectedProfiles.has(profile.profileUuid);
            const profileColor = profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length];

            return (
              <button
                key={profile.profileUuid}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleProfileToggle(profile.profileUuid)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border pr-3 pl-1 text-sm font-medium transition",
                  isSelected
                    ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm"
                  style={{ backgroundColor: profileColor }}
                >
                  <NotoEmoji
                    emoji={resolveProfileBadge(profile)}
                    size={24}
                    className="text-xs font-semibold text-white"
                    fallback="?"
                  />
                </span>
                <span className="max-w-[86px] truncate">{profile.displayName}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardHeader({
  isToday,
  activeProfiles,
  profileFilter,
  showProfileFilter,
  onProfileFilterChange,
  onPreviousDay,
  onNextDay,
  onToday,
  className,
}: DashboardHeaderProps) {
  return (
    <header className={cn("flex items-center gap-2", showProfileFilter ? "justify-between" : "justify-end", className)}>
      <DashboardProfileFilter
        activeProfiles={activeProfiles}
        profileFilter={profileFilter}
        showProfileFilter={showProfileFilter}
        onProfileFilterChange={onProfileFilterChange}
      />
      <DashboardDateControls isToday={isToday} onPreviousDay={onPreviousDay} onNextDay={onNextDay} onToday={onToday} />
    </header>
  );
}

export function DashboardAppHeader({
  familyName,
  selectedDate,
  locale,
  isToday,
  activeProfiles,
  profileFilter,
  showProfileFilter,
  onProfileFilterChange,
  onPreviousDay,
  onNextDay,
  onToday,
}: DashboardAppHeaderProps) {
  const { t } = useTranslation();
  const resolvedFamilyName = familyName ?? t("familyTask.sidebar.title", "Family Tasks");

  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 text-slate-900">
        <h1 className="truncate text-base font-semibold leading-none sm:text-xl">
          {formatHeaderDate(selectedDate, locale)}
        </h1>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-slate-600 min-[561px]:flex">
          <SunMedium className="size-4" />
          --°
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label={t("familyTask.dashboard.familyName", "Show family name")}
            >
              <Info className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-xl border-slate-200 bg-white/95 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              {t("familyTask.dashboard.family", "Family")}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{resolvedFamilyName}</p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DashboardProfileFilter
          activeProfiles={activeProfiles}
          profileFilter={profileFilter}
          showProfileFilter={showProfileFilter}
          onProfileFilterChange={onProfileFilterChange}
          className="hidden min-[561px]:inline-flex"
        />
        <DashboardDateControls
          isToday={isToday}
          onPreviousDay={onPreviousDay}
          onNextDay={onNextDay}
          onToday={onToday}
          className="hidden min-[561px]:flex"
        />
      </div>
    </div>
  );
}
