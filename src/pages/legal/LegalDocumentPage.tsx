import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector.tsx";
import { resolveLegalDocument } from "@/legal/legal-document-registry.ts";
import {
  getLegalRequirements,
  LegalDocumentType,
  type LegalDocumentType as LegalDocumentTypeValue,
} from "@/services/LegalService.ts";

interface LegalDocumentPageProps {
  type: LegalDocumentTypeValue;
}

export function LegalDocumentPage({ type }: LegalDocumentPageProps) {
  const { t } = useTranslation();
  const { version: routeVersion } = useParams<{ version: string }>();
  const [version, setVersion] = useState<string | null>(routeVersion ?? null);
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(!routeVersion);
  const [error, setError] = useState<string | null>(null);
  const title = type === LegalDocumentType.TERMS ? t("legal.documents.terms") : t("legal.documents.privacy");
  const currentPath = type === LegalDocumentType.TERMS ? "/terms" : "/privacy";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setContent(null);
      setEffectiveDate(null);
      try {
        let resolvedVersion = routeVersion;
        if (!resolvedVersion) {
          const requirements = await getLegalRequirements();
          const requirement = requirements.documents.find((document) => document.type === type);
          if (!requirement) throw new Error("Missing legal requirement");
          resolvedVersion = requirement.version;
          if (!cancelled) setEffectiveDate(requirement.effectiveDate);
        }
        const markdown = resolveLegalDocument(type, resolvedVersion);
        if (!markdown) {
          if (!cancelled)
            setError(routeVersion ? t("legal.errors.versionNotFound") : t("legal.errors.contentUnavailable"));
          return;
        }
        if (!cancelled) {
          setVersion(resolvedVersion);
          setContent(markdown);
        }
      } catch {
        if (!cancelled) setError(t("legal.errors.contentUnavailable"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [routeVersion, t, type]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex justify-end">
          <LanguageSelector mode={LanguageSelectorMode.ICON} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            {version && (
              <p className="text-sm text-muted-foreground">
                {t("legal.document.version", { version })}
                {effectiveDate ? ` · ${t("legal.document.effectiveDate", { date: effectiveDate })}` : ""}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loading && <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="space-y-3">
                  <p>{error}</p>
                  {routeVersion && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={currentPath}>{t("legal.actions.viewCurrent")}</Link>
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {content && (
              <article className="space-y-4 leading-7 text-foreground">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="mt-8 text-3xl font-bold first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="mt-8 text-2xl font-semibold">{children}</h2>,
                    h3: ({ children }) => <h3 className="mt-6 text-xl font-semibold">{children}</h3>,
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul className="ml-6 list-disc space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="ml-6 list-decimal space-y-2">{children}</ol>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-primary underline underline-offset-4"
                        target={href?.startsWith("http") ? "_blank" : undefined}
                        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
