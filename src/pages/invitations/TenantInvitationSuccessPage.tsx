import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { type TenantMembershipRole } from "@/services/AuthService.ts";

interface InvitationSuccessLocationState {
  tenantUuid?: string;
  tenantName?: string;
  role?: TenantMembershipRole;
}

const TenantInvitationSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const location = useLocation();
  const state = (location.state as InvitationSuccessLocationState | undefined) ?? {};

  const title = t("pages.tenantInvitationSuccess.title", "Invitation accepted");
  const description = state.tenantName
    ? t("pages.tenantInvitationSuccess.summaryWithTenant", {
        defaultValue: "You joined {{tenantName}} as {{role}}.",
        tenantName: state.tenantName,
        role: state.role ?? "",
      })
    : t("pages.tenantInvitationSuccess.summary", "Your invitation was successfully processed.");

  const shouldOpenTenantSelect =
    Boolean(isAuthenticated) && Boolean(state.tenantUuid) && principal?.activeTenantUuid !== state.tenantUuid;

  const openAppPath = shouldOpenTenantSelect ? "/settings/tenants/select" : "/";
  const openAppButtonLabel = shouldOpenTenantSelect
    ? t("pages.tenantInvitationSuccess.selectTenantButton", "Select tenant")
    : t("pages.tenantInvitationSuccess.homeButton", "Open app");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>{description}</AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            {!isAuthenticated && (
              <Button variant="outline" onClick={() => navigate("/login", { replace: true })}>
                {t("pages.tenantInvitationSuccess.loginButton", "Go to login")}
              </Button>
            )}
            <Button onClick={() => navigate(openAppPath, { replace: true })}>{openAppButtonLabel}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantInvitationSuccessPage;
