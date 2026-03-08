import { CalendarDays, ArrowLeft, CheckSquare, PencilLine, ShieldCheck, Sparkles, Smile } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { choresApi } from "../api/choresApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { AssigneeProfilesField } from "../components/tasks/AssigneeProfilesField";
import { TaskEmojiField } from "../components/tasks/TaskEmojiField";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ChoreDto, CreateChoreRequest, PatchChoreRequest } from "../models/dto";

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ChoreDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("chore_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profiles } = useFamilyContext();
  const { choreUuid } = useParams<{ choreUuid: string }>();
  const navigate = useNavigate();
  const isNew = !choreUuid || choreUuid === "new";

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [starsReward, setStarsReward] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [active, setActive] = useState(true);
  const [assigneeProfileUuids, setAssigneeProfileUuids] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew || assigneeProfileUuids.length > 0 || profiles.length === 0) {
      return;
    }

    setAssigneeProfileUuids([profiles[0].profileUuid]);
  }, [assigneeProfileUuids.length, isNew, profiles]);

  useEffect(() => {
    if (!isParent || isNew || !choreUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    choresApi
      .getById(choreUuid)
      .then((chore: ChoreDto) => {
        setTitle(chore.title);
        setEmoji(chore.emoji ?? "");
        setDescription(chore.description ?? "");
        setStarsReward(chore.starsReward);
        setDueDate(chore.dueDate ?? "");
        setHasDueDate(Boolean(chore.dueDate));
        setRequiresApproval(chore.requiresApproval);
        setActive(chore.active);
        setAssigneeProfileUuids(chore.assigneeProfileUuids ?? []);
      })
      .catch(() => setError("familyTask.errors.choreLoad"))
      .finally(() => setLoading(false));
  }, [choreUuid, isNew, isParent]);

  const handleDueDateToggle = (checked: boolean) => {
    setHasDueDate(checked);

    if (checked && !dueDate) {
      setDueDate(todayDateValue());
    }

    if (!checked) {
      setDueDate("");
    }
  };

  const canSave = title.trim().length > 0 && assigneeProfileUuids.length > 0 && (!hasDueDate || Boolean(dueDate));

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payloadDueDate = hasDueDate ? dueDate || undefined : undefined;
      const payloadEmoji = emoji.trim() || undefined;

      if (isNew) {
        const request: CreateChoreRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          dueDate: payloadDueDate,
          requiresApproval,
          starsReward,
        };

        await choresApi.create(request);
      } else {
        const request: PatchChoreRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          dueDate: payloadDueDate,
          requiresApproval,
          starsReward,
          active,
        };

        await choresApi.update(choreUuid as string, request);
      }

      navigate("/family-tasks/chores");
    } catch {
      setError("familyTask.errors.choreSave");
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
    <FamilyTaskPageShell className="h-full min-w-0 bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100 p-0 sm:p-4">
      <ParentFeatureGate featureId="chore_details">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1500px]">
          <div className="hidden flex-1 items-center justify-center px-10 lg:flex">
            <div className="max-w-md space-y-2 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t("familyTask.chores.title", "Chores")}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {isNew ? t("familyTask.chores.create", "Create Chore") : t("familyTask.chores.edit", "Edit Chore")}
              </h2>
              <p className="text-sm text-slate-600">
                {t(
                  "familyTask.chores.panelHint",
                  "Select one or more profiles and configure due date and approval behavior before saving."
                )}
              </p>
            </div>
          </div>

          <section className="flex h-full w-full min-w-0 flex-col bg-white lg:ml-auto lg:max-w-[460px] lg:rounded-[30px] lg:border lg:border-slate-200 lg:shadow-xl">
            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => navigate("/family-tasks/chores")}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label={t("common.back", "Back")}
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-slate-900">
                  {isNew ? t("familyTask.chores.create", "Create Chore") : t("familyTask.chores.edit", "Edit Chore")}
                </h1>
                <p className="truncate text-sm text-slate-500">
                  {isNew
                    ? t("familyTask.tasks.addTask", "Add task")
                    : t("familyTask.tasks.updateTask", "Update task template")}
                </p>
              </div>
            </header>

            {isNew && (
              <div className="grid grid-cols-2 gap-1 border-b border-slate-200 px-4 py-3 sm:px-5">
                <span className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                  {t("familyTask.chores.title", "Chore")}
                </span>
                <Link
                  to="/family-tasks/routines/new"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {t("familyTask.routines.title", "Routine")}
                </Link>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {t(error, "Failed to save chore.")}
                </p>
              ) : null}

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <PencilLine className="size-4 text-slate-500" />
                  {t("familyTask.chores.form.title", "Title")}
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Smile className="size-4 text-slate-500" />
                  {t("familyTask.tasks.emoji", "Emoji (optional)")}
                </span>
                <TaskEmojiField
                  value={emoji}
                  onChange={setEmoji}
                  placeholder={t("familyTask.tasks.emojiPlaceholder", "Type or select emoji")}
                />
              </div>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CheckSquare className="size-4 text-slate-500" />
                  {t("familyTask.chores.form.description", "Description")}
                </span>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
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

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Sparkles className="size-4 text-slate-500" />
                  {t("familyTask.chores.form.points", "Stars")}
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                  value={starsReward}
                  onChange={(event) => setStarsReward(Number(event.target.value))}
                />
              </label>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CalendarDays className="size-4 text-slate-500" />
                    {t("familyTask.chores.dueDate", "Due Date")}
                  </span>
                  <Switch checked={hasDueDate} onCheckedChange={handleDueDateToggle} />
                </div>
                {hasDueDate ? (
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ShieldCheck className="size-4 text-slate-500" />
                    {t("familyTask.chores.requiresApproval", "Requires approval")}
                  </span>
                  <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
                </div>

                {!isNew ? (
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <span className="text-sm font-medium text-slate-700">
                      {t("familyTask.chores.active", "Active")}
                    </span>
                    <Switch checked={active} onCheckedChange={setActive} />
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="border-t border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <button
                  disabled={saving || !canSave}
                  onClick={() => void handleSave()}
                  className="h-11 flex-1 rounded-full bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? t("common.saving", "Saving...")
                    : isNew
                      ? t("familyTask.tasks.addTask", "Add task")
                      : t("common.save", "Save")}
                </button>
                <button
                  onClick={() => navigate("/family-tasks/chores")}
                  className="h-11 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
