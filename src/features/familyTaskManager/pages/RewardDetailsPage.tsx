import { ArrowLeft, Gift, PencilLine, Shapes, Sparkles, Smile, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { rewardsApi } from "../api/rewardsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { RewardLabelDropdown } from "../components/rewards/RewardLabelDropdown";
import { AssigneeProfilesField } from "../components/tasks/AssigneeProfilesField";
import { TaskEmojiField } from "../components/tasks/TaskEmojiField";
import { canManageFamilyTask } from "../domain/access";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { CreateRewardRequest, PatchRewardRequest, RewardLabelDto } from "../models/dto";
import { FamilyRewardLabelKind } from "../models/enums";

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

function dedupeUuids(value: string[]): string[] {
  return [...new Set(value)];
}

export function RewardDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("reward_details");
  const { handleError } = useApiErrorHandler();

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);

  const { rewardUuid } = useParams<{ rewardUuid: string }>();
  const navigate = useNavigate();
  const isNew = !rewardUuid || rewardUuid === "new";
  const { profiles } = useFamilyContext();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [starsCost, setStarsCost] = useState(1);
  const [assigneeProfileUuids, setAssigneeProfileUuids] = useState<string[]>([]);
  const [isQuantityLimited, setIsQuantityLimited] = useState(true);
  const [availableQuantity, setAvailableQuantity] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryUuid, setCategoryUuid] = useState<string[]>([]);
  const [tagUuids, setTagUuids] = useState<string[]>([]);
  const [labelByUuid, setLabelByUuid] = useState<Record<string, RewardLabelDto>>({});

  const updateLabelCache = useCallback((labels: RewardLabelDto[]) => {
    setLabelByUuid((previous) => mergeLabelsByUuid(previous, labels));
  }, []);

  useEffect(() => {
    if (!isNew || assigneeProfileUuids.length > 0 || profiles.length === 0) {
      return;
    }

    setAssigneeProfileUuids([profiles[0].profileUuid]);
  }, [assigneeProfileUuids.length, isNew, profiles]);

  useEffect(() => {
    if (!canManage || isNew || !rewardUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    rewardsApi
      .getById(rewardUuid)
      .then((reward) => {
        setTitle(reward.title);
        setEmoji(reward.emoji ?? "");
        setDescription(reward.description ?? "");
        setStarsCost(reward.starsCost);
        setAssigneeProfileUuids(reward.assigneeProfileUuids ?? []);
        if (reward.availableQuantity === null) {
          setIsQuantityLimited(false);
          setAvailableQuantity(1);
        } else {
          setIsQuantityLimited(true);
          setAvailableQuantity(Math.max(0, reward.availableQuantity));
        }
        setActive(reward.active);

        const loadedLabels = reward.labels ?? [];
        updateLabelCache(loadedLabels);
        const primaryUuid = reward.primaryLabelUuid ?? null;
        setCategoryUuid(primaryUuid ? [primaryUuid] : []);
        setTagUuids(dedupeUuids(loadedLabels.filter((label) => label.uuid !== primaryUuid).map((label) => label.uuid)));
      })
      .catch((error: unknown) =>
        handleError(error, {
          fallbackKey: "familyTask.errors.rewardLoad",
          fallbackMessage: "Failed to load reward.",
          setError,
        })
      )
      .finally(() => setLoading(false));
  }, [canManage, handleError, isNew, rewardUuid, updateLabelCache]);

  const canSave =
    title.trim().length > 0 &&
    assigneeProfileUuids.length > 0 &&
    starsCost >= 0 &&
    (!isQuantityLimited || availableQuantity >= 0);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payloadEmoji = emoji.trim() || undefined;
      const normalizedQuantity = isQuantityLimited ? Math.max(0, availableQuantity) : undefined;
      const selectedCategoryUuid = categoryUuid[0];
      const normalizedTagUuids = dedupeUuids(tagUuids.filter((uuid) => uuid !== selectedCategoryUuid));
      const labelUuids = dedupeUuids([...(selectedCategoryUuid ? [selectedCategoryUuid] : []), ...normalizedTagUuids]);
      const primaryLabelUuid = selectedCategoryUuid ?? labelUuids[0];

      if (isNew) {
        const request: CreateRewardRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          starsCost: Math.max(0, starsCost),
          availableQuantity: normalizedQuantity,
          labelUuids: labelUuids.length > 0 ? labelUuids : undefined,
          primaryLabelUuid,
        };

        await rewardsApi.create(request);
      } else {
        const request: PatchRewardRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          starsCost: Math.max(0, starsCost),
          availableQuantity: normalizedQuantity,
          labelUuids: labelUuids.length > 0 ? labelUuids : undefined,
          primaryLabelUuid,
          active,
        };

        await rewardsApi.update(rewardUuid as string, request);
      }

      navigate("/family-tasks/rewards");
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "familyTask.errors.rewardSave",
        fallbackMessage: "Failed to save reward.",
        setError,
      });
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
    <FamilyTaskPageShell className="h-full min-w-0 bg-background bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100 p-0 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-4">
      <ParentFeatureGate featureId="reward_details">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1500px]">
          <div className="hidden flex-1 items-center justify-center px-10 lg:flex">
            <div className="max-w-md space-y-2 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("familyTask.rewards.title", "Rewards")}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {isNew ? t("familyTask.rewards.create", "Create Reward") : t("familyTask.rewards.edit", "Edit Reward")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "familyTask.rewards.panelHint",
                  "Assign profiles, set emoji and stars cost, then save so the reward appears in the dashboard."
                )}
              </p>
            </div>
          </div>

          <section className="flex h-full w-full min-w-0 flex-col bg-card lg:ml-auto lg:max-w-[460px] lg:rounded-[30px] lg:border lg:border-border lg:shadow-xl">
            <header className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => navigate("/family-tasks/rewards")}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={t("common.back", "Back")}
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-foreground">
                  {isNew
                    ? t("familyTask.rewards.create", "Create Reward")
                    : t("familyTask.rewards.edit", "Edit Reward")}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {isNew ? t("common.create", "Create") : t("familyTask.tasks.updateTask", "Update task template")}
                </p>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive">
                  {t(error, "Failed to save reward.")}
                </p>
              ) : null}

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <PencilLine className="size-4 text-muted-foreground" />
                  {t("familyTask.chores.form.title", "Title")}
                </span>
                <input
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Smile className="size-4 text-muted-foreground" />
                  {t("familyTask.tasks.emoji", "Emoji (optional)")}
                </span>
                <TaskEmojiField value={emoji} onChange={setEmoji} />
              </div>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Gift className="size-4 text-muted-foreground" />
                  {t("familyTask.chores.form.description", "Description")}
                </span>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <AssigneeProfilesField
                profiles={profiles}
                value={assigneeProfileUuids}
                onChange={setAssigneeProfileUuids}
                label={t("familyTask.chores.form.assignedTo", "Assigned To")}
                emptyHint={t("familyTask.profiles.noProfiles", "No child profiles yet.")}
              />

              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Shapes className="size-4 text-muted-foreground" />
                  {t("familyTask.rewards.category", "Category")}
                </span>
                <RewardLabelDropdown
                  kind={FamilyRewardLabelKind.CATEGORY}
                  value={categoryUuid}
                  onChange={(next) => setCategoryUuid(next.slice(0, 1))}
                  placeholder={t("familyTask.rewards.selectCategory", "Select category")}
                  searchPlaceholder={t("common.search", "Search")}
                  emptyText={t("familyTask.rewards.noCategories", "No categories found.")}
                  allowCreate
                  knownLabels={labelByUuid}
                  onLabelsLoaded={updateLabelCache}
                />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Tags className="size-4 text-muted-foreground" />
                  {t("familyTask.rewards.tags", "Tags")}
                </span>
                <RewardLabelDropdown
                  kind={FamilyRewardLabelKind.TAG}
                  value={tagUuids}
                  onChange={(next) => setTagUuids(dedupeUuids(next))}
                  placeholder={t("familyTask.rewards.selectTags", "Select tags")}
                  searchPlaceholder={t("common.search", "Search")}
                  emptyText={t("familyTask.rewards.noTags", "No tags found.")}
                  multiple
                  allowCreate
                  knownLabels={labelByUuid}
                  onLabelsLoaded={updateLabelCache}
                />
              </div>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="size-4 text-muted-foreground" />
                  {t("familyTask.rewards.cost", "Cost")}
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  value={starsCost}
                  onChange={(event) => setStarsCost(Number(event.target.value))}
                />
              </label>

              <div className="space-y-3 rounded-2xl border border-border bg-muted/40 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {t("familyTask.rewards.quantityLimited", "Limit quantity")}
                  </span>
                  <Switch checked={isQuantityLimited} onCheckedChange={setIsQuantityLimited} />
                </div>

                {isQuantityLimited ? (
                  <label className="block space-y-2 text-sm">
                    <span className="font-medium text-foreground">{t("familyTask.rewards.quantity", "Quantity")}</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      value={availableQuantity}
                      onChange={(event) => setAvailableQuantity(Number(event.target.value))}
                    />
                  </label>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("familyTask.rewards.unlimitedQuantity", "Reward remains available while active.")}
                  </p>
                )}

                {!isNew ? (
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-sm font-medium text-foreground">
                      {t("familyTask.chores.active", "Active")}
                    </span>
                    <Switch checked={active} onCheckedChange={setActive} />
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="border-t border-border px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <button
                  disabled={saving || !canSave}
                  onClick={() => void handleSave()}
                  className="h-11 flex-1 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? t("common.saving", "Saving...")
                    : isNew
                      ? t("common.create", "Create")
                      : t("common.save", "Save")}
                </button>
                <button
                  onClick={() => navigate("/family-tasks/rewards")}
                  className="h-11 rounded-full border border-border px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                >
                  {t("common.cancel", "Cancel")}
                </button>
              </div>
            </footer>
          </section>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
