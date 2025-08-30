import React from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";

// shadcn/ui primitives
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Card, CardContent} from "@/components/ui/card";

// ----------------------------
// Types & helpers
// ----------------------------
type Screen = "setup" | "play";

type Mode = "input" | "quiz";

interface HistoryItem {
  n: number;         // number to round
  unit: number;      // rounding unit (10, 100, 1000)
  answer: number;    // user's answer
  correct: boolean;
}

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundToUnit(n: number, unit: number) {
  return Math.round(n / unit) * unit;
}

function generateRelevantOptions(n: number, unit: number, correct: number): number[] {
  const opts = new Set<number>();
  opts.add(correct);

  const lower = Math.floor(n / unit) * unit; // lower multiple
  const upper = Math.ceil(n / unit) * unit; // upper multiple
  const nearLower = lower + Math.floor(unit * 0.4); // e.g., 40 for 100s -> 12340
  const midpoint = lower + Math.floor(unit / 2); // e.g., 50 for 100s -> 12350

  [upper, nearLower, midpoint].forEach(v => opts.add(v));

  // If still fewer than 4, add plausible distractors within same band
  const bandStart = Math.floor(n / unit) * unit;
  while (opts.size < 4) {
    const deltaChoices = [Math.floor(unit * 0.1), Math.floor(unit * 0.2), Math.floor(unit * 0.8), Math.floor(unit * 0.9), unit, -Math.floor(unit * 0.1), -Math.floor(unit * 0.2)];
    const delta = deltaChoices[randInt(0, deltaChoices.length - 1)];
    const candidate = bandStart + ((n % unit) + delta);
    // Keep within reasonable nearby range
    const normalized = Math.max(0, candidate);
    if (normalized !== correct) opts.add(normalized);
  }

  return shuffle(Array.from(opts)).slice(0, 4);
}

// ----------------------------
// Hooks
// ----------------------------
/**
 * requestAnimationFrame-based timer with self-correcting elapsed seconds.
 * Avoids setInterval drift and keeps 1s resolution accurate across tab throttling.
 */
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

  return {elapsedSec, reset};
}

