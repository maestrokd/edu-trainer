import { ArrowRight, BookOpen, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { PracticeSetId } from "../model/bible-books.types";

interface PracticeSetOption {
  id: PracticeSetId;
  name: string;
  description: string;
  questionCount: string;
}

const PRACTICE_SETS: readonly PracticeSetOption[] = [
  {
    id: "FIRST_FIVE",
    name: "First 5 Books",
    description: "Start with Genesis through Deuteronomy.",
    questionCount: "4 questions",
  },
  {
    id: "OLD_TESTAMENT",
    name: "Old Testament",
    description: "Practice Genesis through Malachi.",
    questionCount: "10 questions",
  },
  {
    id: "NEW_TESTAMENT",
    name: "New Testament",
    description: "Practice Matthew through Revelation.",
    questionCount: "10 questions",
  },
  {
    id: "ALL_BOOKS",
    name: "All 66 Books",
    description: "Practice the complete Bible book order.",
    questionCount: "10 questions",
  },
] as const;

interface GameSetupProps {
  selectedPracticeSet: PracticeSetId;
  onPracticeSetChange: (practiceSet: PracticeSetId) => void;
  onStart: () => void;
}

export function GameSetup({ selectedPracticeSet, onPracticeSetChange, onStart }: GameSetupProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="gap-4 border-b bg-muted/35 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wide">
            <BookOpen aria-hidden="true" />
            Bible Books
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">Learn one step at a time</span>
        </div>
        <div className="space-y-2">
          <CardTitle>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What Comes Next?</h1>
          </CardTitle>
          <CardDescription className="max-w-xl text-base leading-relaxed">
            Learn the order of the books of the Bible one step at a time.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-8">
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">Choose what you want to practice:</legend>
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
                    <span className="font-semibold">{practiceSet.name}</span>
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
                    {practiceSet.description}
                  </span>
                  <span className="mt-2 block text-xs font-medium text-muted-foreground">
                    {practiceSet.questionCount}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </CardContent>

      <CardFooter className="px-5 sm:justify-end sm:px-8">
        <Button size="lg" className="h-12 w-full text-base sm:w-auto" onClick={onStart}>
          Start Practice
          <ArrowRight aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
