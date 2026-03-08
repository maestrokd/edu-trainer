import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FeatureLockedPanel } from "./FeatureLockedPanel";
import { useFamilyTaskAnalytics } from "../../hooks/useFamilyTaskAnalytics";

interface UpgradeSuggestionCardProps {
  source?: string;
}

export function UpgradeSuggestionCard({ source }: UpgradeSuggestionCardProps) {
  const { t } = useTranslation();
  const { trackUpgradeSuggestionClicked, trackUpgradeSuggestionViewed } = useFamilyTaskAnalytics();

  useEffect(() => {
    trackUpgradeSuggestionViewed(source);
  }, [source, trackUpgradeSuggestionViewed]);

  return (
    <FeatureLockedPanel
      title={t("familyTask.gates.upgradeTitle", "Upgrade to unlock advanced tools")}
      description={t(
        "familyTask.gates.upgradeDescription",
        "Premium access enables advanced insights, richer workflows, and additional family automations."
      )}
      ctaLabel={t("familyTask.gates.upgradeCta", "View plans")}
      ctaTo="/subscriptions"
      onCtaClick={() => trackUpgradeSuggestionClicked(source)}
    />
  );
}
