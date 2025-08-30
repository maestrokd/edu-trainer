import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {DialogTitle} from "@/components/ui/dialog";
import {games, infoLinks} from "./menuItems";
import {useNavigate} from "react-router";
import {useTranslation} from "react-i18next";

export default function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const nav = useNavigate();
    const {t} = useTranslation();

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const items = [...games, ...infoLinks];

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <DialogTitle className="sr-only">{t("menu.search")}</DialogTitle>
            <CommandInput placeholder={t("menu.searchPlaceholder") ?? "Search games…"}/>
            <CommandList>
                <CommandEmpty>{t("menu.noResults")}</CommandEmpty>

                <CommandGroup heading={t("menu.allGames")}>
                    {items.map((g) => (
                        <CommandItem
                            key={g.id}
                            keywords={g.tags}
                            onSelect={() => {
                                setOpen(false);
                                nav(g.path);
                            }}
                            aria-label={t(g.titleKey)}
                        >
                            {t(g.titleKey)}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
