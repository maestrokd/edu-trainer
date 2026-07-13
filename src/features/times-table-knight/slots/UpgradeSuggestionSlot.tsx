import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCapabilityAccess } from "../hooks/useCapabilityAccess";

/** shown to logged-in non-subscribers inside the premium gate */
export function UpgradeSuggestionSlot() {
  const { t } = useTranslation();
  const { tier } = useCapabilityAccess();
  if (tier !== "authenticated_free") return null;

  return (
    <Button asChild>
      <Link to="/subscriptions">{t("timesTableKnight.gate.upgradeCta")}</Link>
    </Button>
  );
}
