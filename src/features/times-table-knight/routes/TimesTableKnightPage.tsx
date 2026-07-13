import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimesTableKnightShell } from "../components/TimesTableKnightShell";
import { CapabilityGate } from "../slots/CapabilityGate";
import { LoginSuggestionSlot } from "../slots/LoginSuggestionSlot";
import { UpgradeSuggestionSlot } from "../slots/UpgradeSuggestionSlot";

function PremiumGateCard() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh w-full bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl" aria-hidden>
            🏰
          </span>
          <h1 className="text-xl font-bold">{t("timesTableKnight.gate.premiumTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("timesTableKnight.gate.premiumDesc")}</p>
          <div className="flex gap-2">
            <LoginSuggestionSlot />
            <UpgradeSuggestionSlot />
            <Button asChild variant="outline">
              <Link to="/">{t("timesTableKnight.backToMenu")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TimesTableKnightPage() {
  return (
    <CapabilityGate capability="canPlayTimesTableKnight" fallback={<PremiumGateCard />}>
      <TimesTableKnightShell />
    </CapabilityGate>
  );
}
