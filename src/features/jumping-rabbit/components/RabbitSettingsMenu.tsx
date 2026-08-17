import { Settings } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RabbitGamePhase } from "../model/rabbit.types";

interface RabbitSettingsMenuProps {
  phase: RabbitGamePhase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestart?: () => void;
  onChangeSettings?: () => void;
}

export function RabbitSettingsMenu({
  phase,
  open,
  onOpenChange,
  onRestart,
  onChangeSettings,
}: RabbitSettingsMenuProps) {
  const { t } = useTranslation();
  const runInProgress = phase === "playing" || phase === "quiz";
  const showRunActions = phase !== "setup";

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("rabbitGame.aria.menu")}
          className="size-9 bg-background/85 shadow-sm backdrop-blur"
        >
          <Settings className="size-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-2">
            <span>{t("rabbitGame.menu.title")}</span>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageSelector mode={LanguageSelectorMode.ICON} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {showRunActions && (
          <DropdownMenuGroup>
            {runInProgress && (
              <DropdownMenuItem onSelect={() => onOpenChange(false)}>{t("rabbitGame.menu.resume")}</DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => onRestart?.()}>{t("rabbitGame.menu.newGame")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangeSettings?.()}>
              {t("rabbitGame.menu.changeSettings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}

        <DropdownMenuItem asChild>
          <Link to="/">{t("menu.mainMenuLabel")}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
