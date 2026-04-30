import { type ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { FeatureLockedPanel } from "./FeatureLockedPanel";
import { useFamilyTaskAnalytics } from "../../hooks/useFamilyTaskAnalytics";
import { canManageFamilyTask } from "../../domain/access";

interface ParentFeatureGateProps {
  children: ReactNode;
  featureId: string;
}

export function ParentFeatureGate({ children, featureId }: ParentFeatureGateProps) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { trackFeatureLockedViewed } = useFamilyTaskAnalytics();
  const canManage = canManageFamilyTask(principal);

  useEffect(() => {
    if (!canManage) {
      trackFeatureLockedViewed(featureId, "parent_only");
    }
  }, [canManage, featureId, trackFeatureLockedViewed]);

  if (canManage) {
    return children;
  }

  return (
    <FeatureLockedPanel
      title={t("familyTask.gates.parentOnlyTitle", "Parent or owner access required")}
      description={t("familyTask.errors.forbidden", "This section is available to owners and parents only.")}
    />
  );
}
