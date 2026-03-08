import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { displaySettingsApi } from "../api/devicesApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { DisplaySettingsDto } from "../models/dto";

export function FamilyTaskSettingsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("settings");

  const [settings, setSettings] = useState<DisplaySettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    displaySettingsApi
      .get()
      .then((data) => setSettings(data))
      .catch(() => setError("familyTask.errors.displaySettings"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="settings">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{t("familyTask.sidebar.settings", "Settings")}</h1>

          {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
          {error && <p className="text-sm text-destructive">{t(error, "Failed to load settings.")}</p>}

          {settings && (
            <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
              <p>
                {t("familyTask.devices.showCompletedTasks", "Show completed tasks")}:{" "}
                {String(settings.showCompletedTasks)}
              </p>
              <p>
                {t("familyTask.devices.calendarStartOfWeek", "Calendar start of week")}: {settings.calendarStartOfWeek}
              </p>
              <p>
                {t("familyTask.devices.theme", "Theme")}: {settings.theme}
              </p>
            </div>
          )}

          <Link to="/family-tasks/devices" className="text-sm text-primary hover:underline">
            {t("familyTask.devices.displaySettings", "Manage display settings")}
          </Link>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
