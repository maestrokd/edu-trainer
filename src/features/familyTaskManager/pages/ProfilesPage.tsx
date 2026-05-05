import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useInsetHeader } from "@/contexts/InsetHeaderContext";
import { cn } from "@/lib/utils";
import { TenantMembershipRole } from "@/services/AuthService.ts";
import TenantProfilesService, { TenantProfileType, type TenantProfileListItem } from "@/services/TenantProfilesService";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { NotoEmoji } from "../components/shared/NotoEmoji";
import { TaskEmojiField } from "../components/tasks/TaskEmojiField";
import { canManageFamilyTask } from "../domain/access";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";

type ProfileStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function mapStatusFilterToActive(statusFilter: ProfileStatusFilter): boolean | undefined {
  if (statusFilter === "ALL") {
    return undefined;
  }

  return statusFilter === "ACTIVE";
}

function resolveLinkedUserProfileUuid(profile: TenantProfileListItem): string | null {
  return profile.linkedUserProfileUuid;
}

export function ProfilesPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("profiles");
  const { handleError } = useApiErrorHandler();
  const { principal } = useAuth();
  const tenantUuid = principal?.activeTenantUuid ?? null;
  const isTenantOwner = principal?.activeTenantRole === TenantMembershipRole.OWNER;

  const [profiles, setProfiles] = useState<TenantProfileListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProfileStatusFilter>("ALL");
  const [draftStatusFilter, setDraftStatusFilter] = useState<ProfileStatusFilter>("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchString, setSearchString] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantUuid || !isTenantOwner) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await TenantProfilesService.listTenantProfiles(tenantUuid, {
        profileType: TenantProfileType.CHILD,
        active: mapStatusFilterToActive(statusFilter),
        searchString: searchString || undefined,
      });
      setProfiles(response.items);
    } catch (reason: unknown) {
      handleError(reason, {
        fallbackKey: "familyTask.errors.profiles",
        fallbackMessage: "Failed to load profiles.",
        setError,
      });
    } finally {
      setLoading(false);
    }
  }, [handleError, isTenantOwner, searchString, statusFilter, tenantUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchString(searchDraft.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchDraft]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    setDraftStatusFilter(statusFilter);
  }, [filtersOpen, statusFilter]);

  const handleToggleActive = async (profile: TenantProfileListItem) => {
    if (!tenantUuid) {
      return;
    }

    const linkedUserProfileUuid = resolveLinkedUserProfileUuid(profile);
    if (!linkedUserProfileUuid) {
      return;
    }

    const nextActive = !profile.active;
    const confirmationMessage = nextActive
      ? t("familyTask.profiles.confirmActivate", "Activate this profile?")
      : t("familyTask.profiles.confirmDeactivate", "Deactivate this profile?");

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setError(null);

    try {
      await TenantProfilesService.patchTenantProfile(tenantUuid, linkedUserProfileUuid, { active: nextActive });
      await load();
    } catch (reason: unknown) {
      handleError(reason, {
        fallbackKey: "familyTask.errors.profileSave",
        fallbackMessage: "Failed to save profile.",
        setError,
      });
    }
  };

  const hasActiveFilters = statusFilter !== "ALL";
  const activeFiltersCount = hasActiveFilters ? 1 : 0;

  const clearFilters = () => {
    setStatusFilter("ALL");
    setDraftStatusFilter("ALL");
  };

  const applyFilterDraft = () => {
    setStatusFilter(draftStatusFilter);
    setFiltersOpen(false);
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
          {t("familyTask.profiles.title", "Child Profiles")}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden w-[260px] items-center lg:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t("common.search", "Search")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <label className="relative hidden w-[220px] items-center sm:flex lg:hidden">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t("common.search", "Search")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          {isTenantOwner ? (
            <>
              <div className="hidden items-center gap-2 lg:flex">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProfileStatusFilter)}>
                  <SelectTrigger className="h-9 w-40 rounded-full bg-background text-sm">
                    <SelectValue placeholder={t("familyTask.profiles.statusFilter", "Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("pages.tenantProfiles.activeValues.true", "Active")}</SelectItem>
                    <SelectItem value="INACTIVE">{t("pages.tenantProfiles.activeValues.false", "Inactive")}</SelectItem>
                  </SelectContent>
                </Select>

                <Link
                  to="/settings/profiles"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                >
                  <Settings2 className="size-4" />
                  <span>{t("familyTask.profiles.manageProfiles", "Manage Profiles")}</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-label={t("common.filters", "Filters")}
                title={t("common.filters", "Filters")}
                className={cn(
                  "relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent lg:hidden",
                  hasActiveFilters && "border-primary/40 bg-primary/10 text-primary"
                )}
              >
                <Filter className="size-4" />
                {activeFiltersCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </button>

              <Link
                to="/settings/profiles"
                aria-label={t("familyTask.profiles.manageProfiles", "Manage Profiles")}
                title={t("familyTask.profiles.manageProfiles", "Manage Profiles")}
                className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent lg:hidden"
              >
                <Settings2 className="size-4" />
              </Link>
            </>
          ) : null}
        </div>
      </div>
    ),
    [activeFiltersCount, hasActiveFilters, isTenantOwner, searchDraft, statusFilter, t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="profiles">
        <div className="space-y-4">
          <div className="sm:hidden">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t("common.search", "Search")}
                className="h-10 rounded-full border-border bg-card/80 pl-9 pr-3 text-sm shadow-sm"
              />
            </label>
          </div>

          {!tenantUuid && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(
                  "pages.tenantProfiles.errors.noActiveTenant",
                  "No active tenant found. Switch tenant and try again."
                )}
              </AlertDescription>
            </Alert>
          )}

          {tenantUuid && !isTenantOwner && (
            <Alert variant="destructive">
              <AlertDescription>
                {t("familyTask.profiles.ownerOnly", "Only tenant owner can manage child profiles.")}
              </AlertDescription>
            </Alert>
          )}

          {tenantUuid && isTenantOwner && hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground lg:hidden">
              <span className="font-medium">{t("common.filters", "Filters")}:</span>
              <span className="rounded-full bg-background px-2 py-0.5">
                {statusFilter === "ACTIVE"
                  ? t("pages.tenantProfiles.activeValues.true", "Active")
                  : t("pages.tenantProfiles.activeValues.false", "Inactive")}
              </span>
              <button type="button" onClick={clearFilters} className="font-semibold underline">
                {t("common.clear", "Clear")}
              </button>
            </div>
          )}

          {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex justify-between items-center gap-3">
              <span>{t(error, "Failed to load profiles.")}</span>
              <button className="underline" onClick={() => void load()}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}
          {!loading && !error && tenantUuid && isTenantOwner && profiles.length === 0 && (
            <p className="text-muted-foreground">{t("familyTask.profiles.noProfiles", "No child profiles yet.")}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((profile) => {
              const linkedUserProfileUuid = resolveLinkedUserProfileUuid(profile);

              return (
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
                      <p className="font-medium truncate">
                        {profile.displayName || t("familyTask.profiles.unknown", "Unknown")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{profile.username || "-"}</p>
                      <span
                        className={cn(
                          "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          profile.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
                        )}
                      >
                        {profile.active
                          ? t("pages.tenantProfiles.activeValues.true", "Active")
                          : t("pages.tenantProfiles.activeValues.false", "Inactive")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={linkedUserProfileUuid ? `/family-tasks/profiles/${linkedUserProfileUuid}` : "#"}
                      onClick={(event) => {
                        if (!linkedUserProfileUuid) {
                          event.preventDefault();
                        }
                      }}
                      className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition"
                    >
                      {t("common.edit", "Edit")}
                    </Link>
                    {isTenantOwner ? (
                      <button
                        disabled={!linkedUserProfileUuid}
                        onClick={() => void handleToggleActive(profile)}
                        className="text-xs border px-3 py-1 rounded-md hover:bg-accent transition disabled:opacity-50"
                      >
                        {profile.active
                          ? t("familyTask.profiles.deactivate", "Deactivate")
                          : t("familyTask.profiles.activate", "Activate")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogContent className="w-[min(92vw,420px)] rounded-2xl border border-border/80 p-5 sm:p-6">
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("familyTask.profiles.filterHint", "Filter profiles by status.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("familyTask.profiles.statusFilter", "Status")}</Label>
                  <Select
                    value={draftStatusFilter}
                    onValueChange={(value) => setDraftStatusFilter(value as ProfileStatusFilter)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                      <SelectItem value="ACTIVE">{t("pages.tenantProfiles.activeValues.true", "Active")}</SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("pages.tenantProfiles.activeValues.false", "Inactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setFiltersOpen(false);
                    }}
                    className="inline-flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                  >
                    {t("common.clear", "Clear")}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="inline-flex h-9 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                    >
                      {t("common.cancel", "Cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={applyFilterDraft}
                      className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {t("common.apply", "Apply")}
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}

export function ProfileDetailsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("profile_details");
  const { handleError } = useApiErrorHandler();

  const { principal } = useAuth();
  const canManage = canManageFamilyTask(principal);
  const tenantUuid = principal?.activeTenantUuid ?? null;
  const isTenantOwner = principal?.activeTenantRole === TenantMembershipRole.OWNER;

  const { profileUuid } = useParams<{ profileUuid: string }>();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [color, setColor] = useState("#64748b");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileUuid || profileUuid === "new") {
      navigate("/settings/profiles/create", { replace: true });
      return;
    }

    if (!canManage || !tenantUuid || !isTenantOwner) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    TenantProfilesService.getTenantProfile(tenantUuid, profileUuid)
      .then((profile) => {
        setUsername(profile.username ?? "");
        setDisplayName(profile.displayName?.trim() || profile.firstName?.trim() || profile.username || "");
        setAvatarEmoji(profile.avatarEmoji ?? "");
        setColor(profile.color ?? "#64748b");
        setActive(profile.active);
      })
      .catch((reason: unknown) =>
        handleError(reason, {
          fallbackKey: "familyTask.errors.profileLoad",
          fallbackMessage: "Failed to load profile.",
          setError,
        })
      )
      .finally(() => setLoading(false));
  }, [canManage, handleError, isTenantOwner, navigate, profileUuid, tenantUuid]);

  const handleSave = async () => {
    if (!profileUuid || !tenantUuid || !displayName.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await TenantProfilesService.patchTenantProfile(tenantUuid, profileUuid, {
        displayName: displayName.trim(),
        avatarEmoji: avatarEmoji || undefined,
        color,
        active,
      });

      navigate("/family-tasks/profiles");
    } catch (reason: unknown) {
      handleError(reason, {
        fallbackKey: "familyTask.errors.profileSave",
        fallbackMessage: "Failed to save profile.",
        setError,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!tenantUuid) {
    return (
      <FamilyTaskPageShell>
        <Alert variant="destructive">
          <AlertDescription>
            {t("pages.tenantProfiles.errors.noActiveTenant", "No active tenant found. Switch tenant and try again.")}
          </AlertDescription>
        </Alert>
      </FamilyTaskPageShell>
    );
  }

  if (!isTenantOwner) {
    return (
      <FamilyTaskPageShell>
        <Alert variant="destructive">
          <AlertDescription>
            {t("familyTask.profiles.ownerOnly", "Only tenant owner can manage child profiles.")}
          </AlertDescription>
        </Alert>
      </FamilyTaskPageShell>
    );
  }

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
          <h1 className="text-2xl font-semibold">{t("familyTask.profiles.edit", "Edit Profile")}</h1>
          {error && <p className="text-sm text-destructive">{t(error, "Failed to save profile.")}</p>}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t("pages.profileForm.username", "Username")}</Label>
              <p className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                {username || "-"}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {t(
                "familyTask.profiles.commonProfileHint",
                "Use Settings > Profiles to edit username, password, first name, last name, and locale."
              )}
            </p>

            <label className="text-sm space-y-1 block">
              <span>{t("familyTask.profiles.field.displayName", "Display Name")}</span>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>

            <TaskEmojiField
              label={t("familyTask.profiles.field.emoji", "Emoji")}
              value={avatarEmoji}
              onChange={setAvatarEmoji}
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

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">{t("familyTask.chores.active", "Active")}</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button disabled={saving || !displayName.trim()} onClick={() => void handleSave()}>
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/family-tasks/profiles")}>
              {t("common.cancel", "Cancel")}
            </Button>
          </div>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
