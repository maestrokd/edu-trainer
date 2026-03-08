import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useRewardRedemptions, useRewards, useStarsBalance } from "../hooks/useRewards";

export function RewardsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("rewards");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { rewards, loading, error, refetch, remove } = useRewards(true);
  const { balance } = useStarsBalance();
  const { create: createRedemption } = useRewardRedemptions();

  const [deleting, setDeleting] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const sortedRewards = useMemo(() => [...rewards].sort((a, b) => a.starsCost - b.starsCost), [rewards]);

  const handleDelete = async (rewardUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    setDeleting(rewardUuid);

    try {
      await remove(rewardUuid);
    } finally {
      setDeleting(null);
    }
  };

  const handleRedeem = async (rewardUuid: string) => {
    setRedeeming(rewardUuid);

    try {
      await createRedemption({ rewardUuid, note: t("familyTask.rewards.redeem", "Redeem") });
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{t("familyTask.rewards.title", "Rewards")}</h1>
          <div className="flex items-center gap-3">
            {balance && <span className="text-sm font-medium text-yellow-600">⭐ {balance.balance}</span>}
            {isParent && (
              <Link
                to="/family-tasks/rewards/new"
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
              >
                {t("common.new", "+ New")}
              </Link>
            )}
          </div>
        </div>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
            <span>{t(error, "Failed to load rewards.")}</span>
            <button className="underline" onClick={() => void refetch()}>
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {!loading && !error && sortedRewards.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.rewards.noRewards", "No rewards available.")}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedRewards.map((reward) => (
            <div key={reward.uuid} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{reward.title}</p>
                <span className="text-yellow-600 font-semibold text-sm whitespace-nowrap">⭐ {reward.starsCost}</span>
              </div>

              {reward.description && <p className="text-xs text-muted-foreground">{reward.description}</p>}
              {reward.availableQuantity !== null && (
                <p className="text-xs text-muted-foreground">
                  {t("familyTask.rewards.quantity", "Quantity")}: {reward.availableQuantity}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {isParent ? (
                  <>
                    <Link
                      to={`/family-tasks/rewards/${reward.uuid}`}
                      className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                    >
                      {t("common.edit", "Edit")}
                    </Link>
                    <button
                      disabled={deleting === reward.uuid}
                      className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition disabled:opacity-50"
                      onClick={() => void handleDelete(reward.uuid)}
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </>
                ) : (
                  <button
                    disabled={redeeming === reward.uuid}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90 transition disabled:opacity-50"
                    onClick={() => void handleRedeem(reward.uuid)}
                  >
                    {redeeming === reward.uuid
                      ? t("common.saving", "Saving...")
                      : t("familyTask.rewards.redeem", "Redeem")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isParent && (
          <div className="pt-4">
            <Link
              to="/family-tasks/rewards/redemptions"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {t("familyTask.rewards.viewRedemptions", "View Redemption Requests")}
            </Link>
          </div>
        )}
      </div>
    </FamilyTaskPageShell>
  );
}
