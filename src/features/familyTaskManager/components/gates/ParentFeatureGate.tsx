import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { FeatureLockedPanel } from "./FeatureLockedPanel";
import { useFamilyTaskAnalytics } from "../../hooks/useFamilyTaskAnalytics";

interface ParentFeatureGateProps {
  children: ReactNode;
  featureId: string;
}

export function ParentFeatureGate({ children, featureId }: ParentFeatureGateProps) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { trackFeatureLockedViewed } = useFamilyTaskAnalytics();
  const isParent = principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false;

  useEffect(() => {
    if (!isParent) {
      trackFeatureLockedViewed(featureId, "parent_only");
    }
  }, [featureId, isParent, trackFeatureLockedViewed]);

  if (isParent) {
    return children;
  }

  return (
    <FeatureLockedPanel
      title={t("familyTask.gates.parentOnlyTitle", "Parent access required")}
      description={t("familyTask.errors.forbidden", "This section is available to parents only.")}
    />
  );
}
