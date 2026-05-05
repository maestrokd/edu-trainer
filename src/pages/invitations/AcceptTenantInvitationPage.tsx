import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Loader2 } from "lucide-react";
import { extractErrorCode } from "@/services/ApiService.ts";
import { notifier } from "@/services/NotificationService.ts";
import TenantInvitationService, {
  type ResolveTenantInvitationResponse,
  TenantInvitationStatus,
} from "@/services/TenantInvitationService.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { type TenantMembershipRole } from "@/services/AuthService.ts";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";

type InvitationPageState =
  | "loading"
  | "invalid_token"
  | "expired"
  | "already_processed"
  | "existing_user_ready_to_accept"
  | "accepting";

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const AcceptTenantInvitationPage: React.FC = () => {
  const { t } = useTranslation();
  const { handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, doRefresh } = useAuth();

  const [pageState, setPageState] = useState<InvitationPageState>("loading");
  const [invitation, setInvitation] = useState<ResolveTenantInvitationResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const acceptInFlightRef = useRef(false);

  const navigateToSuccess = (tenantUuid: string, tenantName: string, role: TenantMembershipRole) => {
    if (!token) return;
    navigate(`/auth/invitations/${token}/success`, {
      replace: true,
      state: {
        tenantUuid,
        tenantName,
        role,
      },
    });
  };

  const handleResolveError = (error: unknown) => {
    const errorCode = extractErrorCode(error);
    if (errorCode === "INVITATION_NOT_FOUND") {
      setPageState("invalid_token");
      return;
    }
    if (errorCode === "INVITATION_EXPIRED") {
      setPageState("expired");
      return;
    }
    if (errorCode === "INVITATION_ALREADY_PROCESSED") {
      setPageState("already_processed");
      return;
    }
    setPageState("invalid_token");
  };

  const refreshSessionBestEffort = async () => {
    try {
      await doRefresh();
    } catch {
      // Invitation accept can still be successful even if the refresh endpoint returns an error.
    }
  };

  const resolveProcessedInvitation = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const data = await TenantInvitationService.resolveTenantInvitation(token);
      setInvitation(data);

      if (data.status === TenantInvitationStatus.ACCEPTED) {
        await refreshSessionBestEffort();
        navigateToSuccess(data.tenantUuid, data.tenantName, data.role);
        return true;
      }
      if (data.status === TenantInvitationStatus.EXPIRED) {
        setPageState("expired");
        return true;
      }
      if (data.status !== TenantInvitationStatus.PENDING) {
        setPageState("already_processed");
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  useEffect(() => {
    const resolve = async () => {
      if (!token) {
        setPageState("invalid_token");
        return;
      }

      setPageState("loading");
      setActionError(null);

      try {
        const data = await TenantInvitationService.resolveTenantInvitation(token);
        setInvitation(data);

        if (data.status === TenantInvitationStatus.EXPIRED) {
          setPageState("expired");
          return;
        }
        if (data.status !== TenantInvitationStatus.PENDING) {
          setPageState("already_processed");
          return;
        }

        if (!data.existingUser) {
          navigate(`/auth/invitations/${token}/register`, { replace: true });
          return;
        }

        setPageState("existing_user_ready_to_accept");
      } catch (error: unknown) {
        handleResolveError(error);
      }
    };

    void resolve();
  }, [navigate, token]);

  const handleAcceptInvitation = async () => {
    if (!token || !invitation || acceptInFlightRef.current) return;

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: location },
      });
      return;
    }

    acceptInFlightRef.current = true;
    setPageState("accepting");
    setActionError(null);

    try {
      const result = await TenantInvitationService.acceptTenantInvitation(token);
      await refreshSessionBestEffort();
      notifier.success(
        t("pages.tenantInvitationAccept.notifications.acceptSuccess", {
          defaultValue: "You joined the tenant successfully.",
        })
      );
      navigateToSuccess(result.tenantUuid, result.tenantName, result.role);
    } catch (error: unknown) {
      const errorCode = extractErrorCode(error);
      if (errorCode === "USER_ALREADY_TENANT_MEMBER") {
        const wasResolved = await resolveProcessedInvitation();
        if (wasResolved) return;

        await refreshSessionBestEffort();
        navigateToSuccess(invitation.tenantUuid, invitation.tenantName, invitation.role);
        return;
      }
      if (errorCode === "INVITATION_ALREADY_PROCESSED" || errorCode === "IDEMPOTENCY_ERROR") {
        const wasResolved = await resolveProcessedInvitation();
        if (wasResolved) return;
      }
      if (errorCode === "INVITATION_EXPIRED") {
        setPageState("expired");
        return;
      }
      if (errorCode === "INVITATION_ALREADY_PROCESSED") {
        setPageState("already_processed");
        return;
      }
      if (errorCode === "INVITATION_NOT_FOUND") {
        setPageState("invalid_token");
        return;
      }

      handleError(error, {
        fallbackKey: "pages.tenantInvitationAccept.notifications.acceptError",
        fallbackMessage: "Failed to accept invitation.",
        setError: setActionError,
      });
      setPageState("existing_user_ready_to_accept");
    } finally {
      acceptInFlightRef.current = false;
    }
  };

  const renderStatus = () => {
    if (pageState === "loading" || pageState === "accepting") {
      return (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            {pageState === "accepting"
              ? t("pages.tenantInvitationAccept.states.accepting", "Joining tenant...")
              : t("common.loading", "Loading...")}
          </span>
        </div>
      );
    }

    if (pageState === "invalid_token") {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            {t("pages.tenantInvitationAccept.states.invalidToken", "Invitation link is invalid.")}
          </AlertDescription>
        </Alert>
      );
    }

    if (pageState === "expired") {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            {t("pages.tenantInvitationAccept.states.expired", "This invitation has expired.")}
          </AlertDescription>
        </Alert>
      );
    }

    if (pageState === "already_processed") {
      return (
        <Alert>
          <AlertDescription>
            {t("pages.tenantInvitationAccept.states.alreadyProcessed", "This invitation was already processed.")}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="relative w-full max-w-lg">
        <div className="absolute top-4 right-6">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <CardHeader>
          <CardTitle>{t("pages.tenantInvitationAccept.title", "Tenant invitation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderStatus()}

          {invitation && pageState === "existing_user_ready_to_accept" && (
            <>
              <Alert>
                <AlertDescription>
                  {t("pages.tenantInvitationAccept.summary", {
                    defaultValue: "You are invited to join {{tenantName}} as {{role}}.",
                    tenantName: invitation.tenantName,
                    role: invitation.role,
                  })}
                </AlertDescription>
              </Alert>

              <div className="rounded-md border p-3 text-sm space-y-1">
                <p>
                  {t("pages.tenantInvitationAccept.fields.email", "Invited email")}:{" "}
                  <span className="font-medium">{invitation.email}</span>
                </p>
                <p>
                  {t("pages.tenantInvitationAccept.fields.expiresAt", "Expires at")}:{" "}
                  <span className="font-medium">{formatDateTime(invitation.expiresAt)}</span>
                </p>
              </div>

              {actionError && (
                <Alert variant="destructive">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" onClick={handleAcceptInvitation}>
                {isAuthenticated
                  ? t("pages.tenantInvitationAccept.joinButton", "Join tenant")
                  : t("pages.tenantInvitationAccept.loginButton", "Sign in to join")}
              </Button>
            </>
          )}

          {pageState !== "existing_user_ready_to_accept" && pageState !== "loading" && pageState !== "accepting" && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => navigate("/login")}>
                {t("pages.tenantInvitationAccept.backToLoginButton", "Go to login")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptTenantInvitationPage;
