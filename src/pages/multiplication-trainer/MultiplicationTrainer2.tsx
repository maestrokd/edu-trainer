import React from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";

// shadcn/ui primitives
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Card, CardContent} from "@/components/ui/card";
import {Label} from "@/components/ui/label.tsx";
import {Settings} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/menu/ThemeToggle.tsx";
import LanguageSelector, {LanguageSelectorMode} from "@/components/lang/LanguageSelector.tsx";

// ----------------------------
// Types & helpers
// ----------------------------
type Op = "mul" | "div";

type Screen = "setup" | "play";

type Mode = "input" | "quiz";

interface HistoryItem {
    a: number;
    b: number;
    answer: number;
    correct: boolean;
    op: Op;
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

function generateOptions(correct: number): number[] {
    const opts = new Set<number>();
    opts.add(correct);
    const deltas = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
    let attempts = 0;
    while (opts.size < 4 && attempts < 100) {
        const d = deltas[randInt(0, deltas.length - 1)];
        let candidate = correct + d;
        if (candidate < 0) candidate = Math.abs(candidate);
        if (candidate !== correct) opts.add(candidate);
        attempts++;
    }
    while (opts.size < 4) {
        const candidate = Math.max(0, correct + randInt(-9, 9));
        if (candidate !== correct) opts.add(candidate);
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
export default function MultiplicationTrainer2() {
    const {t} = useTranslation();

    // UI state
    const [screen, setScreen] = React.useState<Screen>("setup");
    const [mode, setMode] = React.useState<Mode>("quiz");

    // Config
    const [minVal, setMinVal] = React.useState<number>(4);
    const [maxVal, setMaxVal] = React.useState<number>(9);
    const [includeMul, setIncludeMul] = React.useState<boolean>(true);
    const [includeDiv, setIncludeDiv] = React.useState<boolean>(true);
    const [timerMinutes, setTimerMinutes] = React.useState<number>(0); // 0 = unlimited
    const [maxExercises, setMaxExercises] = React.useState<number>(0); // 0 = unlimited

    // Task state
    const [a, setA] = React.useState<number>(0);
    const [b, setB] = React.useState<number>(0);
    const [op, setOp] = React.useState<Op>("mul");
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

    function pickNextTask(min = minVal, max = maxVal) {
        let chosenOp: Op = "mul";
        if (includeMul && includeDiv) chosenOp = Math.random() < 0.5 ? "mul" : "div";
        else if (includeDiv && !includeMul) chosenOp = "div";

        let na = 0;
        let nb = 0;
        let correct = 0;

        if (chosenOp === "mul") {
            na = randInt(min, max);
            nb = randInt(1, 12);
            correct = na * nb;
        } else {
            const multiplicand = randInt(min, max);
            const multiplier = randInt(1, 12);
            const product = multiplicand * multiplier;
            if (Math.random() < 0.5) {
                na = product;
                nb = multiplicand;
                correct = multiplier;
            } else {
                na = product;
                nb = multiplier;
                correct = multiplicand;
            }
        }

        setOp(chosenOp);
        setA(na);
        setB(nb);
        setAnswer("");
        if (mode === "quiz") {
            setOptions(generateOptions(correct));
        } else {
            setOptions([]);
        }
        setTaskId((id) => id + 1);
    }

    function startGame() {
        let startMin = Math.min(minVal, maxVal);
        let startMax = Math.max(minVal, maxVal);
        startMin = Math.max(2, Math.min(12, startMin));
        startMax = Math.max(2, Math.min(12, startMax));

        setMinVal(startMin);
        setMaxVal(startMax);

        if (!includeMul && !includeDiv) {
            setIncludeMul(true);
        }

        clearSession();
        setScreen("play");
        pickNextTask(startMin, startMax);
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

        const correctAnswer = op === "mul" ? a * b : Math.floor(a / b);
        const isCorrect = user === correctAnswer;

        setHistory((h) => [{a, b, answer: user, correct: isCorrect, op}, ...h].slice(0, 100));
        setLastLine(`${a} ${op === "mul" ? "×" : "÷"} ${b} = ${user}`);
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
        <div
            className="min-h-dvh w-full bg-gradient-to-br bg-background flex flex-col p-2 sm:p-4 overflow-hidden">
            <div className="w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline text-xs text-muted-foreground">{t("multiT.title")}</span>
                    </div>

                    <div className="flex items-center text-center">
                        {screen === "play" && (
                            <span className="w-full text-[10px] sm:text-xs text-muted-foreground">
                                {t("multiT.rangeAccuracy", {min: minVal, max: maxVal, acc: accuracy})}
                            </span>
                        )}
                    </div>

                    {/* Right: Settings menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("multiT.menu") || "Menu"}
                                className="size-8"
                            >
                                <Settings className="size-6"/>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center text-center">
                                        <span className="w-full">{t("multiT.menu")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ThemeToggle/>
                                        <LanguageSelector mode={LanguageSelectorMode.ICON}/>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator/>

                            <DropdownMenuGroup>
                                {screen === "play" && (
                                    <>
                                        <DropdownMenuItem onSelect={() => newSession()}>
                                            {t("multiT.newSession")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => backToSetup()}>
                                            {t("multiT.changeRange")}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator/>
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
                    <div
                        className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-4xl mx-auto w-full">
                        <p className="text-muted-foreground mb-4">{t("multiT.setup.intro")} <b>4…9</b>.</p>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Range & Mode */}
                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <LabeledField label={t("multiT.setup.min")!} htmlFor="min-select">
                                        <Select value={String(minVal)}
                                                onValueChange={(val) => setMinVal(parseInt(val, 10))}>
                                            <SelectTrigger id="min-select" className="rounded-xl w-full h-10">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({length: 11}, (_, i) => i + 2).map((n) => (
                                                    <SelectItem key={n} value={String(n)}>
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </LabeledField>

                                    <LabeledField label={t("multiT.setup.max")!} htmlFor="max-select">
                                        <Select value={String(maxVal)}
                                                onValueChange={(val) => setMaxVal(parseInt(val, 10))}>
                                            <SelectTrigger id="max-select" className="rounded-xl w-full h-10">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({length: 11}, (_, i) => i + 2).map((n) => (
                                                    <SelectItem key={n} value={String(n)}>
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </LabeledField>

                                    <LabeledField label={t("multiT.setup.mode")!} htmlFor="mode-select">
                                        <Select value={mode} onValueChange={(val) => setMode(val as Mode)}>
                                            <SelectTrigger id="mode-select" className="rounded-xl w-full h-10">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="input">{t("multiT.mode.input")}</SelectItem>
                                                <SelectItem value="quiz">{t("multiT.mode.quiz")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </LabeledField>
                                </CardContent>
                            </Card>

                            {/* Options */}
                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="inline-flex items-center gap-2">
                                            <Checkbox id="mul-check" checked={includeMul}
                                                      onCheckedChange={(v) => setIncludeMul(Boolean(v))}/>
                                            <Label htmlFor="mul-check">{t("multiT.ex.mul")}</Label>
                                        </div>
                                        <div className="inline-flex items-center gap-2">
                                            <Checkbox id="div-check" checked={includeDiv}
                                                      onCheckedChange={(v) => setIncludeDiv(Boolean(v))}/>
                                            <Label htmlFor="div-check">{t("multiT.ex.div")}</Label>
                                        </div>
                                    </div>

                                    <LabeledField label={t("multiT.setup.timer")!} htmlFor="timer-min">
                                        <Input
                                            id="timer-min"
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            value={timerMinutes}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value, 10);
                                                setTimerMinutes(v);
                                            }}
                                            onBlur={(e) => {
                                                const v = parseInt(e.target.value, 10);
                                                setTimerMinutes(Number.isFinite(v) ? Math.max(0, v) : 0);
                                            }}
                                            className="rounded-xl"
                                        />
                                    </LabeledField>

                                    <LabeledField label={t("multiT.setup.maxExercises")!} htmlFor="max-ex">
                                        <Input
                                            id="max-ex"
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            value={maxExercises}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value, 10);
                                                setMaxExercises(v);
                                            }}
                                            onBlur={(e) => {
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
                                {t("multiT.start")}
                            </Button>
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <Link to="/" aria-label={t("multiT.aria.backToMenu")!}>
                                    {t("multiT.menu")}
                                </Link>
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-3">{t("multiT.setup.note")}</p>
                    </div>
                ) : (
                    <div
                        className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                            {/* Left column */}
                            <div className="flex flex-col min-h-0">
                                {/* Finished banner */}
                                {gameOver && (
                                    <Alert className="mb-4">
                                        <AlertDescription>
                                            {endReason === "time"
                                                ? t("multiT.finished.timeUp")
                                                : t("multiT.finished.exLimit", {count: correctCount + wrongCount})}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <StatCard label={t("multiT.stats.correct")!} value={correctCount}/>
                                    <StatCard label={t("multiT.stats.wrong")!} value={wrongCount}/>
                                    <StatCard label={t("multiT.stats.accuracy")!} value={`${accuracy}%`}/>
                                    <StatCard label={t("multiT.stats.time")!} value={formatTime(elapsedSec)}/>
                                    {timerMinutes > 0 && (
                                        <StatCard
                                            label={t("multiT.stats.timeLeft")!}
                                            value={formatTime(timerMinutes * 60 - elapsedSec)}
                                        />
                                    )}
                                </div>

                                {/* Current task */}
                                {gameOver === false &&
                                    <div className="text-center mb-6">
                                        <div
                                            className="text-4xl sm:text-6xl font-semibold tracking-wide select-none">
                                            {a} <span aria-hidden>{op === "mul" ? "×" : "÷"}</span>{" "}
                                            <span
                                                className="sr-only">{op === "mul" ? t("multiT.sr.mul") : t("multiT.sr.div")}</span> {b} =
                                        </div>

                                        <div className="mt-4 flex items-center justify-center gap-3">
                                            {mode === "input" ? (
                                                <>
                                                    <Input
                                                        ref={inputRef}
                                                        type="number"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        placeholder={t("multiT.input.placeholder") || ""}
                                                        aria-label={t("multiT.aria.answerField") || undefined}
                                                        value={answer}
                                                        onChange={(e) => setAnswer(e.target.value)}
                                                        onKeyDown={onKeyDown}
                                                        disabled={gameOver}
                                                        className="w-40 text-center text-2xl sm:text-3xl rounded-xl"
                                                    />
                                                    <Button onClick={() => submit()} disabled={gameOver}
                                                            className="text-lg">
                                                        {t("multiT.input.submit")}
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
                                                            aria-label={t("multiT.quiz.optionAria", {opt}) || undefined}
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
                                                    {lastCorrect === true && <span role="img"
                                                                                   aria-label={t("multiT.aria.correct") || undefined}>✅</span>}
                                                    {lastCorrect === false && <span role="img"
                                                                                    aria-label={t("multiT.aria.wrong") || undefined}>❌</span>}
                      </span>
                                            )}
                                        </div>

                                        {mode === "input" && (
                                            <p className="mt-2 text-xs text-muted-foreground">{t("multiT.input.hint")}</p>
                                        )}
                                    </div>}
                            </div>

                            {/* Right column: history */}
                            <div className="h-full overflow-auto rounded-xl border">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead
                                                className="px-4 text-center">{t("multiT.table.example")}</TableHead>
                                            <TableHead
                                                className="px-4 text-center">{t("multiT.table.answer")}</TableHead>
                                            <TableHead
                                                className="px-4 text-center">{t("multiT.table.result")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length === 0 ? (
                                            <TableRow>
                                                <TableCell className="px-4 py-3 text-muted-foreground" colSpan={3}>
                                                    {t("multiT.table.empty")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map((h, idx) => (
                                                <TableRow key={idx} className="border-t">
                                                    <TableCell className="px-4 py-2 text-center whitespace-nowrap">
                                                        {h.a} {h.op === "mul" ? "×" : "÷"} {h.b}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2 text-center">{h.answer}</TableCell>
                                                    <TableCell className="px-4 py-2 align-top">
                                                        {h.correct ? (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-green-700">
                                <span role="img" aria-label={t("multiT.aria.correct") || undefined}>✅</span>
                                                                {t("multiT.table.correct")}
                              </span>
                                                        ) : (
                                                            <div
                                                                className="text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span role="img"
                                                                          aria-label={t("multiT.aria.wrong") || undefined}>❌</span>
                                                                    {t("multiT.table.incorrect", {correct: h.op === "mul" ? h.a * h.b : Math.floor(h.a / h.b)})}
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
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}:</Label>
            {children}
        </div>
    );
}

function StatCard({label, value}: { label: string; value: number | string }) {
    return (
        <Card className="rounded-xl border shadow-sm min-w-20 py-0">
            <CardContent className="px-3 py-1.5">
                <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
                <div className="text-base font-semibold leading-tight">{value}</div>
            </CardContent>
        </Card>
    );
}
