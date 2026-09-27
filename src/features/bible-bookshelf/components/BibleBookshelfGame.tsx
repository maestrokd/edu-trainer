import { BookOpen, Home, Info, Languages, Sprout } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { BibleBookshelfGroup } from "../data/learning-groups";
import { useBibleBookshelfGame } from "../hooks/useBibleBookshelfGame";
import { BibleBookshelfPlay } from "./BibleBookshelfPlay";
import { BibleBookshelfSetup } from "./BibleBookshelfSetup";

const LANGUAGE_NAMES = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
} as const;

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
  const getGroupTip = (group: BibleBookshelfGroup) => t(`bibleBookshelf.groups.${group.translationKey}.tip`);
  const isFullTestament = game.state.config.mode === "testament";
  const testamentKey = game.state.config.testament === "OLD" ? "old" : "new";
  const scopeLabel = isFullTestament
    ? t(`bibleBookshelf.setup.testament.${testamentKey}.name`)
    : getGroupLabel(game.data.selectedGroup);
  const scopeDescription = isFullTestament
    ? t("bibleBookshelf.testament.description", { count: game.state.roundBookIds.length })
    : t("bibleBookshelf.groups.range", {
        start: game.data.selectedGroupBooks[0]?.name ?? "",
        end: game.data.selectedGroupBooks.at(-1)?.name ?? "",
      });
  const learningTip = isFullTestament
    ? t(`bibleBookshelf.testament.${testamentKey}Tip`, {
        first: game.data.selectedTestamentBooks[0]?.name ?? "",
        last: game.data.selectedTestamentBooks.at(-1)?.name ?? "",
      })
    : getGroupTip(game.data.selectedGroup);
  const instructionBody = t(
    isFullTestament ? "bibleBookshelf.instruction.testamentBody" : "bibleBookshelf.instruction.body"
  );
  const languageName = LANGUAGE_NAMES[game.state.config.bibleLanguage];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-amber-50/80 via-background to-sky-50/60 text-foreground dark:from-amber-950/20 dark:via-background dark:to-sky-950/20">
      <header className="shrink-0 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-7xl items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm sm:size-10 sm:rounded-xl">
              <BookOpen className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <span className="truncate">{t("bibleBookshelf.title")}</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 sm:h-8 sm:w-auto sm:px-3"
                  aria-label={t("bibleBookshelf.aria.info")}
                >
                  <Info aria-hidden="true" />
                  <span className="hidden sm:inline">{t("bibleBookshelf.aria.info")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1rem)] p-2">
                {game.state.phase === "setup" ? (
                  <>
                    <DropdownMenuLabel>{t("bibleBookshelf.setup.title")}</DropdownMenuLabel>
                    <p className="px-2 pb-2 text-sm leading-relaxed text-muted-foreground">
                      {t("bibleBookshelf.setup.description")}
                    </p>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>{t("bibleBookshelf.instruction.title")}</DropdownMenuLabel>
                    <p className="px-2 pb-2 text-sm leading-relaxed text-muted-foreground">{instructionBody}</p>
                    <DropdownMenuSeparator />
                    <div className="space-y-1 px-2 py-2 text-sm">
                      <p className="font-semibold">{scopeLabel}</p>
                      <p className="text-muted-foreground">{scopeDescription}</p>
                      <p className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                        <Languages className="size-4" aria-hidden="true" />
                        {languageName}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="flex items-start gap-2 px-2 py-2 text-sm">
                      <Sprout
                        className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300"
                        aria-hidden="true"
                      />
                      <p className="leading-relaxed">
                        <span className="font-semibold">{t("bibleBookshelf.tipLabel")}</span> {learningTip}
                      </p>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild variant="ghost" size="sm" className="h-10 w-10 px-0 sm:h-8 sm:w-auto sm:px-3">
              <Link to="/" aria-label={t("bibleBookshelf.aria.mainMenu")}>
                <Home aria-hidden="true" />
                <span className="hidden sm:inline">{t("bibleBookshelf.actions.mainMenu")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {game.state.phase === "setup" ? (
        <main className="mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-y-auto sm:px-6 sm:py-10">
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
        <BibleBookshelfPlay game={game} scopeLabel={scopeLabel} learningTip={learningTip} languageName={languageName} />
      )}
    </div>
  );
}
