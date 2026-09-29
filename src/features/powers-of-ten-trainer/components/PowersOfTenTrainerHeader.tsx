import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/theme/mode-toggle";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector";

interface Props {
  isPlayScreen: boolean;
  summary: string | null;
  showHistory: boolean;
  onToggleHistory: () => void;
  onNewSession: () => void;
  onBackToSetup: () => void;
  labels: {
    title: string;
    setup: string;
    menu: string;
    newSession: string;
    changeSetup: string;
    showHistory: string;
    mainMenu: string;
  };
}

export function PowersOfTenTrainerHeader({
  isPlayScreen,
  summary,
  showHistory,
  onToggleHistory,
  onNewSession,
  onBackToSetup,
  labels,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">{labels.title}</span>
      <span className="text-center text-[10px] text-muted-foreground sm:text-xs">
        {isPlayScreen ? summary : labels.setup}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={labels.menu} className="size-8">
            <Settings className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between gap-2">
              <span>{labels.menu}</span>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <LanguageSelector mode={LanguageSelectorMode.ICON} />
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {isPlayScreen && (
              <>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <div className="flex w-full items-center justify-between">
                    <Label htmlFor="powers-history-toggle">{labels.showHistory}</Label>
                    <Switch id="powers-history-toggle" checked={showHistory} onCheckedChange={onToggleHistory} />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onNewSession}>{labels.newSession}</DropdownMenuItem>
                <DropdownMenuItem onSelect={onBackToSetup}>{labels.changeSetup}</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/">{labels.mainMenu}</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
