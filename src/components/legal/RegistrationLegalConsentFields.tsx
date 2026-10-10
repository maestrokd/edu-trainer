import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Label } from "@/components/ui/label.tsx";
import type { RegistrationLegalConsentState } from "@/hooks/use-registration-legal-consent.ts";

interface RegistrationLegalConsentFieldsProps {
  state: RegistrationLegalConsentState;
  disabled?: boolean;
}

export function RegistrationLegalConsentFields({ state, disabled = false }: RegistrationLegalConsentFieldsProps) {
  const { t } = useTranslation();

  if (state.loading) {
    return <p className="text-sm text-muted-foreground">{t("legal.registration.loading")}</p>;
  }

  if (state.error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription className="space-y-2">
          <p>{state.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={state.retry}>
            {t("legal.actions.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <fieldset className="space-y-3 rounded-md border p-4" disabled={disabled}>
      <legend className="px-1 text-sm font-medium">{t("legal.registration.title")}</legend>
      <div className="flex items-start gap-2">
        <Checkbox
          id="age-18-confirmed"
          checked={state.age18Confirmed}
          onCheckedChange={(checked) => state.setAge18Confirmed(checked === true)}
        />
        <Label htmlFor="age-18-confirmed" className="cursor-pointer text-sm font-normal leading-5">
          {t("legal.registration.age18")}
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms-accepted"
          checked={state.termsAccepted}
          onCheckedChange={(checked) => state.setTermsAccepted(checked === true)}
        />
        <Label htmlFor="terms-accepted" className="text-sm font-normal leading-5">
          {t("legal.registration.termsPrefix")}{" "}
          <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {t("legal.documents.terms")}
          </Link>
          .
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="privacy-acknowledged"
          checked={state.privacyAcknowledged}
          onCheckedChange={(checked) => state.setPrivacyAcknowledged(checked === true)}
        />
        <Label htmlFor="privacy-acknowledged" className="text-sm font-normal leading-5">
          {t("legal.registration.privacyPrefix")}{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {t("legal.documents.privacy")}
          </Link>
          .
        </Label>
      </div>
    </fieldset>
  );
}
