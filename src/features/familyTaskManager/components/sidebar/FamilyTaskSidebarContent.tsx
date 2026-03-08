import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  CalendarCheck,
  CheckSquare,
  Clock,
  Gift,
  LayoutDashboard,
  List,
  Mail,
  RefreshCw,
  Settings,
  Star,
  Tv,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContent } from "@/contexts/SidebarContext";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { FAMILY_TASK_ROUTES } from "../../constants/routes";

interface FamilyNavItem {
  key: string;
  labelKey: string;
  defaultLabel: string;
  path: string;
  icon: typeof LayoutDashboard;
  parentOnly?: boolean;
}

const primaryNavItems: FamilyNavItem[] = [
  {
    key: "dashboard",
    labelKey: "familyTask.sidebar.dashboard",
    defaultLabel: "Dashboard",
    path: FAMILY_TASK_ROUTES.root,
    icon: LayoutDashboard,
  },
  {
    key: "today",
    labelKey: "familyTask.sidebar.today",
    defaultLabel: "Today",
    path: FAMILY_TASK_ROUTES.today,
    icon: CalendarCheck,
  },
  {
    key: "calendar",
    labelKey: "familyTask.sidebar.calendar",
    defaultLabel: "Calendar",
    path: FAMILY_TASK_ROUTES.calendar,
    icon: Calendar,
  },
  {
    key: "rewards",
    labelKey: "familyTask.sidebar.rewards",
    defaultLabel: "Rewards",
    path: FAMILY_TASK_ROUTES.rewards,
    icon: Star,
  },
  {
    key: "lists",
    labelKey: "familyTask.sidebar.lists",
    defaultLabel: "Lists",
    path: FAMILY_TASK_ROUTES.lists,
    icon: List,
  },
  {
    key: "display",
    labelKey: "familyTask.sidebar.display",
    defaultLabel: "Display",
    path: FAMILY_TASK_ROUTES.display,
    icon: Tv,
  },
];

const parentNavItems: FamilyNavItem[] = [
  {
    key: "chores",
    labelKey: "familyTask.sidebar.chores",
    defaultLabel: "Chores",
    path: FAMILY_TASK_ROUTES.chores,
    icon: CheckSquare,
    parentOnly: true,
  },
  {
    key: "routines",
    labelKey: "familyTask.sidebar.routines",
    defaultLabel: "Routines",
    path: FAMILY_TASK_ROUTES.routines,
    icon: RefreshCw,
    parentOnly: true,
  },
  {
    key: "approvals",
    labelKey: "familyTask.sidebar.approvals",
    defaultLabel: "Approvals",
    path: FAMILY_TASK_ROUTES.approvals,
    icon: Clock,
    parentOnly: true,
  },
  {
    key: "redemptions",
    labelKey: "familyTask.sidebar.redemptions",
    defaultLabel: "Redemptions",
    path: FAMILY_TASK_ROUTES.rewardsRedemptions,
    icon: Gift,
    parentOnly: true,
  },
  {
    key: "profiles",
    labelKey: "familyTask.sidebar.profiles",
    defaultLabel: "Profiles",
    path: FAMILY_TASK_ROUTES.profiles,
    icon: Users,
    parentOnly: true,
  },
  {
    key: "invitations",
    labelKey: "familyTask.sidebar.invitations",
    defaultLabel: "Invitations",
    path: FAMILY_TASK_ROUTES.invitations,
    icon: Mail,
    parentOnly: true,
  },
  {
    key: "devices",
    labelKey: "familyTask.sidebar.devices",
    defaultLabel: "Devices",
    path: FAMILY_TASK_ROUTES.devices,
    icon: Tv,
    parentOnly: true,
  },
  {
    key: "settings",
    labelKey: "familyTask.sidebar.settings",
    defaultLabel: "Settings",
    path: FAMILY_TASK_ROUTES.settings,
    icon: Settings,
    parentOnly: true,
  },
];

export function FamilyTaskSidebarContent() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { pathname } = useLocation();

  const isParent = useMemo(() => principal?.authorities?.includes(Authority.MANAGE_PROFILES) ?? false, [principal]);

  const content = useMemo(
    () => (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>{t("familyTask.sidebar.title", "Family Tasks")}</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
            {primaryNavItems.map(({ key, labelKey, defaultLabel, path, icon: Icon }) => {
              const isActive = path === FAMILY_TASK_ROUTES.root ? pathname === path : pathname.startsWith(path);

              return (
                <Link
                  key={key}
                  to={path}
                  className={cn(
                    "group/nav-item flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border",
                      isActive
                        ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                        : "border-sidebar-border bg-sidebar"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                    {t(labelKey, defaultLabel)}
                  </span>
                </Link>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>

        {isParent && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("familyTask.sidebar.management", "Management")}</SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {parentNavItems.map(({ key, labelKey, defaultLabel, path, icon: Icon }) => {
                const isActive = pathname.startsWith(path);

                return (
                  <Link
                    key={key}
                    to={path}
                    className={cn(
                      "group/nav-item flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all",
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/70"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border",
                        isActive
                          ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                          : "border-sidebar-border bg-sidebar"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                      {t(labelKey, defaultLabel)}
                    </span>
                  </Link>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </>
    ),
    [isParent, pathname, t]
  );

  useSidebarContent(content);

  return null;
}
