import { useTranslation } from "react-i18next";
import { RabbitGameHeader } from "../components/RabbitGameHeader";
import { RabbitPlayScreen } from "../components/RabbitPlayScreen";
import { RabbitSetupScreen } from "../components/RabbitSetupScreen";
import { useRabbitGameController } from "../hooks/useRabbitGameController";

export function JumpingRabbitPage() {
  const { t } = useTranslation();
  const { state, actions } = useRabbitGameController();

  return (
    <div className="flex h-dvh min-h-[420px] w-full flex-col gap-3 overflow-hidden bg-background p-2 text-foreground sm:gap-4 sm:p-4">
      <RabbitGameHeader
        title={t("rabbitGame.title")}
        setupLabel={t("rabbitGame.setup.label")}
        scoreLabel={t("rabbitGame.score", { score: state.score })}
        phase={state.phase}
        menuOpen={state.menuOpen}
        onMenuOpenChange={actions.setMenuOpen}
        onRestart={actions.restartRun}
        onChangeSettings={actions.returnToSetup}
      />

      {state.phase === "setup" ? (
        <RabbitSetupScreen config={state.config} onConfigChange={actions.updateConfig} onStart={actions.startRun} />
      ) : (
        <RabbitPlayScreen
          state={state}
          onScoreChange={actions.setScore}
          onQuizRequested={actions.startQuiz}
          onAnswer={actions.submitAnswer}
          onFinished={actions.finishRun}
          onMessage={actions.showMessage}
          onPlayAgain={actions.restartRun}
          onChangeSettings={actions.returnToSetup}
        />
      )}
    </div>
  );
}
