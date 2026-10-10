import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hasLegalDocument } from "@/legal/legal-document-registry.ts";
import { getLegalRequirements, LegalDocumentType, type LegalDocumentSubmission } from "@/services/LegalService.ts";

export interface RegistrationLegalConsentState {
  age18Confirmed: boolean;
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  loading: boolean;
  error: string | null;
  ready: boolean;
  documents: LegalDocumentSubmission[];
  setAge18Confirmed: (checked: boolean) => void;
  setTermsAccepted: (checked: boolean) => void;
  setPrivacyAcknowledged: (checked: boolean) => void;
  retry: () => void;
}

export function useRegistrationLegalConsent(enabled: boolean): RegistrationLegalConsentState {
  const { t } = useTranslation();
  const [age18Confirmed, setAge18Confirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [documents, setDocuments] = useState<LegalDocumentSubmission[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      setDocuments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLegalRequirements()
      .then((response) => {
        if (cancelled) return;
        const byType = new Map(response.documents.map((document) => [document.type, document]));
        const terms = byType.get(LegalDocumentType.TERMS);
        const privacy = byType.get(LegalDocumentType.PRIVACY);
        if (!terms || !privacy) {
          throw new Error("Incomplete legal requirements");
        }
        const submissions = [terms, privacy].map(({ type, version }) => ({ type, version }));
        const missingContent = submissions.some((document) => !hasLegalDocument(document.type, document.version));
        if (missingContent) {
          throw new Error("Legal document content is unavailable");
        }
        setDocuments(submissions);
      })
      .catch(() => {
        if (!cancelled) {
          setDocuments([]);
          setError(t("legal.errors.requirementsUnavailable"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, enabled, t]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const ready = useMemo(
    () =>
      !enabled ||
      (!loading && !error && documents.length === 2 && age18Confirmed && termsAccepted && privacyAcknowledged),
    [age18Confirmed, documents.length, enabled, error, loading, privacyAcknowledged, termsAccepted]
  );

  return {
    age18Confirmed,
    termsAccepted,
    privacyAcknowledged,
    loading,
    error,
    ready,
    documents,
    setAge18Confirmed,
    setTermsAccepted,
    setPrivacyAcknowledged,
    retry,
  };
}
