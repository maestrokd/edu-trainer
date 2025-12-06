import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Calculator, CheckCircle2, Settings, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
type PlayMode = "quiz" | "input";
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

function generateOptions(correct: number): number[] {
  const opts = new Set<number>();
  opts.add(correct);
  const deltas = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];

  let attempts = 0;
  while (opts.size < 4 && attempts < 100) {
    const delta = deltas[randInt(0, deltas.length - 1)];
    const candidate = correct + delta;
    if (candidate !== correct && candidate >= -1000 && candidate <= 1000) {
      opts.add(candidate);
    }
    attempts++;
  }

  while (opts.size < 4) {
    const candidate = correct + randInt(-9, 9);
    if (candidate !== correct) opts.add(candidate);
  }

  return Array.from(opts).sort(() => Math.random() - 0.5);
}

export default function AddSubTrainer() {
  const { t } = useTranslation();
  const tr = React.useCallback(
    (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars),
    [t],
  );

  const [screen, setScreen] = React.useState<Screen>("setup");
  const [playMode, setPlayMode] = React.useState<PlayMode>("quiz");
  const [mode, setMode] = React.useState<ProblemMode>("result");
  const [includeAdd, setIncludeAdd] = React.useState(true);
  const [includeSub, setIncludeSub] = React.useState(true);
  const [minValInput, setMinValInput] = React.useState("0");
  const [maxValInput, setMaxValInput] = React.useState("20");
  const [timerMinutesInput, setTimerMinutesInput] = React.useState("");
  const [maxExercisesInput, setMaxExercisesInput] = React.useState("");
  const [enableSounds, setEnableSounds] = React.useState(false);

  const [task, setTask] = React.useState<GeneratedTask | null>(null);
  const [answer, setAnswer] = React.useState("");
  const [taskId, setTaskId] = React.useState(0);
  const [options, setOptions] = React.useState<number[]>([]);

  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [lastFeedback, setLastFeedback] = React.useState<string | null>(null);
  const [lastWasCorrect, setLastWasCorrect] = React.useState<boolean | null>(null);
  const [gameOver, setGameOver] = React.useState(false);
  const [endReason, setEndReason] = React.useState<"time" | "limit" | null>(null);

  const minVal = React.useMemo(() => {
    const parsed = Number.parseInt(minValInput, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [minValInput]);

  const maxVal = React.useMemo(() => {
    const parsed = Number.parseInt(maxValInput, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [maxValInput]);

  const timerMinutes = React.useMemo(() => {
    const parsed = Number.parseInt(timerMinutesInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [timerMinutesInput]);

  const maxExercises = React.useMemo(() => {
    const parsed = Number.parseInt(maxExercisesInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [maxExercisesInput]);

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
    if (playMode === "quiz") {
      setOptions(generateOptions(next.correctAnswer));
    } else {
      setOptions([]);
    }
  }, [availableOps, maxVal, minVal, mode, playMode]);

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
    if (!timerActive || !timerMinutes) return;
    const total = timerMinutes * 60;
    if (elapsedSec >= total) {
      finishGame("time");
    }
  }, [elapsedSec, finishGame, timerActive, timerMinutes]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (screen === "play" && playMode === "input" && !gameOver) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [screen, playMode, gameOver, taskId]);

  const submitAnswer = React.useCallback(
    (choice?: number) => {
      if (!task || gameOver) return;
      const parsedValue =
        typeof choice === "number" ? choice : Number.parseInt(answer.trim(), 10);
      const isCorrect = Number.isFinite(parsedValue) && parsedValue === task.correctAnswer;

      setHistory((prev) => [
        {
          id: prev.length + 1,
          prompt: task.prompt,
          userAnswer: typeof choice === "number" ? String(choice) : answer.trim(),
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
      if (maxExercises && totalAnswered >= maxExercises) {
        finishGame("limit");
        return;
      }

      prepareTask();
    },
    [answer, correctCount, enableSounds, finishGame, gameOver, maxExercises, prepareTask, task, tr, wrongCount],
  );

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
    <div className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full flex flex-col h-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" aria-hidden />
            <span className="hidden sm:inline text-xs text-muted-foreground">{tr("title")}</span>
          </div>

          <div className="flex items-center text-center">
            {screen === "play" && task && (
              <span className="w-full text-[10px] sm:text-xs text-muted-foreground">
                {tr("play.rangeAccuracy", {
                  min: Math.min(minVal, maxVal),
                  max: Math.max(minVal, maxVal),
                  acc: accuracy,
                })}
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={tr("menu") || "Menu"} className="size-8">
                <Settings className="size-6" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center text-center">
                    <span className="w-full">{tr("menu")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSelector mode={LanguageSelectorMode.ICON} />
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {screen === "play" && (
                  <>
                    <DropdownMenuItem onSelect={() => startGame()}>{tr("actions.newSession")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setScreen("setup")}>{tr("actions.changeSetup")}</DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}
              </DropdownMenuGroup>

              <DropdownMenuItem asChild>
                <Link to="/">{t("menu.mainMenuLabel")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {screen === "setup" ? (
          <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-5xl mx-auto w-full mt-4 space-y-6">
            <p className="text-muted-foreground">{tr("setup.intro")}</p>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-4 sm:p-6 grid gap-4">
                  <LabeledField label={tr("setup.operations")!} htmlFor="op-add">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id="op-add"
                          checked={includeAdd}
                          onCheckedChange={(v) => setIncludeAdd(Boolean(v))}
                          aria-label={tr("aria.add")}
                        />
                        {tr("setup.addition")}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id="op-sub"
                          checked={includeSub}
                          onCheckedChange={(v) => setIncludeSub(Boolean(v))}
                          aria-label={tr("aria.sub")}
                        />
                        {tr("setup.subtraction")}
                      </label>
                      {!canStart && <p className="text-xs text-destructive">{tr("setup.oneRequired")}</p>}
                    </div>
                  </LabeledField>

                  <LabeledField label={tr("setup.range")!} htmlFor="min-input">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="min-input"
                        type="number"
                        value={minValInput}
                        inputMode="numeric"
                        onChange={(e) => setMinValInput(e.target.value)}
                        onBlur={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          setMinValInput(Number.isFinite(parsed) ? String(parsed) : "0");
                        }}
                        aria-label={tr("setup.min") || undefined}
                        placeholder={tr("setup.min") || undefined}
                        className="rounded-xl"
                      />
                      <Input
                        id="max-input"
                        type="number"
                        value={maxValInput}
                        inputMode="numeric"
                        onChange={(e) => setMaxValInput(e.target.value)}
                        onBlur={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          setMaxValInput(Number.isFinite(parsed) ? String(parsed) : "0");
                        }}
                        aria-label={tr("setup.max") || undefined}
                        placeholder={tr("setup.max") || undefined}
                        className="rounded-xl"
                      />
                    </div>
                  </LabeledField>

                  <LabeledField label={tr("setup.answerMode")!} htmlFor="play-mode">
                    <Select value={playMode} onValueChange={(v) => setPlayMode(v as PlayMode)}>
                      <SelectTrigger id="play-mode" className="rounded-xl w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">{tr("mode.quiz")}</SelectItem>
                        <SelectItem value="input">{tr("mode.input")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>

                  <LabeledField label={tr("setup.mode")!} htmlFor="problem-mode">
                    <Select value={mode} onValueChange={(v: ProblemMode) => setMode(v)}>
                      <SelectTrigger id="problem-mode" className="rounded-xl w-full h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="result">{tr("mode.result")}</SelectItem>
                        <SelectItem value="missing">{tr("mode.missing")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 grid gap-4">
                  <LabeledField label={tr("setup.timer")!} htmlFor="timer-min">
                    <Input
                      id="timer-min"
                      type="number"
                      min={0}
                      value={timerMinutesInput}
                      placeholder="∞"
                      inputMode="numeric"
                      onChange={(e) => setTimerMinutesInput(e.target.value)}
                      onBlur={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        setTimerMinutesInput(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "");
                      }}
                      aria-label={tr("aria.timer") || undefined}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">{tr("setup.timerHint")}</p>
                  </LabeledField>

                  <LabeledField label={tr("setup.maxExercises")!} htmlFor="max-ex">
                    <Input
                      id="max-ex"
                      type="number"
                      min={0}
                      value={maxExercisesInput}
                      placeholder="∞"
                      inputMode="numeric"
                      onChange={(e) => setMaxExercisesInput(e.target.value)}
                      onBlur={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        setMaxExercisesInput(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "");
                      }}
                      aria-label={tr("aria.maxExercises") || undefined}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">{tr("setup.maxExercisesHint")}</p>
                  </LabeledField>

                  <LabeledField label={tr("setup.sounds")!} htmlFor="sounds-toggle">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id="sounds-toggle"
                        checked={enableSounds}
                        onCheckedChange={(v) => setEnableSounds(Boolean(v))}
                        aria-label={tr("aria.sounds")}
                      />
                      {tr("setup.soundsHint")}
                    </label>
                  </LabeledField>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button onClick={startGame} className="w-full sm:w-auto" disabled={!canStart}>
                {tr("start")}
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/" aria-label={t("multiT.menu") || undefined}>
                  {t("multiT.menu")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
              <div className="flex flex-col min-h-0">
                {gameOver && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      {endReason === "time"
                        ? tr("play.finished.time")
                        : tr("play.finished.limit", { count: maxExercises || 0 })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <StatCard label={tr("stats.correct")!} value={correctCount} />
                  <StatCard label={tr("stats.wrong")!} value={wrongCount} />
                  <StatCard label={tr("stats.accuracy")!} value={`${accuracy}%`} />
                  <StatCard label={tr("stats.time")!} value={formatTime(elapsedSec)} />
                  {timerMinutes && (
                    <StatCard
                      label={tr("stats.timeLeft")!}
                      value={formatTime(timerMinutes * 60 - elapsedSec)}
                    />
                  )}
                  <StatCard label={tr("stats.streak")!} value={`${streak} / ${bestStreak}`} />
                </div>

                {task && !gameOver && (
                  <div className="text-center mb-6">
                    <div className="text-4xl sm:text-6xl font-semibold tracking-wide select-none">
                      {task.prompt.replace(/\?/g, "☐")}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                      {playMode === "input" ? (
                        <>
                          <Input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={tr("play.placeholder") || ""}
                            aria-label={tr("aria.answerField")}
                            className="text-lg w-40"
                          />
                          <Button onClick={() => submitAnswer()}>{tr("play.submit")}</Button>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                          {options.map((opt) => (
                            <Button
                              key={opt}
                              variant="secondary"
                              className="min-w-20"
                              onClick={() => submitAnswer(opt)}
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {displayStatus && (
                      <p
                        className={cn(
                          "mt-3 text-sm font-medium",
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
                )}
              </div>

              <div className="h-full overflow-auto rounded-xl border">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead className="px-4 text-center">{tr("table.example")}</TableHead>
                      <TableHead className="px-4 text-center">{tr("table.answer")}</TableHead>
                      <TableHead className="px-4 text-center">{tr("table.result")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="px-4 py-3 text-muted-foreground text-center">
                          {tr("table.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((row) => (
                        <TableRow key={row.id} className="border-t">
                          <TableCell className="px-4 py-2 text-center whitespace-nowrap">{row.prompt}</TableCell>
                          <TableCell className="px-4 py-2 text-center">{row.userAnswer || "—"}</TableCell>
                          <TableCell className="px-4 py-2 align-top">
                            {row.isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <CheckCircle2 className="size-4" aria-hidden />
                                {tr("table.correct")}
                              </span>
                            ) : (
                              <div className="text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                                <span className="inline-flex items-center gap-1">
                                  <XCircle className="size-4" aria-hidden />
                                  {tr("table.incorrect", { correct: row.correctAnswer })}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LabeledField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}:</Label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="rounded-xl border shadow-sm min-w-20 py-0">
      <CardContent className="px-3 py-1.5">
        <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
        <div className="text-base font-semibold leading-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
