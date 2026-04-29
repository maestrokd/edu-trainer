import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Loader2, MailPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import {
  type TenantMembershipRole,
  TenantMembershipRole as TenantMembershipRoleValues,
} from "@/services/AuthService.ts";
import { extractErrorCode } from "@/services/ApiService.ts";
import TenantInvitationService, {
  type TenantInvitationStatus,
  type TenantInvitationsResponse,
  TenantInvitationStatus as TenantInvitationStatusValues,
} from "@/services/TenantInvitationService.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";

const ALL_FILTER = "ALL";
const roleOptions = Object.values(TenantMembershipRoleValues);
const statusOptions = Object.values(TenantInvitationStatusValues);

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const TenantInvitationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();

  const tenantUuid = principal?.activeTenantUuid ?? null;
  const tenantName = principal?.activeTenantName ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<string>(ALL_FILTER);
  const [status, setStatus] = useState<string>(ALL_FILTER);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, isError, error } = useQuery<TenantInvitationsResponse>({
    queryKey: ["tenantInvitations", tenantUuid, role, status, debouncedSearch],
    enabled: Boolean(tenantUuid),
    queryFn: async () =>
      await TenantInvitationService.listTenantInvitations(tenantUuid!, {
        role: role === ALL_FILTER ? undefined : (role as TenantMembershipRole),
        status: status === ALL_FILTER ? undefined : (status as TenantInvitationStatus),
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
            {t("pages.tenantInvitations.errors.noActiveTenant", "No active tenant found. Switch tenant and try again.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("pages.tenantInvitations.title", "Tenant invitations")}</h1>
        <div className="flex items-center gap-2">
          {(isLoading || isFetching) && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
          <Button onClick={() => navigate("/settings/tenant-invitations/create")}>
            <MailPlus className="mr-2 h-4 w-4" />
            {t("pages.tenantInvitations.inviteButton", "Invite user")}
          </Button>
        </div>
      </div>

      {tenantName && (
        <Alert>
          <AlertDescription>
            {t("pages.tenantInvitations.activeTenant", {
              defaultValue: "Active tenant: {{tenantName}}",
              tenantName,
            })}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="tenant-invitations-search">{t("pages.tenantInvitations.filters.search", "Search")}</Label>
          <Input
            id="tenant-invitations-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("pages.tenantInvitations.filters.searchPlaceholder", "Email")}
          />
        </div>

        <div className="space-y-1">
          <Label>{t("pages.tenantInvitations.filters.role", "Role")}</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
              {roleOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t("pages.tenantInvitations.filters.status", "Status")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
              {statusOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
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
              <TableHead>{t("pages.tenantInvitations.columns.email", "Email")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.role", "Role")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.status", "Status")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.expiresAt", "Expires at")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.acceptedAt", "Accepted at")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.createdAt", "Created at")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {t("pages.tenantInvitations.empty", "No tenant invitations found.")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.invitationUuid}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>{item.role}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.expiresAt)}</TableCell>
                  <TableCell>{formatDateTime(item.acceptedAt)}</TableCell>
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

export default TenantInvitationsPage;
