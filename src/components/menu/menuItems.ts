import type {LucideIcon} from "lucide-react";
import {Calculator, Info, Rabbit, Ruler,} from "lucide-react";

export type CategoryKey = "math" | "arcade" | "info";

export type GameItem = {
    id: string;
    path: string;
    titleKey: string;         // i18n key e.g., "games.multiplication1.title"
    descriptionKey?: string;  // i18n key
    category: CategoryKey;
    icon: LucideIcon;
    badge?: "new" | "beta" | null;
    tags?: string[];          // used by Command palette search
};

export const categories: Record<CategoryKey, { labelKey: string; icon: LucideIcon }> = {
    math: {labelKey: "menu.categories.math", icon: Calculator},
    arcade: {labelKey: "menu.categories.arcade", icon: Rabbit},
    info: {labelKey: "menu.categories.info", icon: Info},
};

export const games: GameItem[] = [
    {
        id: "mt1",
        path: "/multiplication-trainer1",
        titleKey: "games.multiplication1.title",
        descriptionKey: "games.multiplication1.desc",
        category: "math",
        icon: Calculator,
        tags: ["multiplication", "таблиця множення", "множення", "умножение", "таблица"],
    },
    {
        id: "mt2",
        path: "/multiplication-trainer2",
        titleKey: "games.multiplication2.title",
        descriptionKey: "games.multiplication2.desc",
        category: "math",
        icon: Calculator,
        badge: "beta",
        tags: ["multiplication", "множення", "умножение"],
    },
    {
        id: "round1",
        path: "/rounding-trainer",
        titleKey: "games.rounding1.title",
        descriptionKey: "games.rounding1.desc",
        category: "math",
        icon: Ruler,
        tags: ["rounding", "округлення", "округление"],
    },
    {
        id: "round2",
        path: "/rounding-trainer2",
        titleKey: "games.rounding2.title",
        descriptionKey: "games.rounding2.desc",
        category: "math",
        icon: Ruler,
        tags: ["rounding"],
    },
    {
        id: "rabbit",
        path: "/multiplication-rabbit",
        titleKey: "games.rabbit.title",
        descriptionKey: "games.rabbit.desc",
        category: "arcade",
        icon: Rabbit,
        badge: "new",
        tags: ["rabbit", "jump", "arcade"],
    },
];

export const infoLinks: GameItem[] = [
    {
        id: "about",
        path: "/about",
        titleKey: "menu.about",
        category: "info",
        icon: Info,
    },
];
