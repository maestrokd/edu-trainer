import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Calculator, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/menu/ThemeToggle";
import LanguageSelector, { LanguageSelectorMode } from "@/components/lang/LanguageSelector";
import { cn } from "@/lib/utils";

type Screen = "setup" | "play";
type Op = "add" | "sub";
type ProblemMode = "result" | "missing";
type MissingPart = "result" | "a" | "b";

type HistoryItem = {
  id: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: number;
  isCorrect: boolean;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(m)}:${pad(ss)}`;
}

function useAccurateTimer(active: boolean) {
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const step = React.useCallback((t: number) => {
    if (startRef.current == null) startRef.current = t;
    const seconds = Math.floor((t - startRef.current) / 1000);
    setElapsedSec(seconds);
    rafRef.current = requestAnimationFrame(step);
  }, []);

  React.useEffect(() => {
    if (!active) return;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, step]);

  const reset = React.useCallback(() => {
    startRef.current = null;
    setElapsedSec(0);
  }, []);

  return { elapsedSec, reset };
}

interface GeneratedTask {
  a: number;
  b: number;
  op: Op;
  missing: MissingPart;
  correctAnswer: number;
  prompt: string;
}

function buildPrompt(task: GeneratedTask) {
  const symbol = task.op === "add" ? "+" : "-";
  const parts = {
    a: task.missing === "a" ? "?" : task.a,
    b: task.missing === "b" ? "?" : task.b,
    result: task.missing === "result" ? "?" : task.op === "add" ? task.a + task.b : task.a - task.b,
  } as const;
  return `${parts.a} ${symbol} ${parts.b} = ${parts.result}`;
}

function generateTask(ops: Op[], mode: ProblemMode, min: number, max: number): GeneratedTask {
  const op = ops[randInt(0, ops.length - 1)];
  const a = randInt(min, max);
  const b = randInt(min, max);
  const [x, y] = op === "sub" && a < b ? [b, a] : [a, b];

  const missing: MissingPart = mode === "result" ? "result" : randInt(0, 1) === 0 ? "a" : "b";
  const result = op === "add" ? x + y : x - y;

  let correctAnswer = result;
  if (missing === "a") correctAnswer = op === "add" ? result - y : result + y;
  if (missing === "b") correctAnswer = op === "add" ? result - x : x - result;

  return {
    a: x,
    b: y,
    op,
    missing,
    correctAnswer,
    prompt: buildPrompt({ a: x, b: y, op, missing, correctAnswer, prompt: "" }),
  };
}

export default function AddSubTrainer() {
  const { t } = useTranslation();
  const tr = React.useCallback(
    (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars),
    [t],
  );

  const [screen, setScreen] = React.useState<Screen>("setup");
  const [mode, setMode] = React.useState<ProblemMode>("result");
  const [includeAdd, setIncludeAdd] = React.useState(true);
  const [includeSub, setIncludeSub] = React.useState(true);
  const [minVal, setMinVal] = React.useState(0);
  const [maxVal, setMaxVal] = React.useState(20);
  const [timerMinutes, setTimerMinutes] = React.useState(0);
  const [maxExercises, setMaxExercises] = React.useState(0);
  const [enableSounds, setEnableSounds] = React.useState(false);

  const [task, setTask] = React.useState<GeneratedTask | null>(null);
  const [answer, setAnswer] = React.useState("");
  const [taskId, setTaskId] = React.useState(0);

  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [lastFeedback, setLastFeedback] = React.useState<string | null>(null);
  const [lastWasCorrect, setLastWasCorrect] = React.useState<boolean | null>(null);
  const [gameOver, setGameOver] = React.useState(false);
  const [endReason, setEndReason] = React.useState<"time" | "limit" | null>(null);

  const timerActive = screen === "play" && !gameOver;
  const { elapsedSec, reset: resetTimer } = useAccurateTimer(timerActive);

  const accuracy = React.useMemo(() => {
    const total = correctCount + wrongCount;
    return total === 0 ? 0 : Math.round((correctCount / total) * 100);
  }, [correctCount, wrongCount]);

  const canStart = includeAdd || includeSub;
  const availableOps = React.useMemo(() => {
    const ops: Op[] = [];
    if (includeAdd) ops.push("add");
    if (includeSub) ops.push("sub");
    return ops;
  }, [includeAdd, includeSub]);

  const prepareTask = React.useCallback(() => {
    const min = Math.min(minVal, maxVal);
    const max = Math.max(minVal, maxVal);
    const next = generateTask(availableOps, mode, min, max);
    setTask(next);
    setTaskId((id) => id + 1);
    setAnswer("");
  }, [availableOps, maxVal, minVal, mode]);

  const startGame = React.useCallback(() => {
    if (!canStart) return;
    setScreen("play");
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setLastFeedback(null);
    setLastWasCorrect(null);
    setGameOver(false);
    setEndReason(null);
    resetTimer();
    prepareTask();
  }, [canStart, prepareTask, resetTimer]);

  const finishGame = React.useCallback(
    (reason: "time" | "limit") => {
      setGameOver(true);
      setEndReason(reason);
    },
    [],
  );

  React.useEffect(() => {
    if (!timerActive || timerMinutes <= 0) return;
    const total = timerMinutes * 60;
    if (elapsedSec >= total) {
      finishGame("time");
    }
  }, [elapsedSec, finishGame, timerActive, timerMinutes]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (screen === "play" && !gameOver) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [screen, gameOver, taskId]);

  const submitAnswer = React.useCallback(() => {
    if (!task || gameOver) return;
    const parsed = Number.parseInt(answer.trim(), 10);
    const isCorrect = Number.isFinite(parsed) && parsed === task.correctAnswer;

    setHistory((prev) => [
      {
        id: prev.length + 1,
        prompt: task.prompt,
        userAnswer: answer.trim(),
        correctAnswer: task.correctAnswer,
        isCorrect,
      },
      ...prev,
    ]);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setLastFeedback(tr("play.feedback.correct"));
      setLastWasCorrect(true);
      if (enableSounds && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(tr("play.sr.correct"));
        window.speechSynthesis.speak(utter);
      }
    } else {
      setWrongCount((c) => c + 1);
      setStreak(0);
      setLastFeedback(tr("play.feedback.wrong", { correct: task.correctAnswer }));
      setLastWasCorrect(false);
      if (enableSounds && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(tr("play.sr.wrong"));
        window.speechSynthesis.speak(utter);
      }
    }

    const totalAnswered = correctCount + wrongCount + 1;
    if (maxExercises > 0 && totalAnswered >= maxExercises) {
      finishGame("limit");
      return;
    }

    prepareTask();
  }, [answer, correctCount, enableSounds, finishGame, gameOver, maxExercises, prepareTask, task, tr, wrongCount]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submitAnswer();
      }
    },
    [submitAnswer],
  );

  const displayStatus = React.useMemo(() => {
    if (!gameOver) return lastFeedback;
    if (endReason === "time") return tr("play.finished.time");
    if (endReason === "limit") return tr("play.finished.limit", { count: maxExercises });
    return null;
  }, [endReason, gameOver, lastFeedback, maxExercises, tr]);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium hover:bg-muted/80"
          >
            ← {t("multiT.menu")}
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            <span className="text-lg font-semibold">{tr("title")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                {tr("menu")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{tr("menu")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/">{t("menu.mainMenuLabel")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/multiplication-trainer">{t("games.multiplication2.title")}</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <LanguageSelector mode={LanguageSelectorMode.Both} />
          <ThemeToggle />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {tr("setup.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.operations")}</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeAdd}
                    onCheckedChange={(v) => setIncludeAdd(Boolean(v))}
                    aria-label={tr("aria.add")}
                  />
                  {tr("setup.addition")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeSub}
                    onCheckedChange={(v) => setIncludeSub(Boolean(v))}
                    aria-label={tr("aria.sub")}
                  />
                  {tr("setup.subtraction")}
                </label>
                {!canStart && (
                  <p className="text-xs text-destructive">{tr("setup.oneRequired")}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.range")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="min" className="text-xs text-muted-foreground">
                    {tr("setup.min")}
                  </Label>
                  <Input
                    id="min"
                    type="number"
                    min={-99}
                    max={999}
                    value={minVal}
                    onChange={(e) => setMinVal(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max" className="text-xs text-muted-foreground">
                    {tr("setup.max")}
                  </Label>
                  <Input
                    id="max"
                    type="number"
                    min={-99}
                    max={999}
                    value={maxVal}
                    onChange={(e) => setMaxVal(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.mode")}</Label>
              <Select value={mode} onValueChange={(v: ProblemMode) => setMode(v)}>
                <SelectTrigger aria-label={tr("aria.mode")}>
                  <SelectValue placeholder={tr("setup.mode")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="result">{tr("mode.result")}</SelectItem>
                  <SelectItem value="missing">{tr("mode.missing")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.timer")}</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                aria-label={tr("aria.timer")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.maxExercises")}</Label>
              <Input
                type="number"
                min={0}
                max={200}
                value={maxExercises}
                onChange={(e) => setMaxExercises(Number(e.target.value))}
                aria-label={tr("aria.maxExercises")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Label className="text-sm font-semibold">{tr("setup.sounds")}</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={enableSounds}
                  onCheckedChange={(v) => setEnableSounds(Boolean(v))}
                  aria-label={tr("aria.sounds")}
                />
                {tr("setup.soundsHint")}
              </label>
            </div>

            <Button onClick={startGame} className="w-full" disabled={!canStart}>
              {tr("start")}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{tr("play.title")}</span>
              <span className="text-sm text-muted-foreground">
                {tr("play.rangeAccuracy", { min: Math.min(minVal, maxVal), max: Math.max(minVal, maxVal), acc: accuracy })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {screen === "setup" && (
              <Alert className="bg-primary/5 border-primary/30">
                <AlertDescription className="text-sm">
                  {tr("setup.intro")}
                </AlertDescription>
              </Alert>
            )}

            {screen === "play" && task && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {tr("play.stats", {
                      correct: correctCount,
                      wrong: wrongCount,
                      streak,
                      best: bestStreak,
                    })}
                  </div>
                  <div className="text-sm font-semibold">
                    {timerMinutes > 0
                      ? `${tr("play.timeLeft")}: ${formatTime(timerMinutes * 60 - elapsedSec)}`
                      : `${tr("play.timeElapsed")}: ${formatTime(elapsedSec)}`}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-indigo-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border p-4">
                  <p className="text-sm text-muted-foreground">{tr("play.promptLabel")}</p>
                  <p className="text-3xl font-semibold tracking-tight">{task.prompt}</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <Input
                      ref={inputRef}
                      key={taskId}
                      type="number"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={tr("play.placeholder")}
                      aria-label={tr("aria.answerField")}
                      className="text-lg"
                    />
                    <Button onClick={submitAnswer}>{tr("play.submit")}</Button>
                  </div>
                  {displayStatus && (
                    <p
                      className={cn(
                        "text-sm font-medium",
                        gameOver
                          ? "text-primary"
                          : lastWasCorrect
                            ? "text-emerald-600"
                            : "text-destructive",
                      )}
                    >
                      {displayStatus}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{tr("table.title")}</h3>
                <span className="text-xs text-muted-foreground">
                  {tr("table.summary", { count: history.length })}
                </span>
              </div>
              <div className="rounded-lg border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr("table.example")}</TableHead>
                      <TableHead>{tr("table.answer")}</TableHead>
                      <TableHead>{tr("table.result")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                          {tr("table.empty")}
                        </TableCell>
                      </TableRow>
                    )}
                    {history.map((row) => (
                      <TableRow key={row.id} className={row.isCorrect ? "" : "bg-destructive/5"}>
                        <TableCell className="font-mono">{row.prompt}</TableCell>
                        <TableCell>{row.userAnswer || "—"}</TableCell>
                        <TableCell className={row.isCorrect ? "text-emerald-600" : "text-destructive"}>
                          {row.isCorrect ? tr("table.correct") : tr("table.incorrect", { correct: row.correctAnswer })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
