import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FeatureLockedPanel } from "./FeatureLockedPanel";
import { useFamilyTaskAnalytics } from "../../hooks/useFamilyTaskAnalytics";

interface LoginSuggestionCardProps {
  source?: string;
}

export function LoginSuggestionCard({ source }: LoginSuggestionCardProps) {
  const { t } = useTranslation();
  const { trackLoginSuggestionClicked, trackLoginSuggestionViewed } = useFamilyTaskAnalytics();

  useEffect(() => {
    trackLoginSuggestionViewed(source);
  }, [source, trackLoginSuggestionViewed]);

  return (
    <FeatureLockedPanel
      title={t("familyTask.gates.loginTitle", "Log in to continue")}
      description={t(
        "familyTask.gates.loginDescription",
        "Sign in to save progress, track stars history, and sync family tasks across devices."
      )}
      ctaLabel={t("familyTask.gates.loginCta", "Log in")}
      ctaTo="/login"
      onCtaClick={() => trackLoginSuggestionClicked(source)}
    />
  );
}
