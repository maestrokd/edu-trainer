import type { RefObject } from "react";
import { ArrowRight, BookCopy, Check, LibraryBig } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BibleBookLanguageSelect } from "@/features/bible-books/components/BibleBookLanguageSelect";
import type { BibleBookLanguage, BibleTestament } from "@/features/bible-books/model/bible-books.types";
import { cn } from "@/lib/utils";

import type { BibleBookshelfGroup, BibleBookshelfGroupId } from "../data/learning-groups";
import type { BibleBookshelfConfig, BibleBookshelfMode } from "../lib/game";
import { LearningGroupSelect } from "./LearningGroupSelect";

interface BibleBookshelfSetupProps {
  config: BibleBookshelfConfig;
  groups: readonly BibleBookshelfGroup[];
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBibleLanguageChange: (language: BibleBookLanguage) => void;
  onModeChange: (mode: BibleBookshelfMode) => void;
  onGroupChange: (groupId: BibleBookshelfGroupId) => void;
  onTestamentChange: (testament: BibleTestament) => void;
  onStart: () => void;
  getGroupLabel: (group: BibleBookshelfGroup) => string;
}

const MODES: readonly { id: BibleBookshelfMode; icon: typeof BookCopy }[] = [
  { id: "groups", icon: BookCopy },
  { id: "testament", icon: LibraryBig },
];

const TESTAMENTS: readonly BibleTestament[] = ["OLD", "NEW"];

export function BibleBookshelfSetup({
  config,
  groups,
  headingRef,
  onBibleLanguageChange,
  onModeChange,
  onGroupChange,
  onTestamentChange,
  onStart,
  getGroupLabel,
}: BibleBookshelfSetupProps) {
  const { t } = useTranslation();

  return (
    <Card className="mx-auto w-full max-w-4xl gap-3 overflow-hidden rounded-none border-0 bg-transparent py-3 shadow-none sm:gap-6 sm:rounded-xl sm:border sm:border-amber-200/70 sm:bg-card sm:py-6 sm:shadow-xl dark:sm:border-amber-900/60">
      <CardHeader className="sr-only sm:not-sr-only sm:grid sm:border-b sm:bg-card/95 sm:px-8 sm:py-8">
        <CardTitle>
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none sm:text-4xl">
            {t("bibleBookshelf.setup.title")}
          </h1>
        </CardTitle>
        <CardDescription className="max-w-2xl text-base leading-relaxed">
          {t("bibleBookshelf.setup.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-3 sm:space-y-7 sm:px-8">
        <BibleBookLanguageSelect
          id="bookshelf-bible-language"
          value={config.bibleLanguage}
          onChange={onBibleLanguageChange}
          label={t("bibleBookshelf.setup.language.label")}
          hint={t("bibleBookshelf.setup.language.hint")}
          hintClassName="sr-only sm:not-sr-only"
        />

        <fieldset className="space-y-2 sm:space-y-3">
          <legend className="text-sm font-semibold sm:text-base">{t("bibleBookshelf.setup.mode.legend")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {MODES.map(({ id, icon: Icon }) => {
              const isSelected = config.mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onModeChange(id)}
                  className={cn(
                    "relative min-h-20 rounded-lg border p-3 text-left outline-none transition-colors sm:min-h-28 sm:rounded-xl sm:p-4",
                    "hover:border-primary/50 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold leading-tight sm:gap-2 sm:text-base">
                      <Icon className="size-4 sm:size-5" aria-hidden="true" />
                      {t(`bibleBookshelf.setup.mode.${id}.name`)}
                    </span>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}
                      aria-hidden="true"
                    >
                      {isSelected ? <Check className="size-3.5" /> : null}
                    </span>
                  </span>
                  <span className="sr-only sm:not-sr-only sm:mt-2 sm:block sm:text-sm sm:leading-relaxed sm:text-muted-foreground">
                    {t(`bibleBookshelf.setup.mode.${id}.description`)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {config.mode === "groups" ? (
          <LearningGroupSelect
            groups={groups}
            selectedGroupId={config.groupId}
            onChange={onGroupChange}
            label={t("bibleBookshelf.chooseGroup")}
            getGroupLabel={getGroupLabel}
          />
        ) : (
          <fieldset className="space-y-2 sm:space-y-3">
            <legend className="text-sm font-semibold sm:text-base">{t("bibleBookshelf.setup.testament.legend")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {TESTAMENTS.map((testament) => {
                const key = testament === "OLD" ? "old" : "new";
                const count = testament === "OLD" ? 39 : 27;
                const isSelected = config.testament === testament;

                return (
                  <button
                    key={testament}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onTestamentChange(testament)}
                    className={cn(
                      "relative min-h-20 rounded-lg border p-3 text-left outline-none transition-colors sm:min-h-24 sm:rounded-xl sm:p-4",
                      "hover:border-primary/50 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold leading-tight sm:text-base">
                        {t(`bibleBookshelf.setup.testament.${key}.name`)}
                      </span>
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                        aria-hidden="true"
                      >
                        {isSelected ? <Check className="size-3.5" /> : null}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                      {t("bibleBookshelf.setup.testament.bookCount", { count })}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </CardContent>

      <CardFooter className="px-3 sm:justify-end sm:px-8">
        <Button size="lg" className="h-11 w-full text-sm sm:h-12 sm:w-auto sm:text-base" onClick={onStart}>
          {t("bibleBookshelf.actions.start")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