// ----------------------------
// Main component
// ----------------------------
export default function RoundingTrainer() {
  const {t} = useTranslation();

  // UI state
  const [screen, setScreen] = React.useState<Screen>("setup");
  const [mode, setMode] = React.useState<Mode>("input");

  // Config
  // number magnitude range: 10s..1000s
  const [minMag, setMinMag] = React.useState<number>(10);
  const [maxMag, setMaxMag] = React.useState<number>(1000);
  const [roundUnit, setRoundUnit] = React.useState<number>(100); // default hundreds
  const [timerMinutes, setTimerMinutes] = React.useState<number>(0); // 0 = unlimited
  const [maxExercises, setMaxExercises] = React.useState<number>(0); // 0 = unlimited

  // Task state
  const [n, setN] = React.useState<number>(0);
  const [options, setOptions] = React.useState<number[]>([]);
  const [taskId, setTaskId] = React.useState<number>(0); // For remounting quiz items on touch

  // Input mode
  const [answer, setAnswer] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Results
  const [correctCount, setCorrectCount] = React.useState<number>(0);
  const [wrongCount, setWrongCount] = React.useState<number>(0);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [lastLine, setLastLine] = React.useState<string>("");
  const [lastCorrect, setLastCorrect] = React.useState<boolean | null>(null);

  // Session
  const [gameOver, setGameOver] = React.useState<boolean>(false);
  const [endReason, setEndReason] = React.useState<"time" | "ex" | null>(null);
  const timerActive = screen === "play" && !gameOver;
  const {elapsedSec, reset: resetTimer} = useAccurateTimer(timerActive);

  const accuracy = React.useMemo(() => {
    const total = correctCount + wrongCount;
    return total === 0 ? 0 : Math.round((correctCount / total) * 100);
  }, [correctCount, wrongCount]);

  // Effects
  React.useEffect(() => {
    if (screen !== "play" || gameOver) return;
    if (timerMinutes > 0) {
      const total = timerMinutes * 60;
      if (elapsedSec >= total) {
        endGame("time");
      }
    }
  }, [elapsedSec, screen, gameOver, timerMinutes]);

  // Focus input when needed
  React.useEffect(() => {
    if (screen === "play" && mode === "input" && !gameOver) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [screen, mode, gameOver, taskId]);

  // Handlers
  function clearSession() {
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setLastLine("");
    setLastCorrect(null);
    setGameOver(false);
    setEndReason(null);
    resetTimer();
  }

  function endGame(reason: "time" | "ex") {
    setGameOver(true);
    setEndReason(reason);
  }

  function pickNextTask(minM = minMag, maxM = maxMag, unit = roundUnit) {
    const minNum = Math.min(minM, maxM);
    const maxNum = Math.max(minM, maxM) * 10 - 1; // e.g., 10s..1000s -> 10..9999
    const randomNum = randInt(minNum, maxNum);

    setN(randomNum);
    setAnswer("");
    if (mode === "quiz") {
      const correct = roundToUnit(randomNum, unit);
      setOptions(generateRelevantOptions(randomNum, unit, correct));
    } else {
      setOptions([]);
    }
    setTaskId((id) => id + 1);
  }

  function startGame() {
    // Sanitize config
    let startMinMag = Math.min(minMag, maxMag);
    let startMaxMag = Math.max(minMag, maxMag);

    const allowed = [10, 100, 1000];
    if (!allowed.includes(startMinMag)) startMinMag = 10;
    if (!allowed.includes(startMaxMag)) startMaxMag = 1000;
    if (!allowed.includes(roundUnit)) setRoundUnit(100);

    setMinMag(startMinMag);
    setMaxMag(startMaxMag);

    clearSession();
    setScreen("play");
    pickNextTask(startMinMag, startMaxMag, roundUnit);
  }

  function newSession() {
    clearSession();
    pickNextTask();
  }

  function backToSetup() {
    clearSession();
    setScreen("setup");
  }

  function submit(chosen?: number) {
    if (gameOver) return;
    let user: number;
    if (typeof chosen === "number") {
      user = chosen;
    } else {
      const parsed = parseInt(answer.trim(), 10);
      if (Number.isNaN(parsed)) {
        inputRef.current?.focus();
        return;
      }
      user = parsed;
    }

    const correctAnswer = roundToUnit(n, roundUnit);
    const isCorrect = user === correctAnswer;

    setHistory((h) => [{n, unit: roundUnit, answer: user, correct: isCorrect}, ...h].slice(0, 100));
    setLastLine(`${n} → ${correctAnswer}`);
    setLastCorrect(isCorrect);

    if (isCorrect) setCorrectCount((c) => c + 1);
    else setWrongCount((w) => w + 1);

    const totalAnswered = correctCount + wrongCount + 1;
    if (maxExercises > 0 && totalAnswered >= maxExercises) {
      endGame("ex");
      return;
    }

    pickNextTask();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50 flex flex-col p-2 sm:p-4 overflow-hidden">
      <div className="w-full flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-2 justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="px-3 py-2 h-auto text-xs sm:text-sm">
              <Link to="/" aria-label={t("roundT1.aria.backToMenu")!}>
                {t("roundT1.menu")}
              </Link>
            </Button>
            <span className="hidden sm:inline text-xs text-gray-600">{t("roundT1.title")}</span>
          </div>

          {screen === "play" && (
            <div className="flex items-center gap-2">
              <Button onClick={newSession} variant="outline"
                      className="text-xs sm:text-sm h-auto px-3 py-2"
                      aria-label={t("roundT1.aria.newSession")!}>
                {t("roundT1.newSession")}
              </Button>
              <Button onClick={backToSetup} variant="outline"
                      className="text-xs sm:text-sm h-auto px-3 py-2"
                      aria-label={t("roundT1.aria.changeRange")!}>
                {t("roundT1.changeRange")}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center text-center">
          {screen === "play" && (
            <span className="w-full text-[10px] sm:text-xs text-gray-500">
              {t("roundT1.rangeAccuracy", {min: minMag, max: maxMag, unit: roundUnit, acc: accuracy})}
            </span>
          )}
        </div>

        {screen === "setup" ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-4xl mx-auto w-full">
            <p className="text-gray-700 mb-4">{t("roundT1.setup.intro")} <b>10s…1000s</b>.</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Range & Mode */}
              <Card>
                <CardContent className="p-4 sm:p-6 grid gap-4">
                  <LabeledField label={t("roundT1.setup.minMag")!} htmlFor="minmag-select">
                    <Select value={String(minMag)}
                            onValueChange={(val) => setMinMag(parseInt(val, 10))}>
                      <SelectTrigger id="minmag-select" className="rounded-xl w-full h-10">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10s</SelectItem>
                        <SelectItem value="100">100s</SelectItem>
                        <SelectItem value="1000">1000s</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>

                  <LabeledField label={t("roundT1.setup.maxMag")!} htmlFor="maxmag-select">
                    <Select value={String(maxMag)}
                            onValueChange={(val) => setMaxMag(parseInt(val, 10))}>
                      <SelectTrigger id="maxmag-select" className="rounded-xl w-full h-10">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10s</SelectItem>
                        <SelectItem value="100">100s</SelectItem>
                        <SelectItem value="1000">1000s</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>

                  <LabeledField label={t("roundT1.setup.roundTo")!} htmlFor="roundto-select">
                    <Select value={String(roundUnit)} onValueChange={(val) => setRoundUnit(parseInt(val, 10))}>
                      <SelectTrigger id="roundto-select" className="rounded-xl w-full h-10">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">{t("roundT1.units.tens")}</SelectItem>
                        <SelectItem value="100">{t("roundT1.units.hundreds")}</SelectItem>
                        <SelectItem value="1000">{t("roundT1.units.thousands")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>

                  <LabeledField label={t("roundT1.setup.mode")!} htmlFor="mode-select">
                    <Select value={mode} onValueChange={(val) => setMode(val as Mode)}>
                      <SelectTrigger id="mode-select" className="rounded-xl w-full h-10">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">{t("roundT1.mode.input")}</SelectItem>
                        <SelectItem value="quiz">{t("roundT1.mode.quiz")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </LabeledField>
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardContent className="p-4 sm:p-6 grid gap-4">
                  <LabeledField label={t("roundT1.setup.timer")!} htmlFor="timer-min">
                    <Input
                      id="timer-min"
                      type="number"
                      min={0}
                      value={timerMinutes}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setTimerMinutes(Number.isFinite(v) ? Math.max(0, v) : 0);
                      }}
                      className="rounded-xl"
                    />
                  </LabeledField>

                  <LabeledField label={t("roundT1.setup.maxExercises")!} htmlFor="max-ex">
                    <Input
                      id="max-ex"
                      type="number"
                      min={0}
                      value={maxExercises}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setMaxExercises(Number.isFinite(v) ? Math.max(0, v) : 0);
                      }}
                      className="rounded-xl"
                    />
                  </LabeledField>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button onClick={startGame} className="w-full sm:w-auto">
                {t("roundT1.start")}
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/" aria-label={t("roundT1.aria.backToMenu")!}>
                  {t("roundT1.menu")}
                </Link>
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">{t("roundT1.setup.note")}</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
              {/* Left column */}
              <div className="flex flex-col min-h-0">
                {/* Finished banner */}
                {gameOver && (
                  <Alert className="mb-4 bg-emerald-50 border-emerald-200 text-emerald-900">{/* neutral style */}
                    <AlertDescription>
                      {endReason === "time"
                        ? t("roundT1.finished.timeUp")
                        : t("roundT1.finished.exLimit", {count: correctCount + wrongCount})}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <StatCard label={t("roundT1.stats.correct")!} value={correctCount}/>
                  <StatCard label={t("roundT1.stats.wrong")!} value={wrongCount}/>
                  <StatCard label={t("roundT1.stats.accuracy")!} value={`${accuracy}%`}/>
                  <StatCard label={t("roundT1.stats.time")!} value={formatTime(elapsedSec)}/>
                  {timerMinutes > 0 && (
                    <StatCard
                      label={t("roundT1.stats.timeLeft")!}
                      value={formatTime(timerMinutes * 60 - elapsedSec)}
                    />
                  )}
                </div>

                {/* Current task */}
                {gameOver === false &&
                  <div className="text-center mb-6">
                    <div className="text-4xl sm:text-6xl font-semibold tracking-wide text-gray-900 select-none">
                      {n} {"→"} {t("roundT1.unitsLabel", {unit: roundUnit})}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      {mode === "input" ? (
                        <>
                          <Input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={t("roundT1.input.placeholder") || ""}
                            aria-label={t("roundT1.aria.answerField") || undefined}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={gameOver}
                            className="w-40 text-center text-2xl sm:text-3xl rounded-xl"
                          />
                          <Button onClick={() => submit()} disabled={gameOver}
                                  className="text-lg">
                            {t("roundT1.input.submit")}
                          </Button>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                          {options.map((opt, idx) => (
                            <Button
                              key={`${taskId}-${idx}`}
                              variant="outline"
                              onClick={(e) => {
                                (e.currentTarget as HTMLButtonElement).blur();
                                if (!gameOver) submit(opt);
                              }}
                              onTouchEnd={(e) => (e.currentTarget as HTMLButtonElement).blur()}
                              aria-label={t("roundT1.quiz.optionAria", {opt}) || undefined}
                              disabled={gameOver}
                              className="px-5 py-4 text-2xl font-medium"
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-lg sm:text-xl" aria-live="polite" aria-atomic="true">
                      {lastLine && (
                        <span className="inline-flex items-center gap-2">
                          <span className="font-medium">{lastLine}</span>
                          {lastCorrect === true && <span role="img" aria-label={t("roundT1.aria.correct") || undefined}>✅</span>}
                          {lastCorrect === false && <span role="img" aria-label={t("roundT1.aria.wrong") || undefined}>❌</span>}
                        </span>
                      )}
                    </div>

                    {mode === "input" && (
                      <p className="mt-2 text-xs text-gray-500">{t("roundT1.input.hint")}</p>
                    )}
                  </div>}
              </div>

              {/* Right column: history */}
              <div className="h-full overflow-auto rounded-xl border border-gray-200 bg-white">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50">
                    <TableRow>
                      <TableHead className="px-4 text-center">{t("roundT1.table.example")}</TableHead>
                      <TableHead className="px-4 text-center">{t("roundT1.table.answer")}</TableHead>
                      <TableHead className="px-4 text-center">{t("roundT1.table.result")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-4 py-3 text-gray-500" colSpan={3}>
                          {t("roundT1.table.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((h, idx) => (
                        <TableRow key={idx} className="border-t border-gray-100">
                          <TableCell className="px-4 py-2 text-center whitespace-nowrap">
                            {h.n} → {t("roundT1.unitsLabel", {unit: h.unit})}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-center">{h.answer}</TableCell>
                          <TableCell className="px-4 py-2 align-top">
                            {h.correct ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <span role="img" aria-label={t("roundT1.aria.correct") || undefined}>✅</span>
                                {t("roundT1.table.correct")}
                              </span>
                            ) : (
                              <div className="text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                                <span className="inline-flex items-center gap-1">
                                  <span role="img" aria-label={t("roundT1.aria.wrong") || undefined}>❌</span>
                                  {t("roundT1.table.incorrect", {correct: roundToUnit(h.n, h.unit)})}
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

// ----------------------------
// Small presentational pieces
// ----------------------------
function LabeledField({label, htmlFor, children}: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col" htmlFor={htmlFor}>
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

function StatCard({label, value}: { label: string; value: number | string }) {
  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm min-w-20 py-0">
      <CardContent className="px-3 py-1.5">
        <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
        <div className="text-base font-semibold text-gray-900 leading-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
