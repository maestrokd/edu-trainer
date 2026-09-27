import { ArrowRight, BookOpen, Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { BibleBookLanguage, PracticeSetId } from "../model/bible-books.types";

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
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="gap-4 border-b bg-muted/35 px-5 py-6 sm:px-8 sm:py-8">
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

      <CardContent className="space-y-6 px-5 sm:px-8">
        <div className="space-y-2">
          <Label htmlFor="bible-book-language" className="flex items-center gap-2">
            <Languages className="size-4" aria-hidden="true" />
            {t("bibleBooksGame.setup.language.label")}
          </Label>
          <Select
            value={selectedBibleLanguage}
            onValueChange={(value) => onBibleLanguageChange(value as BibleBookLanguage)}
          >
            <SelectTrigger id="bible-book-language" className="h-11 w-full" aria-describedby="bible-book-language-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>
          <p id="bible-book-language-hint" className="text-xs leading-relaxed text-muted-foreground">
            {t("bibleBooksGame.setup.language.hint")}
          </p>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">{t("bibleBooksGame.setup.choosePracticeSet")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRACTICE_SETS.map((practiceSet) => {
              const isSelected = practiceSet.id === selectedPracticeSet;

              return (
                <button
                  key={practiceSet.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onPracticeSetChange(practiceSet.id)}
                  className={cn(
                    "relative min-h-28 rounded-xl border p-4 text-left transition-colors outline-none",
                    "hover:border-primary/50 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-semibold">
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
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {t(`bibleBooksGame.setup.practiceSets.${practiceSet.translationKey}.description`)}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-muted-foreground">
                    {t("bibleBooksGame.setup.questionCount", { count: practiceSet.questionCount })}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </CardContent>

      <CardFooter className="px-5 sm:justify-end sm:px-8">
        <Button size="lg" className="h-12 w-full text-base sm:w-auto" onClick={onStart}>
          {t("bibleBooksGame.actions.startPractice")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
