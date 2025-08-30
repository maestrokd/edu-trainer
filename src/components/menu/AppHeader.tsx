import {SidebarTrigger} from "@/components/ui/sidebar";
import {Button} from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import CommandMenu from "./CommandMenu";
import {useTranslation} from "react-i18next";
import LanguageSelector, {LanguageSelectorMode} from "@/components/lang/LanguageSelector";

export default function AppHeader() {
    const {t} = useTranslation();

    return (
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden"/>
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded bg-primary/10" aria-hidden/>
                    <span className="text-lg font-semibold leading-none">{t("menu.title")}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", {
                        key: "k",
                        ctrlKey: !/Mac/i.test(navigator.platform),
                        metaKey: /Mac/i.test(navigator.platform)
                    }))}
                >
                    ⌘K
                    <span className="sr-only">{t("menu.search")}</span>
                </Button>
                <LanguageSelector mode={LanguageSelectorMode.FULL}/>
                <ThemeToggle/>
                <CommandMenu/>
            </div>
        </header>
    );
}
