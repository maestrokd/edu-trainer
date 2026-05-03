import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Filter, Loader2, MenuIcon, MoreHorizontal, Pencil, Plus, Search, Trash2, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { useInsetHeader } from "@/contexts/InsetHeaderContext.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { cn } from "@/lib/utils.ts";
import { notifier } from "@/services/NotificationService.ts";
import TenantProfilesService, {
  TenantProfileType,
  type TenantProfileListItem,
  type TenantProfilesResponse,
} from "@/services/TenantProfilesService.ts";
import { shorten } from "@/services/utils/StringUtils.ts";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";

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

export const SecondaryProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const { getErrorMessage, handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { principal } = useAuth();
  const tenantUuid = principal?.activeTenantUuid ?? null;

  const [searchDraft, setSearchDraft] = useState("");
  const [searchString, setSearchString] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProfileStatusFilter>("ALL");
  const [draftStatusFilter, setDraftStatusFilter] = useState<ProfileStatusFilter>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const {
    data: profiles = { items: [] },
    isLoading,
    isError,
    error,
  } = useQuery<TenantProfilesResponse>({
    queryKey: ["secondaryProfiles", tenantUuid, searchString, statusFilter],
    enabled: Boolean(tenantUuid),
    queryFn: () =>
      TenantProfilesService.listTenantProfiles(tenantUuid as string, {
        profileType: TenantProfileType.CHILD,
        active: mapStatusFilterToActive(statusFilter),
        searchString: searchString || undefined,
      }),
  });

  const loadErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, {
      fallbackKey: "pages.secondaryProfiles.loadError",
      fallbackMessage: "Failed to load profiles.",
    });
  }, [error, getErrorMessage, isError]);

  useEffect(() => {
    if (loadErrorMessage) {
      notifier.error(loadErrorMessage);
    }
  }, [loadErrorMessage]);

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => TenantProfilesService.deleteTenantProfile(tenantUuid as string, uuid),
    onSuccess: () => {
      setActionError(null);
      notifier.success(t("pages.secondaryProfiles.notifications.deleteSuccess", "Profile deleted successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles", tenantUuid] });
    },
    onError: (mutationError: unknown) => {
      handleError(mutationError, {
        fallbackKey: "pages.secondaryProfiles.notifications.deleteError",
        fallbackMessage: "Failed to delete profile",
        setError: setActionError,
      });
    },
  });

  const handleDelete = async (profileUuid: string) => {
    if (!tenantUuid) {
      return;
    }

    if (confirm(t("pages.secondaryProfiles.confirmDelete", "Are you sure you want to delete this profile?"))) {
      setActionError(null);
      await deleteMutation.mutateAsync(profileUuid);
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
          {t("pages.secondaryProfiles.title", "Child Profiles")}
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

          <div className="hidden items-center gap-2 lg:flex">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProfileStatusFilter)}>
              <SelectTrigger className="h-9 w-40 rounded-full bg-background text-sm">
                <SelectValue placeholder={t("pages.secondaryProfiles.filters.status", "Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                <SelectItem value="ACTIVE">{t("pages.tenantProfiles.activeValues.true", "Active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("pages.tenantProfiles.activeValues.false", "Inactive")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              className="h-9 rounded-full px-3.5 text-sm"
              onClick={() => navigate("create")}
              aria-label={t("pages.secondaryProfiles.createButton.tooltip", "Create Profile")}
              title={t("pages.secondaryProfiles.createButton.tooltip", "Create Profile")}
            >
              <Plus className="mr-1 size-4" />
              {t("common.create", "Create")}
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
            onClick={() => navigate("create")}
            aria-label={t("pages.secondaryProfiles.createButton.tooltip", "Create Profile")}
            title={t("pages.secondaryProfiles.createButton.tooltip", "Create Profile")}
            className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 lg:hidden"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    ),
    [activeFiltersCount, hasActiveFilters, navigate, searchDraft, statusFilter, t]
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
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={t("common.search", "Search")}
            className="h-10 rounded-full border-border bg-card/80 pl-9 pr-3 text-sm shadow-sm"
          />
        </label>
      </div>

      {hasActiveFilters ? (
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
      ) : null}

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      )}

      {!isLoading && isError && (
        <Alert variant="destructive">
          <AlertDescription>{loadErrorMessage}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-8/12 sm:min-w-1/2 text-center">
                  {t("pages.secondaryProfiles.columns.name", "Name")}
                </TableHead>
                <TableHead className="hidden sm:table-cell max-w-30 text-center">
                  {t("pages.secondaryProfiles.columns.username", "Username")}
                </TableHead>
                <TableHead className="hidden sm:table-cell max-w-30 text-center">
                  {t("pages.secondaryProfiles.columns.locale", "Locale")}
                </TableHead>
                <TableHead className="w-10">
                  <div className="grid place-items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Users className="w-4 h-4 cursor-pointer" aria-hidden="true" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("pages.secondaryProfiles.columns.ownership", "Ownership")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="w-10">
                  <div className="grid place-items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MenuIcon className="w-4 h-4 cursor-pointer" aria-hidden="true" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("common.list.actions", "Actions")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    {t("pages.secondaryProfiles.empty", "No child profiles found.")}
                  </TableCell>
                </TableRow>
              ) : (
                profiles.items.map((profile) => {
                  const linkedUserProfileUuid = resolveLinkedUserProfileUuid(profile);
                  return (
                    <TableRow key={profile.profileUuid}>
                      <TableCell className="min-w-8/12 sm:min-w-1/2 truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {shorten(
                                profile.firstName && profile.lastName
                                  ? `${profile.firstName} ${profile.lastName}`
                                  : (profile.displayName ??
                                      profile.username ??
                                      t("familyTask.profiles.unknown", "Unknown")),
                                16
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="whitespace-normal break-words">
                              {profile.firstName && profile.lastName
                                ? `${profile.firstName} ${profile.lastName}`
                                : (profile.displayName ??
                                  profile.username ??
                                  t("familyTask.profiles.unknown", "Unknown"))}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-40 truncate">
                        {profile.username ?? "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-40 truncate">
                        <div className="grid place-items-center">
                          <Badge variant="secondary" className="cursor-pointer">
                            {profile.locale ?? "-"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="w-10 truncate">
                        <div className="grid place-items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <User className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("pages.secondaryProfiles.row.ownership.secondary", "Secondary")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="w-10 text-right">
                        <div className="grid place-items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="p-2">
                                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!linkedUserProfileUuid}
                                onClick={() => {
                                  if (linkedUserProfileUuid) {
                                    navigate(`${linkedUserProfileUuid}/edit`);
                                  }
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("common.edit", "Edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!linkedUserProfileUuid}
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (linkedUserProfileUuid) {
                                    void handleDelete(linkedUserProfileUuid);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete", "Delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="w-[min(92vw,420px)] rounded-2xl border border-border/80 p-5 sm:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{t("common.filters", "Filters")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.secondaryProfiles.filters.hint", "Filter profiles by status.")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("pages.secondaryProfiles.filters.status", "Status")}</Label>
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
                  <SelectItem value="INACTIVE">{t("pages.tenantProfiles.activeValues.false", "Inactive")}</SelectItem>
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
  );
};

export default SecondaryProfilesPage;
