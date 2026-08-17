import { RabbitSettingsMenu } from "./RabbitSettingsMenu";

interface RabbitGameHeaderProps {
  title: string;
  setupLabel: string;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

export function RabbitGameHeader({ title, setupLabel, menuOpen, onMenuOpenChange }: RabbitGameHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">{title}</span>
      <span className="text-xs font-medium text-muted-foreground sm:text-sm">{setupLabel}</span>
      <RabbitSettingsMenu phase="setup" open={menuOpen} onOpenChange={onMenuOpenChange} />
    </header>
  );
}
