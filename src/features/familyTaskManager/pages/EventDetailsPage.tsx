import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { eventRecurrenceRulesApi, eventsApi } from "../api/eventsApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { CreateEventRequest, EventRecurrenceRuleDto, PatchEventRequest } from "../models/dto";

function toInputDateTime(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export function EventDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("event_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profiles } = useFamilyContext();
  const { eventUuid } = useParams<{ eventUuid: string }>();
  const navigate = useNavigate();
  const isNew = !eventUuid || eventUuid === "new";

  const now = new Date();
  now.setMinutes(0, 0, 0);
  const later = new Date(now);
  later.setHours(later.getHours() + 1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(toInputDateTime(now.toISOString()));
  const [endsAt, setEndsAt] = useState(toInputDateTime(later.toISOString()));
  const [allDay, setAllDay] = useState(false);
  const [assigneeProfileUuid, setAssigneeProfileUuid] = useState("");
  const [recurrenceRuleUuid, setRecurrenceRuleUuid] = useState("");
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<EventRecurrenceRuleDto[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assigneeProfileUuid && profiles.length > 0) {
      setAssigneeProfileUuid(profiles[0].profileUuid);
    }
  }, [assigneeProfileUuid, profiles]);

  useEffect(() => {
    eventRecurrenceRulesApi
      .getAll()
      .then((data) => setRules(data.filter((rule) => rule.active)))
      .catch(() => setRules([]));
  }, []);

  useEffect(() => {
    if (!isParent || isNew || !eventUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    eventsApi
      .getById(eventUuid)
      .then((event) => {
        setTitle(event.title);
        setDescription(event.description ?? "");
        setStartsAt(toInputDateTime(event.startsAt));
        setEndsAt(toInputDateTime(event.endsAt));
        setAllDay(event.allDay);
        setAssigneeProfileUuid(event.assigneeProfileUuid ?? "");
        setRecurrenceRuleUuid(event.recurrenceRuleUuid ?? "");
        setActive(event.active);
      })
      .catch(() => setError("familyTask.errors.eventLoad"))
      .finally(() => setLoading(false));
  }, [eventUuid, isNew, isParent]);

  const handleSave = async () => {
    if (!title.trim() || !startsAt) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const request: CreateEventRequest = {
          title: title.trim(),
          description: description || undefined,
          startsAt: toIso(startsAt),
          endsAt: endsAt ? toIso(endsAt) : undefined,
          allDay,
          assigneeProfileUuid: assigneeProfileUuid || undefined,
          recurrenceRuleUuid: recurrenceRuleUuid || null,
        };

        await eventsApi.create(request);
      } else {
        const request: PatchEventRequest = {
          title: title.trim(),
          description: description || undefined,
          startsAt: toIso(startsAt),
          endsAt: endsAt ? toIso(endsAt) : undefined,
          allDay,
          assigneeProfileUuid: assigneeProfileUuid || undefined,
          recurrenceRuleUuid: recurrenceRuleUuid || null,
          active,
        };

        await eventsApi.update(eventUuid as string, request);
      }

      navigate("/family-tasks/calendar");
    } catch {
      setError("familyTask.errors.eventSave");
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
      <ParentFeatureGate featureId="event_details">
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold">
            {isNew ? t("familyTask.calendar.create", "Create Event") : t("familyTask.calendar.edit", "Edit Event")}
          </h1>
          {error && <p className="text-sm text-destructive">{t(error, "Failed to save event.")}</p>}

          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.chores.form.title", "Title")}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.chores.form.description", "Description")}</span>
              <textarea
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.calendar.startsAt", "Starts At")}</span>
              <input
                type="datetime-local"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.calendar.endsAt", "Ends At")}</span>
              <input
                type="datetime-local"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
              <span>{t("familyTask.calendar.allDay", "All day")}</span>
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.chores.assignee", "Assignee")}</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={assigneeProfileUuid}
                onChange={(event) => setAssigneeProfileUuid(event.target.value)}
              >
                <option value="">{t("familyTask.common.noAssigned", "Everyone")}</option>
                {profiles.map((profile) => (
                  <option key={profile.profileUuid} value={profile.profileUuid}>
                    {profile.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.calendar.recurrenceRule", "Recurrence Rule")}</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={recurrenceRuleUuid}
                onChange={(event) => setRecurrenceRuleUuid(event.target.value)}
              >
                <option value="">{t("familyTask.calendar.noRecurrence", "No recurrence")}</option>
                {rules.map((rule) => (
                  <option key={rule.uuid} value={rule.uuid}>
                    {`${rule.frequency} (${rule.intervalValue})`}
                  </option>
                ))}
              </select>
            </label>

            {!isNew && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
                <span>{t("familyTask.chores.active", "Active")}</span>
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              disabled={saving || !title.trim() || !startsAt}
              onClick={() => void handleSave()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </button>
            <button
              onClick={() => navigate("/family-tasks/calendar")}
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
