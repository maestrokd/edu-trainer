import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  CheckSquare,
  Clock,
  Files,
  Gift,
  LayoutDashboard,
  List,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
  Tv,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContent } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { FAMILY_TASK_ROUTES } from "../../constants/routes";
import { canManageFamilyTask } from "../../domain/access";

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
    key: "stars",
    labelKey: "familyTask.sidebar.stars",
    defaultLabel: "Stars",
    path: FAMILY_TASK_ROUTES.rewardsStars,
    icon: Sparkles,
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
    key: "templateCollections",
    labelKey: "familyTask.sidebar.templateCollections",
    defaultLabel: "Template Collections",
    path: FAMILY_TASK_ROUTES.templateCollections,
    icon: Files,
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

  const canManage = useMemo(() => canManageFamilyTask(principal), [principal]);

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

        {canManage && (
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
    [canManage, pathname, t]
  );

  useSidebarContent(content);

  return null;
}
