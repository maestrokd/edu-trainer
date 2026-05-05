import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Filter, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useInsetHeader } from "@/contexts/InsetHeaderContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { cn } from "@/lib/utils.ts";
import {
  type TenantMembershipRole,
  TenantMembershipRole as TenantMembershipRoleValues,
} from "@/services/AuthService.ts";
import TenantProfilesService, {
  type TenantMembershipStatus,
  TenantMembershipStatus as TenantMembershipStatusValues,
  type TenantProfileType,
  type TenantProfilesResponse,
  TenantProfileType as TenantProfileTypeValues,
} from "@/services/TenantProfilesService.ts";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";
import { notifier } from "@/services/NotificationService.ts";

const ALL_FILTER = "ALL";

const roleOptions = Object.values(TenantMembershipRoleValues);
const profileTypeOptions = Object.values(TenantProfileTypeValues);
const membershipStatusOptions = Object.values(TenantMembershipStatusValues);

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const TenantProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const { getErrorMessage } = useApiErrorHandler();
  const { principal } = useAuth();

  const tenantUuid = principal?.activeTenantUuid ?? null;
  const tenantName = principal?.activeTenantName ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [profileType, setProfileType] = useState<string>(ALL_FILTER);
  const [role, setRole] = useState<string>(ALL_FILTER);
  const [membershipStatus, setMembershipStatus] = useState<string>(ALL_FILTER);
  const [active, setActive] = useState<string>(ALL_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftProfileType, setDraftProfileType] = useState<string>(ALL_FILTER);
  const [draftRole, setDraftRole] = useState<string>(ALL_FILTER);
  const [draftMembershipStatus, setDraftMembershipStatus] = useState<string>(ALL_FILTER);
  const [draftActive, setDraftActive] = useState<string>(ALL_FILTER);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    setDraftProfileType(profileType);
    setDraftRole(role);
    setDraftMembershipStatus(membershipStatus);
    setDraftActive(active);
  }, [active, filtersOpen, membershipStatus, profileType, role]);

  const { data, isLoading, isFetching, isError, error } = useQuery<TenantProfilesResponse>({
    queryKey: ["tenantProfiles", tenantUuid, profileType, role, membershipStatus, active, debouncedSearch],
    enabled: Boolean(tenantUuid),
    queryFn: async () =>
      await TenantProfilesService.listTenantProfiles(tenantUuid!, {
        profileType: profileType === ALL_FILTER ? undefined : (profileType as TenantProfileType),
        role: role === ALL_FILTER ? undefined : (role as TenantMembershipRole),
        membershipStatus: membershipStatus === ALL_FILTER ? undefined : (membershipStatus as TenantMembershipStatus),
        active: active === ALL_FILTER ? undefined : active === "true",
        searchString: debouncedSearch || undefined,
      }),
  });

  const items = data?.items ?? [];

  const errorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, {
      fallbackKey: "pages.tenantProfiles.loadError",
      fallbackMessage: "Failed to load tenant profiles.",
    });
  }, [error, getErrorMessage, isError]);

  useEffect(() => {
    if (errorMessage) {
      notifier.error(errorMessage);
    }
  }, [errorMessage]);

  const hasActiveFilters = [profileType, role, membershipStatus, active].some((value) => value !== ALL_FILTER);
  const activeFiltersCount =
    Number(profileType !== ALL_FILTER) +
    Number(role !== ALL_FILTER) +
    Number(membershipStatus !== ALL_FILTER) +
    Number(active !== ALL_FILTER);

  const clearFilters = () => {
    setProfileType(ALL_FILTER);
    setRole(ALL_FILTER);
    setMembershipStatus(ALL_FILTER);
    setActive(ALL_FILTER);
    setDraftProfileType(ALL_FILTER);
    setDraftRole(ALL_FILTER);
    setDraftMembershipStatus(ALL_FILTER);
    setDraftActive(ALL_FILTER);
  };

  const applyDraftFilters = () => {
    setProfileType(draftProfileType);
    setRole(draftRole);
    setMembershipStatus(draftMembershipStatus);
    setActive(draftActive);
    setFiltersOpen(false);
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
            {t("pages.tenantProfiles.title", "Tenant profiles")}
          </h1>
          {(isLoading || isFetching) && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden w-[260px] items-center xl:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("pages.tenantProfiles.filters.searchPlaceholder", "Name, username or email")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <label className="relative hidden w-[220px] items-center sm:flex xl:hidden">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("pages.tenantProfiles.filters.searchPlaceholder", "Name, username or email")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <div className="hidden items-center gap-2 xl:flex">
            <Select value={profileType} onValueChange={setProfileType}>
              <SelectTrigger className="h-9 w-36 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantProfiles.filters.profileType", "Profile type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                {profileTypeOptions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`pages.tenantProfiles.profileType.${entry}`, { defaultValue: entry })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-32 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantProfiles.filters.role", "Role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                {roleOptions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`pages.tenantProfiles.role.${entry}`, { defaultValue: entry })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={membershipStatus} onValueChange={setMembershipStatus}>
              <SelectTrigger className="h-9 w-36 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantProfiles.filters.membershipStatus", "Membership status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                {membershipStatusOptions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`pages.tenantProfiles.membershipStatus.${entry}`, { defaultValue: entry })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={active} onValueChange={setActive}>
              <SelectTrigger className="h-9 w-32 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantProfiles.filters.active", "Active")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                <SelectItem value="true">{t("pages.tenantProfiles.activeValues.true", "Active")}</SelectItem>
                <SelectItem value="false">{t("pages.tenantProfiles.activeValues.false", "Inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={t("common.filters", "Filters")}
            title={t("common.filters", "Filters")}
            className={cn(
              "relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent xl:hidden",
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
        </div>
      </div>
    ),
    [
      active,
      activeFiltersCount,
      hasActiveFilters,
      isFetching,
      isLoading,
      membershipStatus,
      profileType,
      role,
      searchInput,
      t,
    ]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

  if (!tenantUuid) {
    return (
      <div className="bg-background p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {t("pages.tenantProfiles.errors.noActiveTenant", "No active tenant found. Switch tenant and try again.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 space-y-4">
      <div className="sm:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("pages.tenantProfiles.filters.searchPlaceholder", "Name, username or email")}
            className="h-10 rounded-full border-border bg-card/80 pl-9 pr-3 text-sm shadow-sm"
          />
        </label>
      </div>

      {tenantName && (
        <Alert>
          <AlertDescription>
            {t("pages.tenantProfiles.activeTenant", {
              defaultValue: "Active tenant: {{tenantName}}",
              tenantName,
            })}
          </AlertDescription>
        </Alert>
      )}

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground xl:hidden">
          <span className="font-medium">{t("common.filters", "Filters")}:</span>
          {profileType !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">{profileType}</span>
          ) : null}
          {role !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">
              {t(`pages.tenantProfiles.role.${role}`, { defaultValue: role })}
            </span>
          ) : null}
          {membershipStatus !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">
              {t(`pages.tenantProfiles.membershipStatus.${membershipStatus}`, { defaultValue: membershipStatus })}
            </span>
          ) : null}
          {active !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">
              {active === "true"
                ? t("pages.tenantProfiles.activeValues.true", "Active")
                : t("pages.tenantProfiles.activeValues.false", "Inactive")}
            </span>
          ) : null}
          <button type="button" onClick={clearFilters} className="font-semibold underline">
            {t("common.clear", "Clear")}
          </button>
        </div>
      ) : null}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.tenantProfiles.columns.displayName", "Name")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.profileType", "Type")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.email", "Email")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.username", "Username")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.role", "Role")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.membershipStatus", "Membership")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.active", "Active")}</TableHead>
              <TableHead>{t("pages.tenantProfiles.columns.createdAt", "Created at")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || (isFetching && items.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("common.loading", "Loading...")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  {t("pages.tenantProfiles.empty", "No tenant profiles found.")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.profileUuid}>
                  <TableCell className="font-medium">{item.displayName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`pages.tenantProfiles.profileType.${item.profileType}`, { defaultValue: item.profileType })}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.email ?? "-"}</TableCell>
                  <TableCell>{item.username ?? "-"}</TableCell>
                  <TableCell>
                    {item.role ? t(`pages.tenantProfiles.role.${item.role}`, { defaultValue: item.role }) : "-"}
                  </TableCell>
                  <TableCell>
                    {item.membershipStatus
                      ? t(`pages.tenantProfiles.membershipStatus.${item.membershipStatus}`, {
                          defaultValue: item.membershipStatus,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? "default" : "outline"}>
                      {item.active
                        ? t("pages.tenantProfiles.activeValues.true", "Active")
                        : t("pages.tenantProfiles.activeValues.false", "Inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-[min(94vw,520px)] rounded-2xl border border-border/80 p-5 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.tenantProfiles.filters.hint", "Filter profiles by type, role, membership and activity.")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pages.tenantProfiles.filters.profileType", "Profile type")}</Label>
                <Select value={draftProfileType} onValueChange={setDraftProfileType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                    {profileTypeOptions.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(`pages.tenantProfiles.profileType.${entry}`, { defaultValue: entry })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.tenantProfiles.filters.role", "Role")}</Label>
                <Select value={draftRole} onValueChange={setDraftRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                    {roleOptions.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(`pages.tenantProfiles.role.${entry}`, { defaultValue: entry })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.tenantProfiles.filters.membershipStatus", "Membership status")}</Label>
                <Select value={draftMembershipStatus} onValueChange={setDraftMembershipStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                    {membershipStatusOptions.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(`pages.tenantProfiles.membershipStatus.${entry}`, { defaultValue: entry })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.tenantProfiles.filters.active", "Active")}</Label>
                <Select value={draftActive} onValueChange={setDraftActive}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
                    <SelectItem value="true">{t("pages.tenantProfiles.activeValues.true", "Active")}</SelectItem>
                    <SelectItem value="false">{t("pages.tenantProfiles.activeValues.false", "Inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  onClick={applyDraftFilters}
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
  );
};

export default TenantProfilesPage;
