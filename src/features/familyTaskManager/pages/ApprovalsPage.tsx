import { useTranslation } from "react-i18next";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { AssigneeProfileBadge } from "../components/shared/AssigneeProfileBadge";
import { PROFILE_FALLBACK_COLORS } from "../domain/dashboard/color";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRewardRedemptions, useRewards } from "../hooks/useRewards";
import { useApprovalQueue } from "../hooks/useTaskOccurrences";
import { FamilyRewardRedemptionStatus } from "../models/enums";

export function ApprovalsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("approvals");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;
  const { profiles } = useFamilyContext();

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
  } = useRewardRedemptions(FamilyRewardRedemptionStatus.PENDING);
  const { rewards } = useRewards(true);

  const rewardTitleByUuid = new Map(rewards.map((reward) => [reward.uuid, reward.title]));
  const profileByUuid = new Map(
    profiles.map((profile, index) => [
      profile.profileUuid,
      {
        profile,
        color: profile.color ?? PROFILE_FALLBACK_COLORS[index % PROFILE_FALLBACK_COLORS.length],
      },
    ])
  );

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="approvals">
        <div className="space-y-8">
          <h1 className="text-2xl font-semibold">{t("familyTask.approvals.title", "Approvals")}</h1>

          <section>
            <h2 className="text-lg font-medium mb-3">{t("familyTask.approvals.tasks", "Task Completions")}</h2>
            {taskLoading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
            {taskError && (
              <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
                <span>{t(taskError, "Failed to load task approvals.")}</span>
                <button className="underline" onClick={() => void refetchQueue()}>
                  {t("common.retry", "Retry")}
                </button>
              </div>
            )}
            {!taskLoading && !taskError && queue.length === 0 && (
              <p className="text-muted-foreground">
                {t("familyTask.approvals.taskEmpty", "No pending task approvals.")}
              </p>
            )}

            <div className="space-y-2">
              {queue.map((task) => {
                const assignee = profileByUuid.get(task.assigneeProfileUuid);

                return (
                  <div
                    key={task.uuid}
                    className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <AssigneeProfileBadge
                          profile={assignee?.profile}
                          profileColor={assignee?.color}
                          unknownLabel={t("familyTask.profiles.unknown", "Unknown")}
                        />
                        <p className="text-xs text-muted-foreground">⭐ {task.starsReward}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void approveTask(task.uuid, { note: t("common.approve", "Approve") })}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:opacity-90 transition"
                      >
                        {t("common.approve", "Approve")}
                      </button>
                      <button
                        onClick={() => void rejectTask(task.uuid, { note: t("common.reject", "Reject") })}
                        className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                      >
                        {t("common.reject", "Reject")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">{t("familyTask.approvals.rewards", "Reward Redemptions")}</h2>
            {redeemLoading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
            {redeemError && (
              <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
                <span>{t(redeemError, "Failed to load redemption requests.")}</span>
                <button className="underline" onClick={() => void refetchRedemptions()}>
                  {t("common.retry", "Retry")}
                </button>
              </div>
            )}
            {!redeemLoading && !redeemError && redemptions.length === 0 && (
              <p className="text-muted-foreground">
                {t("familyTask.approvals.redemptionEmpty", "No pending redemption requests.")}
              </p>
            )}

            <div className="space-y-2">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.uuid}
                  className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {rewardTitleByUuid.get(redemption.rewardUuid) ?? redemption.rewardUuid}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(redemption.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        void approveRedemption(redemption.uuid, { reviewedNote: t("common.approve", "Approve") })
                      }
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:opacity-90 transition"
                    >
                      {t("common.approve", "Approve")}
                    </button>
                    <button
                      onClick={() =>
                        void rejectRedemption(redemption.uuid, { reviewedNote: t("common.reject", "Reject") })
                      }
                      className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                    >
                      {t("common.reject", "Reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
