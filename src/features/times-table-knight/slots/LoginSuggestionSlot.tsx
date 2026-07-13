import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCapabilityAccess } from "../hooks/useCapabilityAccess";

/** shown to guests inside the premium gate: log in first */
export function LoginSuggestionSlot() {
  const { t } = useTranslation();
  const { tier } = useCapabilityAccess();
  if (tier !== "guest") return null;

  return (
    <Button asChild>
      <Link to="/login">{t("timesTableKnight.gate.loginCta")}</Link>
    </Button>
  );
}
