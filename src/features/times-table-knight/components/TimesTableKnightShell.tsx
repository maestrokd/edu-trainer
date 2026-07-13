import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { GameConfig } from "../model/game.types";
import { DEFAULT_CONFIG } from "../model/game.constants";
import { SetupScreen } from "./Setup/SetupScreen";

/**
 * Orchestrates setup ↔ play ↔ results.
 * The play/results screens arrive with the engine and session reducer commits;
 * until then starting a quest shows a placeholder.
 */
export function TimesTableKnightShell() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-dvh w-full bg-background flex flex-col p-2 sm:p-4">
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2 py-2">
        <h1 className="text-xl sm:text-2xl font-bold">🏰 {t("timesTableKnight.title")}</h1>
        <Button asChild variant="outline" size="sm" aria-label={t("timesTableKnight.backToMenu")}>
          <Link to="/">{t("timesTableKnight.backToMenu")}</Link>
        </Button>
      </header>

      {started ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{t("timesTableKnight.play.getReady")}</p>
          <Button variant="outline" onClick={() => setStarted(false)}>
            {t("timesTableKnight.backToMenu")}
          </Button>
        </div>
      ) : (
        <SetupScreen
          config={config}
          onConfigChange={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
          onStart={() => setStarted(true)}
        />
      )}
    </div>
  );
}
