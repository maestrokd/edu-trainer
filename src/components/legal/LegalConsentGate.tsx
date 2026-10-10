import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Label } from "@/components/ui/label.tsx";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { hasLegalDocument } from "@/legal/legal-document-registry.ts";
import { acceptLegalConsents, LegalDocumentType } from "@/services/LegalService.ts";

const isAllowedRoute = (pathname: string): boolean =>
  pathname === "/login" ||
  pathname === "/register" ||
  pathname === "/password/reset" ||
  pathname === "/telegram/login" ||
  pathname.startsWith("/auth/invitations/") ||
  pathname === "/terms" ||
  pathname.startsWith("/terms/") ||
  pathname === "/privacy" ||
  pathname.startsWith("/privacy/");

export function LegalConsentGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { principal, isAuthenticated, logout, refreshPrincipal } = useAuth();
  const requiredDocuments = useMemo(
    () => principal?.legalConsent.documents.filter((document) => document.actionRequired) ?? [],
    [principal]
  );
  const requiredDocumentsKey = requiredDocuments
    .map((document) => `${document.type}:${document.currentVersion}`)
    .join("|");
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmed({});
    setError(null);
  }, [requiredDocumentsKey]);

  const gateRequired =
    isAuthenticated &&
    principal?.profileType === "PRIMARY" &&
    principal.legalConsent.required &&
    !isAllowedRoute(pathname);

  if (!gateRequired) return children;

  const contentAvailable = requiredDocuments.every((document) =>
    hasLegalDocument(document.type, document.currentVersion)
  );
  const allConfirmed =
    requiredDocuments.length > 0 && requiredDocuments.every((document) => confirmed[document.type] === true);

  const handleContinue = async () => {
    if (!contentAvailable || !allConfirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptLegalConsents(
        requiredDocuments.map((document) => ({ type: document.type, version: document.currentVersion }))
      );
      const refreshed = await refreshPrincipal();
      if (refreshed.legalConsent.required) {
        setError(t("legal.gate.stillRequired"));
      }
    } catch {
      setError(t("legal.gate.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <Card className="relative mx-auto w-full max-w-xl">
        <div className="absolute right-6 top-4">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{t("legal.gate.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("legal.gate.description")}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {!contentAvailable && (
            <Alert variant="destructive">
              <AlertDescription>{t("legal.errors.contentUnavailable")}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {requiredDocuments.map((document) => {
              const isTerms = document.type === LegalDocumentType.TERMS;
              const name = isTerms ? t("legal.documents.terms") : t("legal.documents.privacy");
              const path = isTerms ? "/terms" : "/privacy";
              return (
                <div key={document.type} className="rounded-md border p-4">
                  <Link
                    to={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {t("legal.gate.viewDocument", { document: name })}
                  </Link>
                  <div className="mt-3 flex items-start gap-2">
                    <Checkbox
                      id={`legal-gate-${document.type}`}
                      checked={confirmed[document.type] ?? false}
                      disabled={!contentAvailable || submitting}
                      onCheckedChange={(checked) =>
                        setConfirmed((current) => ({ ...current, [document.type]: checked === true }))
                      }
                    />
                    <Label htmlFor={`legal-gate-${document.type}`} className="cursor-pointer font-normal leading-5">
                      {isTerms ? t("legal.gate.acceptTerms") : t("legal.gate.acknowledgePrivacy")}
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={logout} disabled={submitting}>
              {t("menu.user.logout", "Log out")}
            </Button>
            <Button type="button" onClick={handleContinue} disabled={!allConfirmed || !contentAvailable || submitting}>
              {submitting ? t("legal.gate.submitting") : t("legal.gate.continue")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
