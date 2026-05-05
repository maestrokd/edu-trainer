import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Filter, Loader2, MailPlus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useInsetHeader } from "@/contexts/InsetHeaderContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { cn } from "@/lib/utils.ts";
import {
  type TenantMembershipRole,
  TenantMembershipRole as TenantMembershipRoleValues,
} from "@/services/AuthService.ts";
import TenantInvitationService, {
  type TenantInvitationStatus,
  type TenantInvitationsResponse,
  TenantInvitationStatus as TenantInvitationStatusValues,
} from "@/services/TenantInvitationService.ts";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";
import { notifier } from "@/services/NotificationService.ts";

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
  const { getErrorMessage } = useApiErrorHandler();
  const navigate = useNavigate();
  const { principal } = useAuth();

  const tenantUuid = principal?.activeTenantUuid ?? null;
  const tenantName = principal?.activeTenantName ?? null;

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<string>(ALL_FILTER);
  const [status, setStatus] = useState<string>(ALL_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftRole, setDraftRole] = useState<string>(ALL_FILTER);
  const [draftStatus, setDraftStatus] = useState<string>(ALL_FILTER);

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

    setDraftRole(role);
    setDraftStatus(status);
  }, [filtersOpen, role, status]);

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
    return getErrorMessage(error, {
      fallbackKey: "pages.tenantInvitations.loadError",
      fallbackMessage: "Failed to load tenant invitations.",
    });
  }, [error, getErrorMessage, isError]);

  useEffect(() => {
    if (errorMessage) {
      notifier.error(errorMessage);
    }
  }, [errorMessage]);

  const hasActiveFilters = role !== ALL_FILTER || status !== ALL_FILTER;
  const activeFiltersCount = Number(role !== ALL_FILTER) + Number(status !== ALL_FILTER);

  const clearFilters = () => {
    setRole(ALL_FILTER);
    setStatus(ALL_FILTER);
    setDraftRole(ALL_FILTER);
    setDraftStatus(ALL_FILTER);
  };

  const applyDraftFilters = () => {
    setRole(draftRole);
    setStatus(draftStatus);
    setFiltersOpen(false);
  };

  const appHeaderContent = useMemo(
    () => (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-semibold leading-none text-foreground sm:text-xl">
            {t("pages.tenantInvitations.title", "Tenant invitations")}
          </h1>
          {(isLoading || isFetching) && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="relative hidden w-[260px] items-center lg:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("pages.tenantInvitations.filters.searchPlaceholder", "Email")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <label className="relative hidden w-[220px] items-center sm:flex lg:hidden">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("pages.tenantInvitations.filters.searchPlaceholder", "Email")}
              className="h-9 rounded-full border-border bg-background pl-9 pr-3 text-sm shadow-sm"
            />
          </label>

          <div className="hidden items-center gap-2 lg:flex">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-32 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantInvitations.filters.role", "Role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
                {roleOptions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`pages.tenantInvitations.role.${entry}`, { defaultValue: entry })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-36 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.tenantInvitations.filters.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
                {statusOptions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`pages.tenantInvitations.statusValues.${entry}`, { defaultValue: entry })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="h-9 rounded-full px-3.5 text-sm"
              onClick={() => navigate("/settings/tenant-invitations/create")}
            >
              <MailPlus className="mr-1 size-4" />
              {t("pages.tenantInvitations.inviteButton", "Invite user")}
            </Button>
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

          <button
            type="button"
            onClick={() => navigate("/settings/tenant-invitations/create")}
            aria-label={t("pages.tenantInvitations.inviteButton", "Invite user")}
            title={t("pages.tenantInvitations.inviteButton", "Invite user")}
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 lg:hidden"
          >
            <MailPlus className="size-4" />
          </button>
        </div>
      </div>
    ),
    [activeFiltersCount, hasActiveFilters, isFetching, isLoading, navigate, role, searchInput, status, t]
  );

  useInsetHeader(appHeaderContent, { visible: true, deps: [appHeaderContent] });

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
      <div className="sm:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("pages.tenantInvitations.filters.searchPlaceholder", "Email")}
            className="h-10 rounded-full border-border bg-card/80 pl-9 pr-3 text-sm shadow-sm"
          />
        </label>
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

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground lg:hidden">
          <span className="font-medium">{t("common.filters", "Filters")}:</span>
          {role !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">
              {t(`pages.tenantInvitations.role.${role}`, { defaultValue: role })}
            </span>
          ) : null}
          {status !== ALL_FILTER ? (
            <span className="rounded-full bg-background px-2 py-0.5">
              {t(`pages.tenantInvitations.statusValues.${status}`, { defaultValue: status })}
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
              <TableHead>{t("pages.tenantInvitations.columns.email", "Email")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.role", "Role")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.status", "Status")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.expiresAt", "Expires at")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.acceptedAt", "Accepted at")}</TableHead>
              <TableHead>{t("pages.tenantInvitations.columns.createdAt", "Created at")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || (isFetching && items.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("common.loading", "Loading...")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {t("pages.tenantInvitations.empty", "No tenant invitations found.")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.invitationUuid}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>{t(`pages.tenantInvitations.role.${item.role}`, { defaultValue: item.role })}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`pages.tenantInvitations.statusValues.${item.status}`, { defaultValue: item.status })}
                    </Badge>
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

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-[min(94vw,520px)] rounded-2xl border border-border/80 p-5 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.tenantInvitations.filters.hint", "Filter invitations by role and status.")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pages.tenantInvitations.filters.role", "Role")}</Label>
                <Select value={draftRole} onValueChange={setDraftRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
                    {roleOptions.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(`pages.tenantInvitations.role.${entry}`, { defaultValue: entry })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.tenantInvitations.filters.status", "Status")}</Label>
                <Select value={draftStatus} onValueChange={setDraftStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>{t("pages.tenantInvitations.filters.all", "All")}</SelectItem>
                    {statusOptions.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(`pages.tenantInvitations.statusValues.${entry}`, { defaultValue: entry })}
                      </SelectItem>
                    ))}
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

export default TenantInvitationsPage;
