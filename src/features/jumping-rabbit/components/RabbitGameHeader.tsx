import { RabbitSettingsMenu } from "./RabbitSettingsMenu";
import type { RabbitGamePhase } from "../model/rabbit.types";

interface RabbitGameHeaderProps {
  title: string;
  setupLabel: string;
  scoreLabel: string;
  phase: RabbitGamePhase;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onChangeSettings: () => void;
}

export function RabbitGameHeader({
  title,
  setupLabel,
  scoreLabel,
  phase,
  menuOpen,
  onMenuOpenChange,
  onRestart,
  onChangeSettings,
}: RabbitGameHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">{title}</span>
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">
        {phase === "setup" ? setupLabel : scoreLabel}
      </span>
      <RabbitSettingsMenu
        phase={phase}
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
        onRestart={onRestart}
        onChangeSettings={onChangeSettings}
      />
    </header>
  );
}
