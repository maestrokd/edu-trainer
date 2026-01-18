import React, { type ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "@/components/sidebar/app-sidebar.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { BreadcrumbComponent } from "@/components/BreadcrumbComponent.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import LanguageSelector, {
  LanguageSelectorMode,
} from "@/components/lang/LanguageSelector.tsx";
import { ModeToggle } from "@/components/theme/mode-toggle.tsx";
import { TelegramHeaderProvider } from "@/layout/TelegramHeader";

interface LayoutProps {
  children: ReactNode;
}

const WebLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <TelegramHeaderProvider contentWrapperClassName="max-w-none px-4">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between px-4">
            {/* Left: Sidebar trigger + breadcrumb */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <BreadcrumbComponent />
            </div>

            {/* Right: Language marker + dropdown */}
            <div className="flex items-center gap-2">
              <LanguageSelector mode={LanguageSelectorMode.FULL} />
              <ModeToggle />
            </div>
          </header>
          <main>{children}</main>
          <Toaster position="top-center" />
        </SidebarInset>
      </SidebarProvider>
    </TelegramHeaderProvider>
  );
};

export default WebLayout;
