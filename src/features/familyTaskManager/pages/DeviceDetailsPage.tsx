import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { deviceLinksApi, devicesApi } from "../api/devicesApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useFamilyContext } from "../hooks/useFamilyContext";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { CreateDeviceRequest, PatchDeviceRequest } from "../models/dto";

export function DeviceDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("device_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;
  const { members } = useFamilyContext();

  const { deviceUuid } = useParams<{ deviceUuid: string }>();
  const navigate = useNavigate();
  const isNew = !deviceUuid || deviceUuid === "new";

  const [name, setName] = useState("");
  const [deviceType, setDeviceType] = useState("TABLET");
  const [readOnlyMode, setReadOnlyMode] = useState(true);
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkMemberUuid, setLinkMemberUuid] = useState("");

  useEffect(() => {
    if (!isParent || isNew || !deviceUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    devicesApi
      .getById(deviceUuid)
      .then((device) => {
        setName(device.name);
        setDeviceType(device.deviceType);
        setReadOnlyMode(device.readOnlyMode);
        setActive(device.active);
      })
      .catch(() => setError("familyTask.errors.deviceLoad"))
      .finally(() => setLoading(false));
  }, [deviceUuid, isNew, isParent]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const request: CreateDeviceRequest = {
          name: name.trim(),
          deviceType,
          readOnlyMode,
        };

        await devicesApi.create(request);
      } else {
        const request: PatchDeviceRequest = {
          name: name.trim(),
          deviceType,
          readOnlyMode,
          active,
        };

        await devicesApi.update(deviceUuid as string, request);
      }

      navigate("/family-tasks/devices");
    } catch {
      setError("familyTask.errors.deviceSave");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkMember = async () => {
    if (isNew || !deviceUuid || !linkMemberUuid) {
      return;
    }

    setLinking(true);
    setError(null);

    try {
      await deviceLinksApi.create({ deviceUuid, memberUuid: linkMemberUuid });
      setLinkMemberUuid("");
    } catch {
      setError("familyTask.errors.deviceLinkSave");
    } finally {
      setLinking(false);
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
      <ParentFeatureGate featureId="device_details">
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold">
            {isNew ? t("familyTask.devices.create", "Create Device") : t("familyTask.devices.edit", "Edit Device")}
          </h1>
          {error && <p className="text-sm text-destructive">{t(error, "Failed to save device.")}</p>}

          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.devices.name", "Name")}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.devices.type", "Device type")}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={deviceType}
                onChange={(event) => setDeviceType(event.target.value)}
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={readOnlyMode}
                onChange={(event) => setReadOnlyMode(event.target.checked)}
              />
              <span>{t("familyTask.devices.readOnly", "Read-only")}</span>
            </label>

            {!isNew && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
                <span>{t("familyTask.chores.active", "Active")}</span>
              </label>
            )}

            {!isNew && (
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("familyTask.devices.linkMember", "Link member")}</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                    value={linkMemberUuid}
                    onChange={(event) => setLinkMemberUuid(event.target.value)}
                  >
                    <option value="">{t("familyTask.devices.selectMember", "Select member")}</option>
                    {members
                      .filter((member) => member.active)
                      .map((member) => (
                        <option key={member.memberUuid} value={member.memberUuid}>
                          {member.displayName}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="border px-4 py-2 rounded-md text-sm hover:bg-accent transition disabled:opacity-50"
                    disabled={!linkMemberUuid || linking}
                    onClick={() => void handleLinkMember()}
                  >
                    {linking ? t("common.saving", "Saving...") : t("common.add", "Add")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              disabled={saving || !name.trim()}
              onClick={() => void handleSave()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </button>
            <button
              onClick={() => navigate("/family-tasks/devices")}
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
