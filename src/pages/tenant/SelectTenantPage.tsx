import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { notifier } from "@/services/NotificationService.ts";
import TenantService, { type TenantListItem, type TenantListResponse } from "@/services/TenantService.ts";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const SelectTenantPage: React.FC = () => {
  const { t } = useTranslation();
  const { getErrorMessage, handleError } = useApiErrorHandler();
  const { principal, doRefresh } = useAuth();
  const queryClient = useQueryClient();
  const [switchErrorMessage, setSwitchErrorMessage] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<TenantListResponse>({
    queryKey: ["tenantMemberships"],
    queryFn: TenantService.listMyTenants,
  });

  const switchMutation = useMutation({
    mutationFn: async (tenantUuid: string) => {
      const tenant = await TenantService.setDefaultTenant(tenantUuid);
      await doRefresh();
      return tenant;
    },
    onSuccess: async (tenant) => {
      setSwitchErrorMessage(null);
      notifier.success(
        t("pages.tenantSelect.notifications.switchSuccess", {
          defaultValue: "Active tenant switched to {{tenantName}}.",
          tenantName: tenant.name,
        })
      );
      await queryClient.invalidateQueries();
      await refetch();
    },
    onError: (requestError: unknown) => {
      handleError(requestError, {
        fallbackKey: "pages.tenantSelect.notifications.switchError",
        fallbackMessage: "Failed to switch tenant.",
        setError: setSwitchErrorMessage,
      });
    },
  });

  const activeTenantUuid = principal?.activeTenantUuid ?? null;
  const activeTenantName = principal?.activeTenantName ?? null;
  const tenants = data?.items ?? [];

  const loadErrorMessage = useMemo(() => {
    if (!isError) return null;
    return getErrorMessage(error, {
      fallbackKey: "pages.tenantSelect.loadError",
      fallbackMessage: "Failed to load tenant memberships.",
    });
  }, [error, getErrorMessage, isError]);

  useEffect(() => {
    if (loadErrorMessage) {
      notifier.error(loadErrorMessage);
    }
  }, [loadErrorMessage]);

  const handleSwitchTenant = async (tenant: TenantListItem) => {
    if (tenant.tenantUuid === activeTenantUuid || switchMutation.isPending) return;
    setSwitchErrorMessage(null);
    await switchMutation.mutateAsync(tenant.tenantUuid);
  };

  return (
    <div className="bg-background p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("pages.tenantSelect.title", "Select tenant")}</h1>
        {(isLoading || isFetching || switchMutation.isPending) && (
          <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {activeTenantName && (
        <Alert>
          <AlertDescription>
            {t("pages.tenantSelect.activeTenant", {
              defaultValue: "Active tenant: {{tenantName}}",
              tenantName: activeTenantName,
            })}
          </AlertDescription>
        </Alert>
      )}

      {loadErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{loadErrorMessage}</AlertDescription>
        </Alert>
      )}

      {switchErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{switchErrorMessage}</AlertDescription>
        </Alert>
      )}

      {!isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.tenantSelect.columns.name", "Tenant")}</TableHead>
              <TableHead>{t("pages.tenantSelect.columns.role", "Role")}</TableHead>
              <TableHead>{t("pages.tenantSelect.columns.status", "Status")}</TableHead>
              <TableHead>{t("pages.tenantSelect.columns.joinedAt", "Joined at")}</TableHead>
              <TableHead className="text-right">{t("pages.tenantSelect.columns.action", "Action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  {t("pages.tenantSelect.empty", "No tenant memberships found.")}
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => {
                const isActiveTenant = tenant.tenantUuid === activeTenantUuid;
                const isSwitchingThisTenant =
                  switchMutation.isPending && switchMutation.variables === tenant.tenantUuid;

                return (
                  <TableRow key={tenant.tenantUuid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{tenant.name}</span>
                        {tenant.defaultTenant && (
                          <Badge variant="outline">{t("pages.tenantSelect.defaultBadge", "Default")}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tenant.membershipRole}</TableCell>
                    <TableCell>{tenant.tenantStatus}</TableCell>
                    <TableCell>{formatDateTime(tenant.joinedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={isActiveTenant ? "secondary" : "default"}
                        disabled={isActiveTenant || switchMutation.isPending}
                        onClick={() => void handleSwitchTenant(tenant)}
                      >
                        {isSwitchingThisTenant ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("pages.tenantSelect.switchButtonLoading", "Switching...")}
                          </>
                        ) : isActiveTenant ? (
                          t("pages.tenantSelect.currentButton", "Current tenant")
                        ) : (
                          t("pages.tenantSelect.switchButton", "Switch tenant")
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default SelectTenantPage;
