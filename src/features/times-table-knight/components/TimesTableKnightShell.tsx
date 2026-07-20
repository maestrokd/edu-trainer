import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTimesTableKnightController } from "../hooks/useTimesTableKnightController";
import { ResultsCard } from "./Results/ResultsCard";
import { WorldMap } from "./WorldMap/WorldMap";
import { MAX_LEVEL } from "../model/game.constants";
import { SetupScreen } from "./Setup/SetupScreen";
import { GameCanvas } from "./Play/GameCanvas";
import { Hud } from "./Play/Hud";
import { EncounterPanel } from "./Play/EncounterPanel";
import { BossBar } from "./Play/BossBar";

/** Orchestrates setup ↔ play ↔ results around the session controller (§10) */
export function TimesTableKnightShell() {
  const { t } = useTranslation();
  const {
    state,
    config,
    setConfig,
    progress,
    sessionId,
    paused,
    practiceCreatureCount,
    seed,
    bossEmoji,
    events,
    onEngineReady,
    actions,
  } = useTimesTableKnightController();

  const inPlay = state.phase === "playing" || state.phase === "encounter" || state.phase === "boss";

  return (
    <div className="min-h-dvh w-full bg-background flex flex-col p-2 sm:p-4">
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 py-2">
        <h1 className="text-xl sm:text-2xl font-bold">🏰 {t("timesTableKnight.title")}</h1>
        <div className="flex items-center gap-2">
          {inPlay && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={actions.togglePause}
                disabled={state.phase === "encounter"}
                aria-pressed={paused}
              >
                {paused ? t("timesTableKnight.play.resume") : t("timesTableKnight.hud.pause")}
              </Button>
              <Button variant="outline" size="sm" onClick={actions.reset}>
                {t("timesTableKnight.play.quit")}
              </Button>
            </>
          )}
          <Button asChild variant="outline" size="sm" aria-label={t("timesTableKnight.backToMenu")}>
            <Link to="/">{t("timesTableKnight.backToMenu")}</Link>
          </Button>
        </div>
      </header>

      {state.phase === "setup" && (
        <SetupScreen
          config={config}
          onConfigChange={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
          onStart={() => actions.start(config)}
          ownedSkins={progress.ownedSkins}
          wallet={progress.wallet}
          onBuySkin={actions.buySkin}
          worldMapSlot={
            <WorldMap
              stages={progress.stages}
              selectedLevel={config.level}
              onSelect={(level) => setConfig((prev) => ({ ...prev, level }))}
              gameCompleted={progress.gameCompleted}
            />
          }
        />
      )}

      {inPlay && (
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-2">
          <Hud state={state} />
          {state.bossMaxHp > 0 && (state.phase === "boss" || state.returnPhase === "boss") && (
            <BossBar bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} emoji={bossEmoji} />
          )}
          <div className="relative">
            <GameCanvas
              key={sessionId}
              config={state.config}
              practiceCreatureCount={practiceCreatureCount}
              seed={seed}
              events={events}
              onEngineReady={onEngineReady}
            />
            {state.phase === "encounter" && state.encounter && (
              <EncounterPanel
                encounter={state.encounter}
                format={state.config.format}
                onAnswer={actions.submitAnswer}
                isReview={state.encounter.stationId === -2}
              />
            )}
            {paused && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-xl">
                <Card>
                  <CardContent className="p-6 flex flex-col items-center gap-3">
                    <span className="text-lg font-semibold">⏸ {t("timesTableKnight.play.paused")}</span>
                    <Button onClick={actions.togglePause}>{t("timesTableKnight.play.resume")}</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {state.phase === "results" && (
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4">
          <ResultsCard
            state={state}
            onRetry={actions.retry}
            onBackToSetup={actions.reset}
            onNextStage={
              state.config.mode === "adventure" && state.config.level < MAX_LEVEL ? actions.nextStage : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
