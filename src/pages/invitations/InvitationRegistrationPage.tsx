import React, { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircleIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { EmailVerificationType, useAuth } from "@/contexts/AuthContext.tsx";
import TenantInvitationService, {
  type ResolveTenantInvitationResponse,
  TenantInvitationStatus,
} from "@/services/TenantInvitationService.ts";
import { notifier } from "@/services/NotificationService.ts";
import { validatePassword } from "@/services/PasswordValidator.ts";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler.ts";
import { extractErrorCode } from "@/services/ApiService.ts";

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const InvitationRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const { getErrorMessage, handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { sendConfirmationCode, doRegister, isAuthenticated, logout } = useAuth();

  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<ResolveTenantInvitationResponse | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const submitInFlightRef = useRef(false);

  const navigateToSuccess = (data: ResolveTenantInvitationResponse) => {
    if (!token) return;

    navigate(`/auth/invitations/${token}/success`, {
      replace: true,
      state: {
        tenantUuid: data.tenantUuid,
        tenantName: data.tenantName,
        role: data.role,
      },
    });
  };

  const recoverFromRegistrationError = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const data = await TenantInvitationService.resolveTenantInvitation(token);
      setInvitation(data);

      if (data.status === TenantInvitationStatus.ACCEPTED) {
        navigateToSuccess(data);
        return true;
      }
      if (data.status === TenantInvitationStatus.EXPIRED) {
        setInvitationError(t("pages.tenantInvitationRegistration.states.expired", "This invitation has expired."));
        return true;
      }
      if (data.status !== TenantInvitationStatus.PENDING) {
        setInvitationError(
          t("pages.tenantInvitationRegistration.states.alreadyProcessed", "This invitation has already been processed.")
        );
        return true;
      }
      if (data.existingUser) {
        navigate(`/auth/invitations/${token}`, { replace: true });
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const resolveInvitation = async () => {
      if (!token) {
        setInvitationError(t("pages.tenantInvitationRegistration.states.invalidToken", "Invitation link is invalid."));
        setLoadingInvitation(false);
        return;
      }

      setLoadingInvitation(true);
      setInvitationError(null);

      try {
        const data = await TenantInvitationService.resolveTenantInvitation(token);
        if (data.status === TenantInvitationStatus.EXPIRED) {
          setInvitationError(t("pages.tenantInvitationRegistration.states.expired", "This invitation has expired."));
          return;
        }
        if (data.status !== TenantInvitationStatus.PENDING) {
          setInvitationError(
            t(
              "pages.tenantInvitationRegistration.states.alreadyProcessed",
              "This invitation has already been processed."
            )
          );
          return;
        }
        if (data.existingUser) {
          navigate(`/auth/invitations/${token}`, { replace: true });
          return;
        }
        setInvitation(data);
      } catch (error: unknown) {
        setInvitationError(
          getErrorMessage(error, {
            fallbackKey: "pages.tenantInvitationRegistration.states.invalidToken",
            fallbackMessage: "Invitation link is invalid.",
          })
        );
      } finally {
        setLoadingInvitation(false);
      }
    };

    void resolveInvitation();
  }, [getErrorMessage, navigate, t, token]);

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmationCode(event.target.value);
    setCodeError(null);
    setSubmitError(null);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPassword(nextValue);
    setPasswordErrors(validatePassword(nextValue));
    if (confirmPassword && nextValue !== confirmPassword) {
      setConfirmError(t("pages.registrationPage.validation.passwordsMismatch"));
    } else {
      setConfirmError(null);
    }
    setSubmitError(null);
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setConfirmPassword(nextValue);
    if (password && password !== nextValue) {
      setConfirmError(t("pages.registrationPage.validation.passwordsMismatch"));
    } else {
      setConfirmError(null);
    }
    setSubmitError(null);
  };

  const handleSendCode = async () => {
    if (!invitation || sendCodeLoading || secondsLeft > 0) return;

    setSendCodeLoading(true);
    setCodeError(null);
    setSubmitError(null);

    try {
      await sendConfirmationCode(invitation.email, EmailVerificationType.EMAIL_VERIFICATION_CODE_WEB);
      setCodeSent(true);
      setSecondsLeft(60);
      notifier.success(t("pages.registrationPage.notifications.codeSentSuccess"));
    } catch (error: unknown) {
      handleError(error, {
        fallbackKey: "pages.registrationPage.notifications.codeSentError",
        setError: setCodeError,
      });
    } finally {
      setSendCodeLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!invitation || !token || submitInFlightRef.current) return;
    if (!confirmationCode || codeError || passwordErrors.length > 0 || confirmError) return;

    submitInFlightRef.current = true;
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      await doRegister(invitation.email, password, confirmPassword, confirmationCode, token);
      notifier.success(
        t("pages.tenantInvitationRegistration.notifications.submitSuccess", {
          defaultValue: "Your account was created and invitation accepted.",
        })
      );
      navigateToSuccess(invitation);
    } catch (error: unknown) {
      const errorCode = extractErrorCode(error);
      if (
        errorCode === "INVITATION_ALREADY_PROCESSED" ||
        errorCode === "USER_ALREADY_TENANT_MEMBER" ||
        errorCode === "IDEMPOTENCY_ERROR" ||
        errorCode === "EMAIL_ALREADY_EXISTS"
      ) {
        const wasRecovered = await recoverFromRegistrationError();
        if (wasRecovered) return;
      }

      handleError(error, {
        fallbackKey: "pages.tenantInvitationRegistration.notifications.submitError",
        fallbackMessage: "Failed to complete invited registration.",
        setError: setSubmitError,
      });
    } finally {
      setSubmitLoading(false);
      submitInFlightRef.current = false;
    }
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("common.loading", "Loading...")}</span>
        </div>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
        <Card className="relative w-full max-w-lg">
          <div className="absolute top-4 right-6">
            <LanguageSelector mode={LanguageSelectorMode.ICON} />
          </div>
          <CardHeader>
            <CardTitle>{t("pages.tenantInvitationRegistration.title", "Join tenant")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{invitationError ?? t("errors.codes.UNKNOWN")}</AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => navigate("/login")}>
                {t("pages.tenantInvitationRegistration.backToLoginButton", "Go to login")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disableSubmit =
    isAuthenticated ||
    submitLoading ||
    sendCodeLoading ||
    !codeSent ||
    !confirmationCode ||
    !!codeError ||
    !password ||
    !confirmPassword ||
    passwordErrors.length > 0 ||
    !!confirmError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <Card className="relative w-full max-w-md">
        <div className="absolute top-4 right-6">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <CardHeader>
          <CardTitle>{t("pages.tenantInvitationRegistration.title", "Join tenant")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {t("pages.tenantInvitationRegistration.summary", {
                defaultValue: "You are joining {{tenantName}} as {{role}}.",
                tenantName: invitation.tenantName,
                role: invitation.role,
              })}
            </AlertDescription>
          </Alert>

          <div className="rounded-md border p-3 text-sm space-y-1">
            <p>
              {t("pages.tenantInvitationRegistration.fields.email", "Invited email")}:{" "}
              <span className="font-medium">{invitation.email}</span>
            </p>
            <p>
              {t("pages.tenantInvitationRegistration.fields.expiresAt", "Expires at")}:{" "}
              <span className="font-medium">{formatDateTime(invitation.expiresAt)}</span>
            </p>
          </div>

          {isAuthenticated && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(
                  "pages.tenantInvitationRegistration.states.mustLogoutFirst",
                  "Please log out before creating a new invited account."
                )}
              </AlertDescription>
            </Alert>
          )}

          {(submitError || confirmError || codeError) && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircleIcon />
              <AlertDescription>{submitError ?? confirmError ?? codeError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email-readonly">
                {t("pages.tenantInvitationRegistration.fields.email", "Invited email")}
              </Label>
              <Input id="invite-email-readonly" value={invitation.email} disabled readOnly />
            </div>

            <Button
              type="button"
              className="w-full flex items-center justify-center"
              onClick={handleSendCode}
              disabled={sendCodeLoading || submitLoading || secondsLeft > 0 || isAuthenticated}
            >
              {sendCodeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("pages.registrationPage.confirmationCode.sendCodeButtonLoading")}
                </>
              ) : secondsLeft > 0 ? (
                t("pages.registrationPage.confirmationCode.sendCodeButtonRe", {
                  secondsLeft,
                })
              ) : (
                t("pages.registrationPage.confirmationCode.sendCodeButton")
              )}
            </Button>

            {codeSent && (
              <div className="space-y-2">
                <Label htmlFor="confirmationCode">{t("pages.registrationPage.confirmationCode.label")}</Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="123456"
                  required
                  value={confirmationCode}
                  onChange={handleCodeChange}
                  disabled={sendCodeLoading || submitLoading || isAuthenticated}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t("pages.registrationPage.password.label")}</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={handlePasswordChange}
                disabled={submitLoading || isAuthenticated}
              />
              {passwordErrors.length > 0 && (
                <Alert variant="destructive" role="alert" aria-live="assertive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordErrors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("pages.registrationPage.confirmPassword.label")}</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={submitLoading || isAuthenticated}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="invite-show-password"
                  checked={showPassword}
                  onCheckedChange={(checked) => setShowPassword(!!checked)}
                />
                <Label htmlFor="invite-show-password" className="text-sm font-normal cursor-pointer">
                  {t("pages.registrationPage.password.showPasswordLabel")}
                </Label>
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={disableSubmit}>
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLoading
                ? t("pages.registrationPage.submitButtonLoading")
                : t("pages.tenantInvitationRegistration.submitButton", "Create account and join")}
            </Button>
          </form>

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => navigate("/login")}>
              {t("pages.tenantInvitationRegistration.backToLoginButton", "Go to login")}
            </Button>
            {isAuthenticated && (
              <Button variant="destructive" onClick={logout}>
                {t("menu.user.logout", "Log out")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationRegistrationPage;
