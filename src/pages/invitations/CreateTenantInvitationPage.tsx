import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, MailPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { extractErrorCode } from "@/services/ApiService.ts";
import { notifier } from "@/services/NotificationService.ts";
import TenantInvitationService, {
  type TenantInvitationLocale,
  type TenantInvitationResponse,
  type TenantInvitationRole,
  TenantInvitationLocale as TenantInvitationLocaleValues,
  TenantInvitationRole as TenantInvitationRoleValues,
} from "@/services/TenantInvitationService.ts";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resolveLocaleByLanguage = (language: string | undefined | null): TenantInvitationLocale => {
  switch (language) {
    case "uk":
      return TenantInvitationLocaleValues.UK_UA;
    case "ru":
      return TenantInvitationLocaleValues.RU_RU;
    default:
      return TenantInvitationLocaleValues.EN_US;
  }
};

const formatUtcDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const roleOptions: TenantInvitationRole[] = [
  TenantInvitationRoleValues.PARENT,
  TenantInvitationRoleValues.CAREGIVER,
  TenantInvitationRoleValues.MEMBER,
  TenantInvitationRoleValues.VIEWER,
];

const localeOptions: TenantInvitationLocale[] = [
  TenantInvitationLocaleValues.EN_US,
  TenantInvitationLocaleValues.UK_UA,
  TenantInvitationLocaleValues.RU_RU,
];

const CreateTenantInvitationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [role, setRole] = useState<TenantInvitationRole>(TenantInvitationRoleValues.PARENT);
  const [locale, setLocale] = useState<TenantInvitationLocale>(() => resolveLocaleByLanguage(i18n.resolvedLanguage));
  const [createdInvitation, setCreatedInvitation] = useState<TenantInvitationResponse | null>(null);

  const tenantUuid = principal?.activeTenantUuid ?? null;
  const tenantName = principal?.activeTenantName ?? null;

  const tenantMissingError = useMemo(() => !tenantUuid, [tenantUuid]);

  const createMutation = useMutation({
    mutationFn: () =>
      TenantInvitationService.createTenantInvitation(tenantUuid!, {
        email: email.trim(),
        role,
        locale,
      }),
    onSuccess: (result) => {
      setCreatedInvitation(result);
      notifier.success(
        t("pages.tenantInvitationsCreate.notifications.success", {
          defaultValue: "Invitation sent successfully.",
        })
      );
    },
    onError: (error: unknown) => {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode
        ? `errors.codes.${errorCode}`
        : "pages.tenantInvitationsCreate.notifications.submitError";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });
      notifier.error(message);
    },
  });

  const validateEmail = (value: string): string | null => {
    if (!value) return null;
    if (!emailRegex.test(value)) {
      return t("pages.registrationPage.validation.invalidEmail");
    }
    return null;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (trimmed !== email) {
      setEmail(trimmed);
      setEmailError(validateEmail(trimmed));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tenantMissingError) return;
    const trimmed = email.trim();
    const nextError = validateEmail(trimmed);
    setEmail(trimmed);
    setEmailError(nextError);
    if (!trimmed || nextError) return;
    await createMutation.mutateAsync();
  };

  return (
    <div className="flex-1 bg-background py-0 px-0 sm:py-8 sm:px-4">
      <Card className="max-w-xl w-full mx-auto">
        <CardHeader>
          <CardTitle>{t("pages.tenantInvitationsCreate.title", "Invite user to tenant")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenantMissingError && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(
                  "pages.tenantInvitationsCreate.errors.noActiveTenant",
                  "No active tenant found. Switch tenant and try again."
                )}
              </AlertDescription>
            </Alert>
          )}

          {!tenantMissingError && tenantName && (
            <Alert>
              <AlertDescription>
                {t("pages.tenantInvitationsCreate.activeTenant", {
                  defaultValue: "Active tenant: {{tenantName}}",
                  tenantName,
                })}
              </AlertDescription>
            </Alert>
          )}

          {createdInvitation && (
            <Alert>
              <AlertDescription>
                {t("pages.tenantInvitationsCreate.notifications.sentDetails", {
                  defaultValue: "Invitation sent to {{email}}. Expires at {{expiresAt}}.",
                  email: createdInvitation.email,
                  expiresAt: formatUtcDateTime(createdInvitation.expiresAt),
                })}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("pages.tenantInvitationsCreate.email.label", "Email")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("pages.tenantInvitationsCreate.email.placeholder", "name@example.com")}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                disabled={createMutation.isPending || tenantMissingError}
                required
              />
              {emailError && (
                <Alert variant="destructive">
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">{t("pages.tenantInvitationsCreate.role.label", "Role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as TenantInvitationRole)}
                disabled={createMutation.isPending || tenantMissingError}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {t(`pages.tenantInvitationsCreate.role.options.${entry}`, { defaultValue: entry })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-locale">{t("pages.tenantInvitationsCreate.locale.label", "Locale")}</Label>
              <Select
                value={locale}
                onValueChange={(value) => setLocale(value as TenantInvitationLocale)}
                disabled={createMutation.isPending || tenantMissingError}
              >
                <SelectTrigger id="invite-locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {localeOptions.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {t(`pages.tenantInvitationsCreate.locale.options.${entry}`, { defaultValue: entry })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/settings/tenant-invitations")}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !!emailError || !email.trim() || tenantMissingError}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!createMutation.isPending && <MailPlus className="mr-2 h-4 w-4" />}
                {createMutation.isPending
                  ? t("pages.tenantInvitationsCreate.submitButtonLoading", "Sending invitation...")
                  : t("pages.tenantInvitationsCreate.submitButton", "Send invitation")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTenantInvitationPage;
