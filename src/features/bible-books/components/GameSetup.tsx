import { ArrowRight, BookOpen, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { BibleBookLanguage, PracticeSetId } from "../model/bible-books.types";
import { BibleBookLanguageSelect } from "./BibleBookLanguageSelect";

interface PracticeSetOption {
  id: PracticeSetId;
  translationKey: "firstFive" | "oldTestament" | "newTestament" | "allBooks";
  questionCount: number;
}

const PRACTICE_SETS: readonly PracticeSetOption[] = [
  {
    id: "FIRST_FIVE",
    translationKey: "firstFive",
    questionCount: 4,
  },
  {
    id: "OLD_TESTAMENT",
    translationKey: "oldTestament",
    questionCount: 10,
  },
  {
    id: "NEW_TESTAMENT",
    translationKey: "newTestament",
    questionCount: 10,
  },
  {
    id: "ALL_BOOKS",
    translationKey: "allBooks",
    questionCount: 10,
  },
] as const;

interface GameSetupProps {
  selectedPracticeSet: PracticeSetId;
  selectedBibleLanguage: BibleBookLanguage;
  onPracticeSetChange: (practiceSet: PracticeSetId) => void;
  onBibleLanguageChange: (language: BibleBookLanguage) => void;
  onStart: () => void;
}

export function GameSetup({
  selectedPracticeSet,
  selectedBibleLanguage,
  onPracticeSetChange,
  onBibleLanguageChange,
  onStart,
}: GameSetupProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-3 overflow-hidden rounded-none border-0 bg-transparent py-3 shadow-none sm:gap-6 sm:rounded-xl sm:border sm:border-border/80 sm:bg-card sm:py-6 sm:shadow-md">
      <CardHeader className="hidden gap-4 border-b bg-muted/35 px-8 py-8 sm:grid">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wide">
            <BookOpen aria-hidden="true" />
            {t("bibleBooksGame.title")}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">{t("bibleBooksGame.setup.tagline")}</span>
        </div>
        <div className="space-y-2">
          <CardTitle>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("bibleBooksGame.setup.title")}</h1>
          </CardTitle>
          <CardDescription className="max-w-xl text-base leading-relaxed">
            {t("bibleBooksGame.setup.description")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3 sm:space-y-6 sm:px-8">
        <BibleBookLanguageSelect
          id="bible-book-language"
          value={selectedBibleLanguage}
          onChange={onBibleLanguageChange}
          label={t("bibleBooksGame.setup.language.label")}
          hint={t("bibleBooksGame.setup.language.hint")}
          className="space-y-1.5 sm:space-y-2"
          labelClassName="text-sm sm:text-base"
          hintClassName="sr-only sm:not-sr-only"
        />

        <fieldset className="space-y-2 sm:space-y-4">
          <legend className="text-sm font-semibold sm:text-base">{t("bibleBooksGame.setup.choosePracticeSet")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {PRACTICE_SETS.map((practiceSet) => {
              const isSelected = practiceSet.id === selectedPracticeSet;

              return (
                <button
                  key={practiceSet.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onPracticeSetChange(practiceSet.id)}
                  className={cn(
                    "relative min-h-20 rounded-lg border p-3 text-left transition-colors outline-none sm:min-h-28 sm:rounded-xl sm:p-4",
                    "hover:border-primary/50 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold leading-tight sm:text-base">
                      {t(`bibleBooksGame.setup.practiceSets.${practiceSet.translationKey}.name`)}
                    </span>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </span>
                  </span>
                  <span className="sr-only sm:not-sr-only sm:mt-1.5 sm:block sm:text-sm sm:leading-relaxed sm:text-muted-foreground">
                    {t(`bibleBooksGame.setup.practiceSets.${practiceSet.translationKey}.description`)}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-muted-foreground sm:mt-2 sm:text-xs">
                    {t("bibleBooksGame.setup.questionCount", { count: practiceSet.questionCount })}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </CardContent>

      <CardFooter className="px-3 sm:justify-end sm:px-8">
        <Button size="lg" className="h-11 w-full text-sm sm:h-12 sm:w-auto sm:text-base" onClick={onStart}>
          {t("bibleBooksGame.actions.startPractice")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
