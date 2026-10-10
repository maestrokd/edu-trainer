import * as React from "react";
import { Command, FileText, LifeBuoy, LogIn, Send, ShieldCheck, SquareTerminal } from "lucide-react";
import { NavUser } from "@/components/sidebar/nav-user.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { Link } from "react-router-dom";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { useTranslation } from "react-i18next";
import { Authority } from "@/contexts/AuthContext.tsx";

const supportNavigation = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { sidebarContent } = useSidebarContext();
  const secondaryNavigation = React.useMemo(
    () => [
      ...supportNavigation,
      {
        title: t("legal.documents.terms"),
        url: "/terms",
        icon: FileText,
        openInNewTab: true,
      },
      {
        title: t("legal.documents.privacy"),
        url: "/privacy",
        icon: ShieldCheck,
        openInNewTab: true,
      },
    ],
    [t]
  );

  const user = React.useMemo(() => {
    if (!principal) return null;
    return {
      name:
        principal.firstName && principal.lastName ? `${principal.firstName} ${principal.lastName}` : principal.username,
      email: principal.email || principal.username,
      avatar: "", // TODO: Add avatar to principal or profile
      authorities: principal.authorities,
      activeTenantName: principal.activeTenantName,
      activeTenantRole: principal.activeTenantRole,
    };
  }, [principal]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t("menu.title")}</span>
                  <span className="truncate text-xs">{t("menu.home")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("menu.home")}>
              <Link to="/">
                <SquareTerminal />
                <span>{t("menu.home")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {principal?.authorities?.includes(Authority.FAMILY_TASK_MANAGER) && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("familyTask.sidebar.title", "Family Tasks")}>
                <Link to="/family-tasks">
                  <Command />
                  <span>{t("familyTask.sidebar.title", "Family Tasks")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Dynamic Content */}
        {sidebarContent}

        {/* Secondary navigation is pushed to the bottom of the content area. */}
        <NavSecondary items={secondaryNavigation} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link to="/login">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <LogIn className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{t("menu.user.login")}</span>
                    <span className="truncate text-xs">{t("menu.user.loginDesc")}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
