import * as React from "react";
import {Moon, Sun} from "lucide-react";
import {Button} from "@/components/ui/button";

const THEME_KEY = "edu.theme";

function getInitial(): "light" | "dark" {
    const saved = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
    const [theme, setTheme] = React.useState<"light" | "dark">(getInitial);

    React.useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") root.classList.add("dark");
        else root.classList.remove("dark");
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
            {theme === "dark" ? <Sun className="size-5"/> : <Moon className="size-5"/>}
        </Button>
    );
}
