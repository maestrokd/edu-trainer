import { BookOpen, Home } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import type { BibleBookshelfGroup } from "../data/learning-groups";
import { useBibleBookshelfGame } from "../hooks/useBibleBookshelfGame";
import { BibleBookshelfPlay } from "./BibleBookshelfPlay";
import { BibleBookshelfSetup } from "./BibleBookshelfSetup";

export function BibleBookshelfGame() {
  const { t } = useTranslation();
  const game = useBibleBookshelfGame();
  const setupHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousPhaseRef = useRef(game.state.phase);

  useEffect(() => {
    if (previousPhaseRef.current === game.state.phase) return;
    previousPhaseRef.current = game.state.phase;
    if (game.state.phase !== "setup") return;

    const timeout = window.setTimeout(() => setupHeadingRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timeout);
  }, [game.state.phase]);

  const getGroupLabel = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.label`);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-amber-50/80 via-background to-sky-50/60 text-foreground dark:from-amber-950/20 dark:via-background dark:to-sky-950/20">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span>{t("bibleBookshelf.title")}</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/" aria-label={t("bibleBookshelf.aria.mainMenu")}>
              <Home aria-hidden="true" />
              <span className="hidden sm:inline">{t("bibleBookshelf.actions.mainMenu")}</span>
            </Link>
          </Button>
        </div>
      </header>

      {game.state.phase === "setup" ? (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <BibleBookshelfSetup
            config={game.state.config}
            groups={game.data.groups}
            headingRef={setupHeadingRef}
            onBibleLanguageChange={game.actions.setBibleLanguage}
            onModeChange={game.actions.setMode}
            onGroupChange={game.actions.setGroup}
            onTestamentChange={game.actions.setTestament}
            onStart={game.actions.startGame}
            getGroupLabel={getGroupLabel}
          />
        </main>
      ) : (
        <BibleBookshelfPlay game={game} />
      )}
    </div>
  );
}
