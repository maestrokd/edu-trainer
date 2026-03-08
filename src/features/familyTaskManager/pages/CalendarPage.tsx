import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "../api/eventsApi";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import { useFamilyContext } from "../hooks/useFamilyContext";
import type { FamilyEventDto } from "../models/dto";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("calendar");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profiles } = useFamilyContext();

  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return toIsoDate(date);
  });
  const [toDate, setToDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0);
    return toIsoDate(date);
  });
  const [assigneeProfileUuid, setAssigneeProfileUuid] = useState("");

  const [events, setEvents] = useState<FamilyEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      from: `${fromDate}T00:00:00.000Z`,
      to: `${toDate}T23:59:59.999Z`,
      assigneeProfileUuid: assigneeProfileUuid || undefined,
    }),
    [assigneeProfileUuid, fromDate, toDate]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await eventsApi.getAll(filters);
      setEvents(data.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
    } catch {
      setError("familyTask.errors.events");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (eventUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    await eventsApi.remove(eventUuid);
    await load();
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{t("familyTask.calendar.title", "Calendar")}</h1>
          {isParent && (
            <Link
              to="/family-tasks/calendar/events/new"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              {t("common.new", "+ New")}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm space-y-1">
            <span>{t("familyTask.calendar.from", "From")}</span>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className="text-sm space-y-1">
            <span>{t("familyTask.calendar.to", "To")}</span>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
          <label className="text-sm space-y-1">
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
        </div>

        <button className="text-sm border px-4 py-2 rounded-md hover:bg-accent transition" onClick={() => void load()}>
          {t("common.retry", "Refresh")}
        </button>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
        {error && <p className="text-sm text-destructive">{t(error, "Failed to load events.")}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-muted-foreground">{t("familyTask.calendar.empty", "No events in selected range.")}</p>
        )}

        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.uuid}
              className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {event.allDay
                    ? t("familyTask.calendar.allDay", "All day")
                    : `${new Date(event.startsAt).toLocaleString()} - ${event.endsAt ? new Date(event.endsAt).toLocaleString() : ""}`}
                </p>
              </div>
              {isParent && (
                <div className="flex gap-2">
                  <Link
                    to={`/family-tasks/calendar/events/${event.uuid}`}
                    className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                  >
                    {t("common.edit", "Edit")}
                  </Link>
                  <button
                    onClick={() => void handleDelete(event.uuid)}
                    className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                  >
                    {t("common.delete", "Delete")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </FamilyTaskPageShell>
  );
}
