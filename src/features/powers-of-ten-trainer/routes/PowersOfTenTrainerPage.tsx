import React from "react";
import { useTranslation } from "react-i18next";
import { formatDecimal, parseDecimalInput } from "../lib/decimal";
import { selectedPowers } from "../lib/config";
import type { DecimalValue } from "../model/trainer.types";
import { usePowersOfTenTrainerController } from "../hooks/usePowersOfTenTrainerController";
import { PowersOfTenTrainerPlayScreen } from "../components/PowersOfTenTrainerPlayScreen";
import { PowersOfTenTrainerSetupScreen } from "../components/PowersOfTenTrainerSetupScreen";
import { PowersOfTenTrainerShell } from "../components/PowersOfTenTrainerShell";

export function PowersOfTenTrainerPage() {
  const { t, i18n } = useTranslation();
  const controller = usePowersOfTenTrainerController();
  const { state, actions } = controller;
  const [inputValue, setInputValue] = React.useState("");
  const [showHistory, setShowHistory] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat(i18n.language || undefined), [i18n.language]);
  const formatValue = React.useCallback(
    (value: DecimalValue, preserveScale = false) => formatDecimal(value, i18n.language, preserveScale),
    [i18n.language]
  );
  const formatInteger = React.useCallback((value: number) => numberFormatter.format(value), [numberFormatter]);

  React.useEffect(() => {
    setInputValue("");
    if (state.screen === "play" && state.config.answerMode === "input" && !state.gameOver) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [state.config.answerMode, state.currentTask?.taskId, state.gameOver, state.screen]);

  const submitInput = React.useCallback(() => {
    const parsed = parseDecimalInput(inputValue);
    if (!parsed) {
      inputRef.current?.focus();
      return;
    }
    if (actions.submitAnswer(parsed)) setInputValue("");
  }, [actions, inputValue]);

  const powers = selectedPowers(state.config);
  const summary =
    state.screen === "play"
      ? t("powersTenT.summary", {
          min: powers[0],
          max: powers[powers.length - 1],
          accuracy: controller.accuracy,
        })
      : null;

  return (
    <PowersOfTenTrainerShell
      isPlayScreen={state.screen === "play"}
      summary={summary}
      showHistory={showHistory}
      onToggleHistory={() => setShowHistory((value) => !value)}
      onNewSession={actions.newSession}
      onBackToSetup={actions.backToSetup}
      labels={{
        title: t("powersTenT.title"),
        setup: t("powersTenT.setup.label"),
        menu: t("powersTenT.menu"),
        newSession: t("powersTenT.newSession"),
        changeSetup: t("powersTenT.changeSetup"),
        showHistory: t("powersTenT.showHistory"),
        mainMenu: t("menu.mainMenuLabel"),
      }}
    >
      {state.screen === "setup" ? (
        <PowersOfTenTrainerSetupScreen
          config={state.config}
          canStart={controller.canStart}
          onConfigChange={actions.updateConfig}
          onStart={actions.startGame}
        />
      ) : (
        <PowersOfTenTrainerPlayScreen
          state={state}
          accuracy={controller.accuracy}
          totalAnswered={controller.totalAnswered}
          elapsedSec={controller.elapsedSec}
          showHistory={showHistory}
          inputValue={inputValue}
          inputRef={inputRef}
          formatValue={formatValue}
          formatInteger={formatInteger}
          onInputChange={setInputValue}
          onInputSubmit={submitInput}
          onAnswer={actions.submitAnswer}
        />
      )}
    </PowersOfTenTrainerShell>
  );
}
