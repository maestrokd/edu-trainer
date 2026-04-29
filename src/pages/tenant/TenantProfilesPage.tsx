import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
  type TenantMembershipRole,
  TenantMembershipRole as TenantMembershipRoleValues,
} from "@/services/AuthService.ts";
import { extractErrorCode } from "@/services/ApiService.ts";
import TenantProfilesService, {
  type TenantMembershipStatus,
  TenantMembershipStatus as TenantMembershipStatusValues,
  type TenantProfileType,
  type TenantProfilesResponse,
  TenantProfileType as TenantProfileTypeValues,
} from "@/services/TenantProfilesService.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

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
  const { principal } = useAuth();

  const tenantUuid = principal?.activeTenantUuid ?? null;
  const tenantName = principal?.activeTenantName ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [profileType, setProfileType] = useState<string>(ALL_FILTER);
  const [role, setRole] = useState<string>(ALL_FILTER);
  const [membershipStatus, setMembershipStatus] = useState<string>(ALL_FILTER);
  const [active, setActive] = useState<string>(ALL_FILTER);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
    const errorCode = extractErrorCode(error);
    const messageKey = errorCode ? `errors.codes.${errorCode}` : "errors.codes.UNKNOWN";
    return t(messageKey, {
      defaultValue: t("errors.codes.UNKNOWN"),
    });
  }, [error, isError, t]);

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("pages.tenantProfiles.title", "Tenant profiles")}</h1>
        {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="xl:col-span-2 space-y-1">
          <Label htmlFor="tenant-profiles-search">{t("pages.tenantProfiles.filters.search", "Search")}</Label>
          <Input
            id="tenant-profiles-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("pages.tenantProfiles.filters.searchPlaceholder", "Name, username or email")}
          />
        </div>

        <div className="space-y-1">
          <Label>{t("pages.tenantProfiles.filters.profileType", "Profile type")}</Label>
          <Select value={profileType} onValueChange={setProfileType}>
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

        <div className="space-y-1">
          <Label>{t("pages.tenantProfiles.filters.role", "Role")}</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
              {roleOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t("pages.tenantProfiles.filters.membershipStatus", "Membership status")}</Label>
          <Select value={membershipStatus} onValueChange={setMembershipStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>{t("pages.tenantProfiles.filters.all", "All")}</SelectItem>
              {membershipStatusOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1 md:max-w-xs">
          <Label>{t("pages.tenantProfiles.filters.active", "Active")}</Label>
          <Select value={active} onValueChange={setActive}>
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
            {items.length === 0 ? (
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
                  <TableCell>{item.role ?? "-"}</TableCell>
                  <TableCell>{item.membershipStatus ?? "-"}</TableCell>
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
    </div>
  );
};

export default TenantProfilesPage;
