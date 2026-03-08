import { CalendarDays, ArrowLeft, CheckSquare, PencilLine, Repeat, ShieldCheck, Sparkles, Smile } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { routinesApi } from "../api/routinesApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { AssigneeProfilesField } from "../components/tasks/AssigneeProfilesField";
import { TaskEmojiField } from "../components/tasks/TaskEmojiField";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { CreateRoutineRequest, PatchRoutineRequest } from "../models/dto";
import { FamilyRoutineRecurrenceType, FamilyRoutineSlot } from "../models/enums";

const WEEK_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export function RoutineDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("routine_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profiles } = useFamilyContext();
  const { routineUuid } = useParams<{ routineUuid: string }>();
  const navigate = useNavigate();
  const isNew = !routineUuid || routineUuid === "new";

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [routineSlot, setRoutineSlot] = useState<FamilyRoutineSlot>(FamilyRoutineSlot.MORNING);
  const [starsReward, setStarsReward] = useState(1);
  const [recurrenceType, setRecurrenceType] = useState<FamilyRoutineRecurrenceType>(FamilyRoutineRecurrenceType.DAILY);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);
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
    if (!isParent || isNew || !routineUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    routinesApi
      .getById(routineUuid)
      .then((routine) => {
        setTitle(routine.title);
        setEmoji(routine.emoji ?? "");
        setDescription(routine.description ?? "");
        setRoutineSlot(routine.routineSlot);
        setStarsReward(routine.starsReward);
        setRecurrenceType(routine.recurrenceType);
        setRecurrenceInterval(routine.recurrenceInterval);
        setSelectedDays(routine.weekdays ? routine.weekdays.split(",").filter(Boolean) : []);
        setStartDate(routine.startDate);
        setEndDate(routine.endDate ?? "");
        setRequiresApproval(routine.requiresApproval);
        setActive(routine.active);
        setAssigneeProfileUuids(routine.assigneeProfileUuids ?? []);
      })
      .catch(() => setError("familyTask.errors.routineLoad"))
      .finally(() => setLoading(false));
  }, [isNew, routineUuid, isParent]);

  const weekdaysValue = useMemo(() => {
    if (recurrenceType !== FamilyRoutineRecurrenceType.WEEKLY) {
      return null;
    }

    return selectedDays.length > 0 ? selectedDays.join(",") : null;
  }, [recurrenceType, selectedDays]);

  const toggleWeekday = (weekday: string) => {
    setSelectedDays((prev) => (prev.includes(weekday) ? prev.filter((item) => item !== weekday) : [...prev, weekday]));
  };

  const canSave =
    title.trim().length > 0 &&
    assigneeProfileUuids.length > 0 &&
    (recurrenceType !== FamilyRoutineRecurrenceType.WEEKLY || selectedDays.length > 0);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payloadEmoji = emoji.trim() || undefined;

      if (isNew) {
        const request: CreateRoutineRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          recurrenceType,
          recurrenceInterval,
          weekdays: weekdaysValue,
          routineSlot,
          startDate,
          endDate: endDate || null,
          requiresApproval,
          starsReward,
        };

        await routinesApi.create(request);
      } else {
        const request: PatchRoutineRequest = {
          assigneeProfileUuids,
          title: title.trim(),
          emoji: payloadEmoji,
          description: description || undefined,
          recurrenceType,
          recurrenceInterval,
          weekdays: weekdaysValue,
          routineSlot,
          startDate,
          endDate: endDate || null,
          requiresApproval,
          starsReward,
          active,
        };

        await routinesApi.update(routineUuid as string, request);
      }

      navigate("/family-tasks/routines");
    } catch {
      setError("familyTask.errors.routineSave");
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
      <ParentFeatureGate featureId="routine_details">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1500px]">
          <div className="hidden flex-1 items-center justify-center px-10 lg:flex">
            <div className="max-w-md space-y-2 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t("familyTask.routines.title", "Routines")}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {isNew
                  ? t("familyTask.routines.create", "Create Routine")
                  : t("familyTask.routines.edit", "Edit Routine")}
              </h2>
              <p className="text-sm text-slate-600">
                {t(
                  "familyTask.routines.panelHint",
                  "Assign one or more profiles, choose recurrence, and save to synchronize upcoming occurrences."
                )}
              </p>
            </div>
          </div>

          <section className="flex h-full w-full min-w-0 flex-col bg-white lg:ml-auto lg:max-w-[460px] lg:rounded-[30px] lg:border lg:border-slate-200 lg:shadow-xl">
            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => navigate("/family-tasks/routines")}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label={t("common.back", "Back")}
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-slate-900">
                  {isNew
                    ? t("familyTask.routines.create", "Create Routine")
                    : t("familyTask.routines.edit", "Edit Routine")}
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
                <Link
                  to="/family-tasks/chores/new"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {t("familyTask.chores.title", "Chore")}
                </Link>
                <span className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                  {t("familyTask.routines.title", "Routine")}
                </span>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {t(error, "Failed to save routine.")}
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
                  {t("familyTask.routines.slot", "Time Slot")}
                </span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                  value={routineSlot}
                  onChange={(event) => setRoutineSlot(event.target.value as FamilyRoutineSlot)}
                >
                  {Object.values(FamilyRoutineSlot).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                    <Repeat className="size-4 text-slate-500" />
                    {t("familyTask.routines.recurrenceType", "Recurrence Type")}
                  </span>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                    value={recurrenceType}
                    onChange={(event) => setRecurrenceType(event.target.value as FamilyRoutineRecurrenceType)}
                  >
                    {Object.values(FamilyRoutineRecurrenceType).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">
                    {t("familyTask.routines.recurrenceInterval", "Interval")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                    value={recurrenceInterval}
                    onChange={(event) => setRecurrenceInterval(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
              </div>

              {recurrenceType === FamilyRoutineRecurrenceType.WEEKLY ? (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                  <p className="text-sm font-medium text-slate-700">{t("familyTask.routines.weekdays", "Weekdays")}</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selectedDays.includes(day)
                            ? "border-sky-300 bg-sky-100 text-slate-900"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      {t("familyTask.routines.weekdaysHint", "Select at least one day for weekly recurrence.")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                    <CalendarDays className="size-4 text-slate-500" />
                    {t("familyTask.routines.startDate", "Start Date")}
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">{t("familyTask.routines.endDate", "End Date")}</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition focus:border-slate-400"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
              </div>

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
                  onChange={(event) => setStarsReward(Math.max(0, Number(event.target.value) || 0))}
                />
              </label>

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
                  onClick={() => navigate("/family-tasks/routines")}
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
