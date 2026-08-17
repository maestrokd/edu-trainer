import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface RabbitFinishedPanelProps {
  score: number;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

export function RabbitFinishedPanel({ score, onPlayAgain, onChangeSettings }: RabbitFinishedPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 p-2 backdrop-blur-sm sm:p-4">
      <section
        className="max-h-full w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl border bg-card p-4 text-center text-card-foreground shadow-xl sm:p-6"
        role="dialog"
        aria-labelledby="rabbit-finished-title"
      >
        <h2 id="rabbit-finished-title" className="text-2xl font-bold">
          {t("rabbitGame.result.title")}
        </h2>
        <p className="text-muted-foreground">{t("rabbitGame.result.finalScore", { score })}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={onPlayAgain}>{t("rabbitGame.result.playAgain")}</Button>
          <Button variant="outline" onClick={onChangeSettings}>
            {t("rabbitGame.menu.changeSettings")}
          </Button>
        </div>
      </section>
    </div>
  );
}
