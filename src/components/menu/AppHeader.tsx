import React from "react";
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Button} from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import CommandMenu from "./CommandMenu";
import {useTranslation} from "react-i18next";
import LanguageSelector, {LanguageSelectorMode} from "@/components/lang/LanguageSelector";

function useKeyboardShortcutSupport() {
    const [isSupported, setIsSupported] = React.useState(false);

    React.useEffect(() => {
        const userAgent = navigator.userAgent || "";
        const isMobileAgent = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
        const isMobileDevice = navigator.userAgentData?.mobile ?? isMobileAgent;

        setIsSupported(!isMobileDevice);
    }, []);

    return isSupported;
}

export default function AppHeader() {
    const {t} = useTranslation();
    const [isMac, setIsMac] = React.useState(false);
    const supportsShortcut = useKeyboardShortcutSupport();

    React.useEffect(() => {
        const platform = navigator.platform || "";
        setIsMac(/mac/i.test(platform));
    }, []);

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
                {supportsShortcut && (
                    <Button
                        variant="outline"
                        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", {
                            key: "k",
                            ctrlKey: !isMac,
                            metaKey: isMac
                        }))}
                    >
                        {isMac ? "⌘K" : "Ctrl+K"}
                        <span className="sr-only">{t("menu.search")}</span>
                    </Button>
                )}
                <LanguageSelector mode={LanguageSelectorMode.FULL}/>
                <ThemeToggle/>
                {supportsShortcut && <CommandMenu/>}
            </div>
        </header>
    );
}
