import { useEffect, useRef } from "react";
import { BookOpen, RotateCcw, Settings2, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizResultsProps {
  correctAnswers: number;
  totalQuestions: number;
  missedQuestions: number;
  onPlayAgain: () => void;
  onChangePracticeSet: () => void;
}

export function QuizResults({
  correctAnswers,
  totalQuestions,
  missedQuestions,
  onPlayAgain,
  onChangePracticeSet,
}: QuizResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Card className="overflow-hidden border-border/80 text-center shadow-md">
      <CardHeader className="items-center gap-4 border-b bg-muted/35 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Trophy className="size-8" aria-hidden="true" />
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <BookOpen aria-hidden="true" />
          Bible Books
        </Badge>
        <div className="space-y-2">
          <CardTitle>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none sm:text-4xl">
              Great work!
            </h1>
          </CardTitle>
          <CardDescription className="text-base">You&apos;re learning the Bible book order!</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 sm:px-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">You got</p>
          <p className="mt-1 text-5xl font-bold tracking-tight">
            {correctAnswers} <span className="text-2xl text-muted-foreground">out of {totalQuestions}</span>
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">correct</p>
        </div>
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {missedQuestions === 0
            ? "Perfect round — you knew every next book!"
            : `${missedQuestions} ${missedQuestions === 1 ? "book is" : "books are"} ready for another try.`}
        </p>
      </CardContent>

      <CardFooter className="grid gap-3 px-5 sm:grid-cols-2 sm:px-8">
        <Button size="lg" className="h-12 text-base" onClick={onPlayAgain}>
          <RotateCcw aria-hidden="true" />
          Play Again
        </Button>
        <Button size="lg" variant="outline" className="h-12 text-base" onClick={onChangePracticeSet}>
          <Settings2 aria-hidden="true" />
          Change Practice Set
        </Button>
      </CardFooter>
    </Card>
  );
}
