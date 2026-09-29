import type { ReactNode } from "react";
import { PowersOfTenTrainerHeader } from "./PowersOfTenTrainerHeader";

interface Props extends React.ComponentProps<typeof PowersOfTenTrainerHeader> {
  children: ReactNode;
}

export function PowersOfTenTrainerShell({ children, ...headerProps }: Props) {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-background bg-gradient-to-br p-2 sm:p-4">
      <div className="flex h-full min-h-0 w-full flex-col gap-3 sm:gap-4">
        <PowersOfTenTrainerHeader {...headerProps} />
        {children}
      </div>
    </div>
  );
}
