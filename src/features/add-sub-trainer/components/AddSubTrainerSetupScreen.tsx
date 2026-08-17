import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { OperationsCard } from "./Setup/OperationsCard";
import { SessionOptionsCard } from "./Setup/SessionOptionsCard";
import type { AddSubTrainerSetupController } from "./Setup/setup.types";

export function AddSubTrainerSetupScreen({ controller }: { controller: AddSubTrainerSetupController }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars) as string;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto sm:rounded-2xl sm:bg-muted/50 sm:p-5 sm:shadow-lg sm:backdrop-blur md:p-8">
      <p className="hidden text-sm text-muted-foreground sm:block">{tr("setup.intro")}</p>

      <div className="grid gap-4 sm:mt-5 md:grid-cols-2 md:gap-0">
        <OperationsCard controller={controller} />
        <SessionOptionsCard controller={controller} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:justify-end">
        <Button
          onClick={controller.actions.startGame}
          className="h-10 w-full sm:w-auto"
          disabled={!controller.canStart}
        >
          {tr("start")}
        </Button>
        <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
          <Link to="/" aria-label={t("menu.mainMenuLabel") || undefined}>
            {t("menu.mainMenuLabel")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
