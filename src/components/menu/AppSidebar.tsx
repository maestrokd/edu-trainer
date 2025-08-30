import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import {ScrollArea} from "@/components/ui/scroll-area";
import {categories, type CategoryKey, infoLinks} from "./menuItems";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";

type Props = {
    activeCategory: CategoryKey | "all";
    onSelectCategory: (c: CategoryKey | "all") => void;
};

export default function AppSidebar({activeCategory, onSelectCategory}: Props) {
    const {t} = useTranslation();

    return (
        <Sidebar aria-label={t("menu.sidebarLabel") ?? "Games"}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t("menu.categories.title")}</SidebarGroupLabel>
                    <div className="flex gap-2 px-2">
                        <SidebarMenuButton
                            asChild
                            data-active={activeCategory === "all"}
                            onClick={() => onSelectCategory("all")}
                        >
                            <button
                                className="w-full data-[active=true]:bg-primary/10 rounded-md px-2 py-1 text-sm">{t("menu.categories.all")}</button>
                        </SidebarMenuButton>
                    </div>
                    <SidebarMenu>
                        {(Object.keys(categories) as CategoryKey[]).map((key) => {
                            const CatIcon = categories[key].icon;
                            const active = activeCategory === key;
                            return (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton asChild data-active={active}
                                                       onClick={() => onSelectCategory(key)}>
                                        <button
                                            className="w-full flex items-center gap-2 data-[active=true]:bg-primary/10 rounded-md px-2 py-1">
                                            <CatIcon className="size-4" aria-hidden/>
                                            <span className="text-sm">{t(categories[key].labelKey)}</span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>{t("menu.info")}</SidebarGroupLabel>
                    <SidebarMenu>
                        {infoLinks.map((it) => (
                            <SidebarMenuItem key={it.id}>
                                <SidebarMenuButton asChild>
                                    <Link to={it.path} className="flex items-center gap-2">
                                        <it.icon className="size-4" aria-hidden/>
                                        <span className="text-sm">{t(it.titleKey)}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                <ScrollArea className="mt-2 h-[30dvh] px-2">
                    {/* future: Favorites / Recent lists go here */}
                    <p className="text-xs text-muted-foreground px-2 pb-4">{t("menu.futureSectionsHint")}</p>
                </ScrollArea>
            </SidebarContent>
        </Sidebar>
    );
}
