import { useTranslation } from "react-i18next";
import { RabbitGameHeader } from "../components/RabbitGameHeader";
import { RabbitPlayScreen } from "../components/RabbitPlayScreen";
import { RabbitSetupScreen } from "../components/RabbitSetupScreen";
import { useRabbitGameController } from "../hooks/useRabbitGameController";

export function JumpingRabbitPage() {
  const { t } = useTranslation();
  const { state, actions } = useRabbitGameController();

  if (state.phase !== "setup") {
    return (
      <RabbitPlayScreen
        state={state}
        onScoreChange={actions.setScore}
        onQuizRequested={actions.startQuiz}
        onAnswer={actions.submitAnswer}
        onFinished={actions.finishRun}
        onMessage={actions.showMessage}
        onPlayAgain={actions.restartRun}
        onChangeSettings={actions.returnToSetup}
        onMenuOpenChange={actions.setMenuOpen}
      />
    );
  }

  return (
    <div className="flex h-dvh min-h-[420px] w-full flex-col gap-3 overflow-hidden bg-background p-2 text-foreground sm:gap-4 sm:p-4">
      <RabbitGameHeader
        title={t("rabbitGame.title")}
        setupLabel={t("rabbitGame.setup.label")}
        menuOpen={state.menuOpen}
        onMenuOpenChange={actions.setMenuOpen}
      />
      <RabbitSetupScreen config={state.config} onConfigChange={actions.updateConfig} onStart={actions.startRun} />
    </div>
  );
}
