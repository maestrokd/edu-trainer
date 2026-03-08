import { useTranslation } from "react-i18next";
import { ParentFeatureGate } from "../components/gates/ParentFeatureGate";
import { FamilyTaskPageShell } from "../components/layout/FamilyTaskPageShell";
import { useTrackFamilyTaskPageView } from "../hooks/useTrackFamilyTaskPageView";

export function FamilyTaskSettingsPage() {
  const { t } = useTranslation();
  useTrackFamilyTaskPageView("settings");

  return (
    <FamilyTaskPageShell>
      <ParentFeatureGate featureId="settings">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{t("familyTask.sidebar.settings", "Settings")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("familyTask.settings.empty", "No configurable family task settings are available.")}
          </p>
        </div>
      </ParentFeatureGate>
    </FamilyTaskPageShell>
  );
}
