import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { rewardsApi } from "../api/rewardsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { CreateRewardRequest, PatchRewardRequest } from "../models/dto";

export function RewardDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("reward_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { rewardUuid } = useParams<{ rewardUuid: string }>();
  const navigate = useNavigate();
  const isNew = !rewardUuid || rewardUuid === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starsCost, setStarsCost] = useState(10);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isParent || isNew || !rewardUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    rewardsApi
      .getById(rewardUuid)
      .then((reward) => {
        setTitle(reward.title);
        setDescription(reward.description ?? "");
        setStarsCost(reward.starsCost);
        setAvailableQuantity(reward.availableQuantity ?? 1);
        setActive(reward.active);
      })
      .catch(() => setError("familyTask.errors.rewardLoad"))
      .finally(() => setLoading(false));
  }, [isNew, rewardUuid, isParent]);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const request: CreateRewardRequest = {
          title: title.trim(),
          description: description || undefined,
          starsCost,
          availableQuantity,
        };

        await rewardsApi.create(request);
      } else {
        const request: PatchRewardRequest = {
          title: title.trim(),
          description: description || undefined,
          starsCost,
          availableQuantity,
          active,
        };

        await rewardsApi.update(rewardUuid as string, request);
      }

      navigate("/family-tasks/rewards");
    } catch {
      setError("familyTask.errors.rewardSave");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FamilyTaskPageShell>
        <div className="text-muted-foreground">{t("common.loading", "Loading...")}</div>
      </FamilyTaskPageShell>
    );
  }

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="reward_details">
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold">
            {isNew ? t("familyTask.rewards.create", "Create Reward") : t("familyTask.rewards.edit", "Edit Reward")}
          </h1>
          {error && <p className="text-sm text-destructive">{t(error, "Failed to save reward.")}</p>}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("familyTask.chores.form.title", "Title")}</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("familyTask.chores.form.description", "Description")}
              </label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("familyTask.rewards.cost", "Cost")}</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={starsCost}
                onChange={(event) => setStarsCost(Number(event.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t("familyTask.rewards.quantity", "Quantity")}</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={availableQuantity}
                onChange={(event) => setAvailableQuantity(Number(event.target.value))}
              />
            </div>

            {!isNew && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
                <span>{t("familyTask.chores.active", "Active")}</span>
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              disabled={saving || !title.trim()}
              onClick={() => void handleSave()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </button>
            <button
              onClick={() => navigate("/family-tasks/rewards")}
              className="border px-5 py-2 rounded-md text-sm hover:bg-accent transition"
            >
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
