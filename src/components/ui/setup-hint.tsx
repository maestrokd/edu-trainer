import { Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SetupHintProps {
  ariaLabel: string;
  children: string;
}

export function SetupHint({ ariaLabel, children }: SetupHintProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="-my-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={ariaLabel}
        >
          <Info className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 max-w-[calc(100vw-2rem)] whitespace-normal p-3 text-xs leading-relaxed text-popover-foreground"
      >
        <p>{children}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
