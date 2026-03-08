import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FamilyTaskSidebarContent } from "../sidebar/FamilyTaskSidebarContent";

interface FamilyTaskPageShellProps {
  children: ReactNode;
  className?: string;
}

export function FamilyTaskPageShell({ children, className }: FamilyTaskPageShellProps) {
  return (
    <>
      <FamilyTaskSidebarContent />
      <div className={cn("w-full min-w-0", className ?? "p-6")}>{children}</div>
    </>
  );
}
