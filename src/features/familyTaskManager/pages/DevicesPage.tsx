import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { devicesApi, displaySettingsApi } from "../api/devicesApi";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { DeviceDto, DisplaySettingsDto, PatchDisplaySettingsRequest } from "../models/dto";

export function DevicesPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("devices");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [settings, setSettings] = useState<DisplaySettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [deviceData, settingsData] = await Promise.all([devicesApi.getAll(), displaySettingsApi.get()]);
      setDevices(deviceData);
      setSettings(settingsData);
    } catch {
      setError("familyTask.errors.devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSettings = async (payload: PatchDisplaySettingsRequest) => {
    if (!isParent || !settings) {
      return;
    }

    const updated = await displaySettingsApi.update(payload);
    setSettings(updated);
  };

  const handleDelete = async (deviceUuid: string) => {
    if (!isParent) {
      return;
    }

    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    await devicesApi.remove(deviceUuid);
    await load();
  };

  return (
    <FamilyTaskPageShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">{t("familyTask.devices.title", "Devices & Display")}</h1>
          {isParent && (
            <Link
              to="/family-tasks/devices/new"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              {t("common.new", "+ New")}
            </Link>
          )}
        </div>

        {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {t(error, "Failed to load devices.")}
          </div>
        )}

        {settings && (
          <section>
            <h2 className="text-lg font-medium mb-3">{t("familyTask.devices.displaySettings", "Display Settings")}</h2>
            <div className="space-y-3 max-w-md">
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={settings.showCompletedTasks}
                  disabled={!isParent}
                  onChange={() => void updateSettings({ showCompletedTasks: !settings.showCompletedTasks })}
                />
                <span>{t("familyTask.devices.showCompletedTasks", "Show completed tasks")}</span>
              </label>

              <label className="text-sm space-y-1 block">
                <span>{t("familyTask.devices.calendarStartOfWeek", "Calendar start of week")}</span>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.calendarStartOfWeek}
                  disabled={!isParent}
                  onChange={(event) => void updateSettings({ calendarStartOfWeek: event.target.value })}
                >
                  <option value="MONDAY">MONDAY</option>
                  <option value="SUNDAY">SUNDAY</option>
                </select>
              </label>

              <label className="text-sm space-y-1 block">
                <span>{t("familyTask.devices.theme", "Theme")}</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={settings.theme}
                  disabled={!isParent}
                  onChange={(event) => void updateSettings({ theme: event.target.value })}
                />
              </label>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium mb-3">{t("familyTask.devices.linkedDevices", "Linked Devices")}</h2>
          {!loading && !error && devices.length === 0 && (
            <p className="text-muted-foreground">{t("familyTask.devices.empty", "No devices linked yet.")}</p>
          )}

          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.uuid}
                className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-sm">{device.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {device.deviceType} ·{" "}
                    {device.readOnlyMode
                      ? t("familyTask.devices.readOnly", "Read-only")
                      : t("familyTask.devices.interactive", "Interactive")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isParent && (
                    <Link
                      to={`/family-tasks/devices/${device.uuid}`}
                      className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                    >
                      {t("common.edit", "Edit")}
                    </Link>
                  )}
                  {isParent && (
                    <button
                      onClick={() => void handleDelete(device.uuid)}
                      className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FamilyTaskPageShell>
  );
}
