import * as React from "react";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import AppHeader from "@/components/menu/AppHeader";
import AppSidebar from "@/components/menu/AppSidebar";
import GameCard from "@/components/menu/GameCard";
import {categories, type CategoryKey, games} from "@/components/menu/menuItems";
import {useTranslation} from "react-i18next";

export default function MenuPage() {
    const {t} = useTranslation();
    const [category, setCategory] = React.useState<CategoryKey | "all">("all");

    const visibleGames = games.filter((g) => category === "all" || g.category === category);

    return (
        <div
            className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
            <SidebarProvider>
                <AppSidebar activeCategory={category} onSelectCategory={setCategory}/>
                <SidebarInset>
                    <AppHeader/>
                    <div className="max-w-6xl mx-auto w-full px-4 py-4">
                        <div
                            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-4 md:p-6 border shadow">
                            {/* Continue section (mock) */}
                            <section aria-labelledby="continue-title" className="mb-6">
                                <h2 id="continue-title" className="text-base font-semibold mb-2">
                                    {t("menu.continue")}
                                </h2>
                                <p className="text-sm text-muted-foreground">{t("menu.continueEmpty")}</p>
                            </section>

                            {/* Category heading */}
                            <section aria-labelledby="games-title">
                                <h2 id="games-title" className="text-base font-semibold mb-3">
                                    {category === "all" ? t("menu.allGames") : t(categories[category].labelKey)}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                    {visibleGames.map((g) => (
                                        <GameCard key={g.id} game={g}/>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
