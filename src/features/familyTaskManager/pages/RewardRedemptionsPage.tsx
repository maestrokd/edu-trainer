import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRewardRedemptions, useRewards } from "../hooks/useRewards";
import { FamilyRewardRedemptionStatus } from "../models/enums";

function statusClasses(status: string): string {
  if (status === FamilyRewardRedemptionStatus.APPROVED) {
    return "bg-green-100 text-green-700";
  }

  if (status === FamilyRewardRedemptionStatus.REJECTED) {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export function RewardRedemptionsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("reward_redemptions");

  const { redemptions, loading, error, refetch, approve, reject } = useRewardRedemptions();
  const { rewards } = useRewards(true);
  const rewardTitleByUuid = new Map(rewards.map((reward) => [reward.uuid, reward.title]));

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="reward_redemptions">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{t("familyTask.redemptions.title", "Reward Redemptions")}</h1>
            <Link to="/family-tasks/rewards" className="text-sm text-primary underline-offset-2 hover:underline">
              {t("common.back", "Back")}
            </Link>
          </div>

          {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
              <span>{t(error, "Failed to load redemptions.")}</span>
              <button className="underline" onClick={() => void refetch()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}
          {!loading && !error && redemptions.length === 0 && (
            <p className="text-muted-foreground">{t("familyTask.redemptions.empty", "No redemptions yet.")}</p>
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
                  {redemption.note && <p className="text-xs text-muted-foreground">{redemption.note}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses(redemption.status)}`}>
                    {redemption.status}
                  </span>

                  {redemption.status === FamilyRewardRedemptionStatus.PENDING && (
                    <>
                      <button
                        onClick={() => void approve(redemption.uuid, { reviewedNote: t("common.approve", "Approve") })}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:opacity-90 transition"
                      >
                        {t("common.approve", "Approve")}
                      </button>
                      <button
                        onClick={() => void reject(redemption.uuid, { reviewedNote: t("common.reject", "Reject") })}
                        className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                      >
                        {t("common.reject", "Reject")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
