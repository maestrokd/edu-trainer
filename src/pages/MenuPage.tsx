import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Calculator, Info, Rabbit, Ruler, LayoutGrid, Loader2, AlertTriangle, Search, BookCopy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import MenuApiClient, { type ApiMenuItem, MenuCategory } from "@/services/MenuApiClient";

import { getLocale5 } from "@/lib/i18n-utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useSidebarContent } from "@/contexts/SidebarContext";
import { MenuCard } from "@/components/MenuCard";
import { SubscriptionUpgradeBanner } from "@/components/subscription/SubscriptionUpgradeBanner";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { TenantMembershipRole } from "@/services/AuthService";
import SubscriptionsApiClient from "@/services/SubscriptionsApiClient";

const iconMap: Record<string, LucideIcon> = {
  Calculator,
  Info,
  Rabbit,
  Ruler,
  BookCopy,
  PlusMinus: Calculator, // Using Calculator for math operations as fallback
};

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, principal } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search string
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const locale = getLocale5(i18n);

  const { data: entitlements } = useQuery({
    queryKey: ["entitlements", "menu-upgrade-banner", principal?.id, principal?.activeTenantUuid],
    queryFn: () => SubscriptionsApiClient.fetchEntitlements(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const {
    data: menuData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["menuItems", activeCategory, debouncedSearch, locale],
    queryFn: () =>
      MenuApiClient.retrieveMenu(
        {
          searchString: debouncedSearch,
          category: activeCategory === "all" ? "" : activeCategory,
          type: "",
        },
        0,
        100,
        locale
      ),
  });

  const menuItems = menuData?.content || [];

  const canManageSubscriptions = useMemo(() => {
    if (!principal) return false;

    return (
      principal.activeTenantRole === TenantMembershipRole.OWNER &&
      principal.authorities.includes(Authority.MANAGE_SUBSCRIPTIONS)
    );
  }, [principal]);

  const shouldShowUpgradeBanner = useMemo(() => {
    if (!entitlements?.planName) return false;
    return entitlements.planName === "FREE_TIER" || entitlements.planName === "FREE";
  }, [entitlements?.planName]);

  const shouldShowLoginBanner = !isAuthenticated;

  const categories = useMemo(() => {
    return [
      { key: "all", label: t("menu.categories.all", "All"), icon: LayoutGrid },
      { key: MenuCategory.MATH, label: t("menu.categories.math", "Math"), icon: Calculator },
      { key: MenuCategory.ARCADE, label: t("menu.categories.arcade", "Arcade"), icon: Rabbit },
    ];
  }, [t]);

  // Define sidebar content
  const sidebarContent = useMemo(
    () => (
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("menu.categories.title", "Categories")}
        </SidebarGroupLabel>
        <SidebarMenu className="px-2 space-y-1">
          {categories.map((cat) => (
            <SidebarMenuItem key={cat.key}>
              <SidebarMenuButton
                onClick={() => setActiveCategory(cat.key)}
                isActive={activeCategory === cat.key}
                className="w-full justify-start gap-3 px-3 py-2 rounded-lg transition-colors"
              >
                <cat.icon className="size-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    ),
    [categories, activeCategory, t]
  );

  // Inject sidebar content
  useSidebarContent(sidebarContent);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-8">
        {shouldShowLoginBanner ? (
          <SubscriptionUpgradeBanner
            title={t("pages.menu.upgradeBanner.loginPrompt.title", "Log in to unlock more apps and advanced tools")}
            description={t(
              "pages.menu.upgradeBanner.loginPrompt.description",
              "Log in to get access to more applications, functions, and options."
            )}
            actionLabel={t("menu.user.login", "Log in")}
            actionTo="/login"
          />
        ) : shouldShowUpgradeBanner ? (
          <SubscriptionUpgradeBanner
            title={t("pages.menu.upgradeBanner.title", "Unlock more apps and advanced tools")}
            description={t(
              "pages.menu.upgradeBanner.description",
              "Request a promo code to upgrade and get access to more applications, functions, and options."
            )}
            actionLabel={
              canManageSubscriptions
                ? t("pages.menu.upgradeBanner.actions.openSubscriptions", "Open subscriptions")
                : undefined
            }
            actionTo={canManageSubscriptions ? "/subscriptions" : undefined}
          />
        ) : null}

        <div className="relative group max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder={t("menu.searchPlaceholder", "Search for lessons, games, or topics...")}
            className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/30"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-primary/90">
            {activeCategory === "all"
              ? t("menu.allGames", "Available Games")
              : categories.find((c) => c.key === activeCategory)?.label}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              <p className="text-muted-foreground font-medium animate-pulse">{t("common.loading", "Loading...")}</p>
            </div>
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {t("pages.menu.loadError", "Failed to load menu items. Please try again later.")}
            </AlertDescription>
          </Alert>
        ) : menuItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center space-y-4">
            <div className="size-20 rounded-3xl bg-muted/50 flex items-center justify-center shadow-inner">
              <LayoutGrid className="size-10 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground/80">{t("menu.empty.title", "No games found")}</h3>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                {t("menu.empty.desc", "Try selecting another category or adjusting your search.")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item: ApiMenuItem) => {
              const Icon = iconMap[item.iconKey] || Info;
              return <MenuCard key={item.id} item={item} Icon={Icon} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
