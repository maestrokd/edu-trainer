import { Check, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "../../domain/dashboard/color";
import { isKnownApprovalDateKey, type ApprovalDateGroup } from "../../domain/dashboard/approvals";
import { SECTION_ORDER, TOP_SLOT_ORDER, type TopSlot } from "../../domain/dashboard/types";
import type { ChildProfileDto, RewardRedemptionDto, TaskOccurrenceDto } from "../../models/dto";
import { ApprovalTaskCard } from "./ApprovalTaskCard";
import { NotoEmoji } from "../shared/NotoEmoji";

interface ApprovalsProfileColumnProps {
  profile: ChildProfileDto;
  profileColor: string;
  profileTasks: TaskOccurrenceDto[];
  dateGroups: ApprovalDateGroup[];
  pendingRedemptions: RewardRedemptionDto[];
  actionByTaskUuid: Record<string, "approve" | "reject" | undefined>;
  actionByRedemptionUuid: Record<string, "approve" | "reject" | undefined>;
  onApproveTask: (task: TaskOccurrenceDto) => void;
  onRejectTask: (task: TaskOccurrenceDto) => void;
  onApproveRedemption: (redemption: RewardRedemptionDto) => void;
  onRejectRedemption: (redemption: RewardRedemptionDto) => void;
}

const TOP_SLOT_ICONS: Record<TopSlot, string> = {
  morning: "☀️",
  afternoon: "🌤️",
  anytime: "🕘",
  evening: "🌙",
  chores: "🧹",
};

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

function formatDateSeparatorLabel(dateKey: string, locale: string, fallbackLabel: string): string {
  if (!isKnownApprovalDateKey(dateKey)) {
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

export function ApprovalsProfileColumn({
  profile,
  profileColor,
  profileTasks,
  dateGroups,
  pendingRedemptions,
  actionByTaskUuid,
  actionByRedemptionUuid,
  onApproveTask,
  onRejectTask,
  onApproveRedemption,
  onRejectRedemption,
}: ApprovalsProfileColumnProps) {
  const { t, i18n } = useTranslation();
  const [slotFilters, setSlotFilters] = useState<Record<TopSlot, boolean>>(() =>
    TOP_SLOT_ORDER.reduce<Record<TopSlot, boolean>>(
      (accumulator, slot) => {
        accumulator[slot] = true;
        return accumulator;
      },
      {} as Record<TopSlot, boolean>
    )
  );

  const slotCounts = useMemo(
    () =>
      TOP_SLOT_ORDER.reduce<Record<TopSlot, number>>(
        (accumulator, slot) => {
          accumulator[slot] = dateGroups.reduce((sum, group) => sum + (group.tasksBySection[slot]?.length ?? 0), 0);
          return accumulator;
        },
        {} as Record<TopSlot, number>
      ),
    [dateGroups]
  );

  const pendingCount = profileTasks.length;
  const pendingStars = profileTasks.reduce((sum, task) => sum + task.starsReward, 0);
  const pendingRedemptionsCount = pendingRedemptions.length;
  const slotHasTasks = useMemo(
    () =>
      TOP_SLOT_ORDER.reduce<Record<TopSlot, boolean>>(
        (accumulator, slot) => {
          accumulator[slot] = slotCounts[slot] > 0;
          return accumulator;
        },
        {} as Record<TopSlot, boolean>
      ),
    [slotCounts]
  );

  const hasVisibleGroups = dateGroups.some((group) =>
    SECTION_ORDER.some((section) => slotFilters[section] && (group.tasksBySection[section]?.length ?? 0) > 0)
  );

  const formatRedemptionDateLabel = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return t("familyTask.redemptions.noDate", "Unknown date");
    }

    return new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  };

  const handleSlotFilterToggle = (slot: TopSlot) => {
    if (!slotHasTasks[slot]) {
      return;
    }

    setSlotFilters((current) => ({
      ...current,
      [slot]: !current[slot],
    }));
  };

  return (
    <article
      className="flex h-full w-[300px] shrink-0 snap-start flex-col rounded-[32px] border border-border/70 p-4 shadow-sm sm:w-[320px]"
      style={{
        background: `linear-gradient(165deg, ${hexToRgba(profileColor, 0.26)}, ${hexToRgba(profileColor, 0.1)})`,
      }}
    >
      <header className="space-y-1">
        <div className="flex items-stretch gap-3">
          <span
            className="flex size-12 shrink-0 items-center justify-center self-stretch rounded-full shadow-sm"
            style={{ backgroundColor: profileColor }}
          >
            <NotoEmoji
              emoji={resolveProfileBadge(profile)}
              size={40}
              className="text-white text-lg font-semibold"
              fallback="?"
            />
          </span>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
            <h2 className="truncate text-xl font-semibold leading-tight text-foreground">{profile.displayName}</h2>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 items-center rounded-full bg-background/75 px-2 text-[11px] font-semibold text-foreground/80">
                ⏳ {pendingCount}
              </span>
              <span className="inline-flex h-5 items-center rounded-full bg-background/75 px-2 text-[11px] font-semibold text-foreground/80">
                🎁 {pendingRedemptionsCount}
              </span>
              {pendingStars > 0 ? (
                <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-300/30 dark:text-amber-100">
                  ⭐ {pendingStars}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          {TOP_SLOT_ORDER.map((slot) => {
            const slotCount = slotCounts[slot];
            const ratio = pendingCount === 0 ? 0 : slotCount / pendingCount;
            const ringDegrees = Math.max(0, Math.min(360, Math.round(360 * ratio)));
            const icon = TOP_SLOT_ICONS[slot];
            const slotLabel = t(`familyTask.today.slots.${slot}`, slot);
            const isDisabled = !slotHasTasks[slot];
            const isOn = slotFilters[slot];
            const isOff = !isDisabled && !isOn;
            const ringColor = hexToRgba(profileColor, isDisabled ? 0.25 : isOff ? 0.45 : 1);
            const ringTrackColor = hexToRgba(profileColor, isDisabled ? 0.16 : 0.24);
            const ringBackgroundImage =
              ringDegrees > 0 ? `conic-gradient(${ringColor} ${ringDegrees}deg, ${ringTrackColor} 0deg)` : undefined;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotFilterToggle(slot)}
                disabled={isDisabled}
                aria-pressed={isOn}
                className={`min-w-0 flex-1 space-y-1 text-center transition ${isDisabled ? "cursor-not-allowed opacity-45 grayscale" : ""} ${isOff ? "opacity-60 saturate-50" : "opacity-100"}`}
                title={slotLabel}
              >
                <div
                  className="mx-auto size-10 rounded-full p-[2px]"
                  style={{
                    backgroundColor: ringTrackColor,
                    backgroundImage: ringBackgroundImage,
                  }}
                >
                  <div
                    className={`flex size-full items-center justify-center rounded-full text-base ${isDisabled ? "bg-background/55 text-muted-foreground" : isOff ? "bg-background/70 text-foreground/70" : "bg-background/85 text-foreground"}`}
                  >
                    {icon}
                  </div>
                </div>
                <p
                  className={`text-[10px] font-medium capitalize leading-tight ${isDisabled ? "text-muted-foreground/70" : isOff ? "text-foreground/65" : "text-foreground/80"}`}
                >
                  {slotLabel}
                </p>
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-1 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/75">
            {t("familyTask.approvals.tasks", "Task Completions")}
          </h3>

          {dateGroups.map((group) => {
            const visibleSections = SECTION_ORDER.filter(
              (section) => slotFilters[section] && (group.tasksBySection[section]?.length ?? 0) > 0
            );

            if (visibleSections.length === 0) {
              return null;
            }

            return (
              <section key={group.dateKey} className="space-y-2">
                <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
                  <span className="h-px flex-1 bg-border/70" />
                  {formatDateSeparatorLabel(
                    group.dateKey,
                    i18n.language,
                    t("familyTask.redemptions.noDate", "Unknown date")
                  )}
                  <span className="h-px flex-1 bg-border/70" />
                </h4>

                {visibleSections.map((section) => (
                  <section key={`${group.dateKey}-${section}`} className="space-y-2">
                    <h5 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/75">
                      {t(`familyTask.today.slots.${section}`, section)}
                    </h5>
                    <div className="space-y-2">
                      {(group.tasksBySection[section] ?? []).map((task) => (
                        <ApprovalTaskCard
                          key={task.uuid}
                          task={task}
                          section={section}
                          isApproving={actionByTaskUuid[task.uuid] === "approve"}
                          isRejecting={actionByTaskUuid[task.uuid] === "reject"}
                          onApprove={onApproveTask}
                          onReject={onRejectTask}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            );
          })}

          {pendingCount === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/65 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("familyTask.approvals.taskEmpty", "No pending task approvals.")}
            </div>
          ) : !hasVisibleGroups ? (
            <div className="rounded-2xl border border-border/70 bg-card/65 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("familyTask.dashboard.filtersEmpty", "No tasks in the enabled filters.")}
            </div>
          ) : null}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/75">
            {t("familyTask.approvals.rewards", "Reward Redemptions")}
          </h3>

          {pendingRedemptions.map((redemption) => {
            const reward = redemption.reward;
            const rewardTitle = reward?.title ?? redemption.rewardUuid;
            const rewardEmoji = reward?.emoji?.trim() || "🎁";
            const isApproving = actionByRedemptionUuid[redemption.uuid] === "approve";
            const isRejecting = actionByRedemptionUuid[redemption.uuid] === "reject";
            const isSubmitting = isApproving || isRejecting;

            return (
              <article
                key={redemption.uuid}
                className="rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm"
              >
                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <NotoEmoji emoji={rewardEmoji} size={30} fallback="🎁" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{rewardTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatRedemptionDateLabel(redemption.createdDate)}</p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onApproveRedemption(redemption)}
                    disabled={isSubmitting}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70 dark:text-emerald-200"
                  >
                    {isApproving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    {t("common.approve", "Approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectRedemption(redemption)}
                    disabled={isSubmitting}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-destructive/50 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isRejecting ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                    {t("common.reject", "Reject")}
                  </button>
                </div>
              </article>
            );
          })}

          {pendingRedemptionsCount === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/65 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("familyTask.approvals.redemptionEmpty", "No pending redemption requests.")}
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
}
