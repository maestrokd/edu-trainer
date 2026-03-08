import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { childProfilesApi } from "../api/childProfilesApi";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { TaskEmojiField } from "../components/tasks/TaskEmojiField";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";
import type { ChildProfileDto, CreateChildProfileRequest, PatchChildProfileRequest } from "../models/dto";

export function ProfilesPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("profiles");

  const [profiles, setProfiles] = useState<ChildProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await childProfilesApi.getAll();
      setProfiles(data);
    } catch {
      setError("familyTask.errors.profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (profileUuid: string) => {
    if (!window.confirm(t("common.confirmDelete", "Are you sure?"))) {
      return;
    }

    await childProfilesApi.remove(profileUuid);
    await load();
  };

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="profiles">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{t("familyTask.profiles.title", "Child Profiles")}</h1>
            <Link
              to="/family-tasks/profiles/new"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              {t("common.new", "+ New")}
            </Link>
          </div>

          {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
              <span>{t(error, "Failed to load profiles.")}</span>
              <button className="underline" onClick={() => void load()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}
          {!loading && !error && profiles.length === 0 && (
            <p className="text-muted-foreground">{t("familyTask.profiles.noProfiles", "No child profiles yet.")}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((profile) => (
              <div
                key={profile.profileUuid}
                className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                style={{ borderLeft: `4px solid ${profile.color ?? "#64748b"}` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex size-9 items-center justify-center">
                    <NotoEmoji emoji={profile.avatarEmoji ?? ""} size={30} fallback="👤" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.username}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/family-tasks/profiles/${profile.profileUuid}`}
                    className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                  >
                    {t("common.edit", "Edit")}
                  </Link>
                  <button
                    onClick={() => void handleDelete(profile.profileUuid)}
                    className="text-xs border border-destructive text-destructive px-3 py-1 rounded-md hover:bg-destructive/10 transition"
                  >
                    {t("common.delete", "Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}

export function ProfileDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("profile_details");

  const { principal } = useAuth();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  const { profileUuid } = useParams<{ profileUuid: string }>();
  const navigate = useNavigate();
  const isNew = !profileUuid || profileUuid === "new";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [color, setColor] = useState("#64748b");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isParent || isNew || !profileUuid) {
      return;
    }

    setLoading(true);
    setError(null);

    childProfilesApi
      .getById(profileUuid)
      .then((profile) => {
        setUsername(profile.username);
        setFirstName(profile.firstName ?? "");
        setLastName(profile.lastName ?? "");
        setLocale(profile.locale || "en-US");
        setDisplayName(profile.displayName);
        setAvatarEmoji(profile.avatarEmoji ?? "");
        setColor(profile.color ?? "#64748b");
        setActive(profile.active);
      })
      .catch(() => setError("familyTask.errors.profileLoad"))
      .finally(() => setLoading(false));
  }, [isNew, profileUuid, isParent]);

  const handleSave = async () => {
    if (!displayName.trim() || (isNew && (!username.trim() || !password.trim()))) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const request: CreateChildProfileRequest = {
          username: username.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          locale,
          displayName: displayName.trim(),
          avatarEmoji: avatarEmoji || undefined,
          color,
        };

        await childProfilesApi.create(request);
      } else {
        const request: PatchChildProfileRequest = {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          password: password || undefined,
          locale,
          displayName: displayName.trim(),
          avatarEmoji: avatarEmoji || undefined,
          color,
          active,
        };

        await childProfilesApi.update(profileUuid as string, request);
      }

      navigate("/family-tasks/profiles");
    } catch {
      setError("familyTask.errors.profileSave");
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
      <ParentFeatureGate featureId="profile_details">
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold">
            {isNew
              ? t("familyTask.profiles.create", "Add Child Profile")
              : t("familyTask.profiles.edit", "Edit Profile")}
          </h1>
          {error && <p className="text-sm text-destructive">{t(error, "Failed to save profile.")}</p>}

          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <span>{t("pages.profileForm.username", "Username")}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={username}
                disabled={!isNew}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="text-sm space-y-1 block">
              <span>
                {isNew
                  ? t("pages.profileForm.password", "Password")
                  : t("pages.profileForm.newPassword", "New Password (Optional)")}
              </span>
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm space-y-1 block">
                <span>{t("pages.profileForm.firstName", "First Name")}</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label className="text-sm space-y-1 block">
                <span>{t("pages.profileForm.lastName", "Last Name")}</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>

            <label className="text-sm space-y-1 block">
              <span>{t("pages.profileForm.locale", "Locale")}</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
              >
                <option value="en-US">en-US</option>
                <option value="uk-UA">uk-UA</option>
                <option value="ru-RU">ru-RU</option>
              </select>
            </label>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.profiles.field.displayName", "Display Name")}</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <TaskEmojiField
              label={t("familyTask.profiles.field.emoji", "Emoji")}
              value={avatarEmoji}
              onChange={setAvatarEmoji}
              placeholder={t("familyTask.tasks.emojiPlaceholder", "Type or select emoji")}
            />

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.profiles.field.color", "Color")}</span>
              <input
                type="color"
                className="h-10 w-full rounded-md border bg-background cursor-pointer"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
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
              disabled={saving || !displayName.trim() || (isNew && (!username.trim() || !password.trim()))}
              onClick={() => void handleSave()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </button>
            <button
              onClick={() => navigate("/family-tasks/profiles")}
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
