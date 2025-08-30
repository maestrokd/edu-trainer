import React from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";

// shadcn/ui primitives (same set your project already uses)
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Card, CardContent} from "@/components/ui/card";
import {Switch} from "@/components/ui/switch";

// ----------------------------------
// Types & constants
// ----------------------------------

type Screen = "setup" | "play";
type Mode = "input" | "quiz";

type MagnitudeMode = "digits" | "range";

type TargetPlace = 10 | 100 | 1000; // v1 only powers of 10

interface HistoryItem {
    original: number; // the number shown in the prompt
    target: TargetPlace; // what we rounded to
    user: number; // user's answer (as number)
    correctRounded: number; // correct rounded result
    correct: boolean;
    explanation: string; // short rule-based reason
}

// Digits choices for digits mode
const DIGITS_CHOICES = [1, 2, 3, 4, 5, 6, 7] as const;


// ----------------------------------
// i18n helper (centralize keys used below)
// ----------------------------------
function useRoundT() {
    const {t, i18n} = useTranslation();
    return {
        t,
        i18n,
        labels: {
            menu: t("roundT.menu", "Menu"),
            title: t("roundT.title", "Rounding Game"),
            backToMenu: t("roundT.aria.backToMenu", "Back to Menu"),
            newSession: t("roundT.newSession", "New session"),
            changeRange: t("roundT.changeRange", "Change setup"),
            start: t("roundT.start", "Start"),
            setupIntro: t(
                "roundT.setup.intro",
                "Choose what kind of numbers and places to practice."
            ),
            mode: t("roundT.setup.mode", "Mode"),
            modeInput: t("roundT.mode.input", "Input"),
            modeQuiz: t("roundT.mode.quiz", "Quiz"),
            timer: t("roundT.setup.timer", "Timer (minutes, 0 = unlimited)"),
            maxExercises: t("roundT.setup.maxExercises", "Max exercises (0 = unlimited)"),
            numberTypes: t("roundT.setup.numberTypes", "Number types"),
            wholeNumbers: t("roundT.setup.whole", "Whole numbers"),
            decimals: t("roundT.setup.decimals", "Decimals"),
            decimalPlaces: t("roundT.setup.decimalPlaces", "Decimal places"),
            signs: t("roundT.setup.signs", "Sign filters"),
            positives: t("roundT.setup.positives", "Positives"),
            negatives: t("roundT.setup.negatives", "Negatives"),
            magnitude: t("roundT.setup.magnitude", "Magnitude"),
            digitsMode: t("roundT.setup.digitsMode", "Digits range"),
            rangeMode: t("roundT.setup.rangeMode", "Numeric range"),
            minDigits: t("roundT.setup.minDigits", "Min digits"),
            maxDigits: t("roundT.setup.maxDigits", "Max digits"),
            minValue: t("roundT.setup.minValue", "Min value"),
            maxValue: t("roundT.setup.maxValue", "Max value"),
            targets: t("roundT.setup.targets", "Round to (multi-select)"),
            tens: t("roundT.targets.tens", "tens (10s)"),
            hundreds: t("roundT.targets.hundreds", "hundreds (100s)"),
            thousands: t("roundT.targets.thousands", "thousands (1000s)"),
            sounds: t("roundT.setup.sounds", "Enable sounds"),
            includeTie: t(
                "roundT.setup.includeTie",
                "Guarantee at least one tie-case (5) per session"
            ),
            showHint: t(
                "roundT.setup.showHint",
                "Show place-value hint under the prompt"
            ),
            note: t(
                "roundT.setup.note",
                "Tip: leave filters empty to include everything."
            ),
            // Play
            rangeAccuracy: (min: string, max: string, acc: number) =>
                t("roundT.rangeAccuracy", "Range: {{min}}–{{max}} · Accuracy: {{acc}}%", {
                    min,
                    max,
                    acc,
                }),
            statsCorrect: t("roundT.stats.correct", "Correct"),
            statsWrong: t("roundT.stats.wrong", "Wrong"),
            statsAccuracy: t("roundT.stats.accuracy", "Accuracy"),
            statsTime: t("roundT.stats.time", "Time"),
            statsTimeLeft: t("roundT.stats.timeLeft", "Time left"),
            finishedTime: t("roundT.finished.timeUp", "Time is up!"),
            finishedCount: t(
                "roundT.finished.exLimit",
                "Finished! You answered {{count}} tasks.",
                {count: 0}
            ),
            // Table
            tableExample: t("roundT.table.example", "Exercise"),
            tableAnswer: t("roundT.table.answer", "Answer"),
            tableResult: t("roundT.table.result", "Result"),
            tableEmpty: t("roundT.table.empty", "No attempts yet."),
            tableCorrect: t("roundT.table.correct", "Correct"),
            ariaCorrect: t("roundT.aria.correct", "correct"),
            ariaWrong: t("roundT.aria.wrong", "wrong"),
            // Prompt
            srTo: t("roundT.sr.to", "to"),
            inputPlaceholder: t("roundT.input.placeholder", "your answer"),
            inputSubmit: t("roundT.input.submit", "Submit"),
            inputHint: t(
                "roundT.input.hint",
                "Press Enter to submit, Esc to clear."
            ),
        },
    };
}

// ----------------------------------
// Utilities
// ----------------------------------

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function formatTime(totalSec: number) {
    const s = Math.max(0, Math.floor(totalSec));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(m)}:${pad(ss)}`;
}

function useLocaleNumberFormatter() {
    const {i18n} = useTranslation();
    const nf = React.useMemo(() => new Intl.NumberFormat(i18n.language || undefined), [i18n.language]);
    return (n: number) => nf.format(n);
}

// Accurate rAF timer (1s resolution, self-correcting)
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

// ----------------------------------
// Rounding logic (Half away from zero for ties)
// ----------------------------------

function roundHalfUpTo(n: number, place: TargetPlace): number {
    // Round to nearest multiple of `place` with tie (.5) going away from zero
    const x = n / place;
    const roundedInteger = roundHalfUpInteger(x);
    return roundedInteger * place;
}

function roundHalfUpInteger(x: number): number {
    if (!Number.isFinite(x)) return x;
    // Symmetric half-up: ties go away from zero
    return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

function floorToPlace(n: number, place: TargetPlace): number {
    // Truncation toward zero at place granularity
    const sign = Math.sign(n) || 1;
    const abs = Math.abs(n);
    const floored = Math.floor(abs / place) * place;
    return sign * floored;
}

function ceilToPlace(n: number, place: TargetPlace): number {
    const sign = Math.sign(n) || 1;
    const abs = Math.abs(n);
    const ceiled = Math.ceil(abs / place) * place;
    return sign * ceiled;
}

function getCheckDigitForPlace(n: number, place: TargetPlace): number {
    // For explanatory message: look at the digit one rank lower than `place`
    // Example: place=100 (hundreds) -> check tens digit
    const abs = Math.abs(Math.trunc(n));
    const lower = place / 10;
    if (lower < 1) return 0;
    return Math.floor((abs % place) / lower);
}

function makeExplanation(n: number, place: TargetPlace, correct: number): string {
    const targetLabel = place === 10 ? "tens" : place === 100 ? "hundreds" : "thousands";
    const check = getCheckDigitForPlace(n, place);
    const direction = check >= 5 ? "up" : "down";
    return `Round to ${targetLabel}: look at ${place === 10 ? "ones" : place === 100 ? "tens" : "hundreds"} (${check}) → ${direction} → ${correct}`;
}

// ----------------------------------
// Audio (simple SFX gated by a checkbox, single shared context)
// ----------------------------------

function useBeeps(enabled: boolean) {
    const ctxRef = React.useRef<AudioContext | null>(null);

    const ensureCtx = React.useCallback(async (): Promise<AudioContext | null> => {
        if (!enabled) return null;
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!ctxRef.current) {
            if (!Ctx) return null;
            ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        if (!ctx) return null;
        if (ctx.state === "suspended") await ctx.resume();
        return ctx;
    }, [enabled]);

    const beep = React.useCallback(
        async (freq = 880, durationMs = 120, gain = 0.05) => {
            if (!enabled) return;
            const ctx = await ensureCtx();
            if (!ctx) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = freq;
            g.gain.value = gain;
            o.connect(g).connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + durationMs / 1000);
        },
        [enabled, ensureCtx]
    );

    const chord = React.useCallback(async () => {
        // small celebratory triad
        await beep(523.25, 140, 0.06); // C5
        await beep(659.25, 140, 0.06); // E5
        await beep(783.99, 160, 0.06); // G5
    }, [beep]);

    return {beep, chord};
}

// ----------------------------------
// Main component
// ----------------------------------

export default function RoundingGame() {
    const RT = useRoundT();
    const fmt = useLocaleNumberFormatter();

    // UI state
    const [screen, setScreen] = React.useState<Screen>("setup");
    const [mode, setMode] = React.useState<Mode>("input");

    // Config: filters
    const [includeWhole, setIncludeWhole] = React.useState<boolean>(true);
    const [includeDecimals, setIncludeDecimals] = React.useState<boolean>(false);
    const [decimalPlaces, setDecimalPlaces] = React.useState<number>(1); // used when decimals enabled

    const [includePositives, setIncludePositives] = React.useState<boolean>(true);
    const [includeNegatives, setIncludeNegatives] = React.useState<boolean>(false);

    // Magnitude
    const [magMode, setMagMode] = React.useState<MagnitudeMode>("digits");
    const [minDigits, setMinDigits] = React.useState<number>(2);
    const [maxDigits, setMaxDigits] = React.useState<number>(4);
    const [minValue, setMinValue] = React.useState<number>(10);
    const [maxValue, setMaxValue] = React.useState<number>(9999);

    // Targets multi-select
    const [target10, setTarget10] = React.useState<boolean>(true);
    const [target100, setTarget100] = React.useState<boolean>(true);
    const [target1000, setTarget1000] = React.useState<boolean>(false);

    // Session options
    const [timerMinutes, setTimerMinutes] = React.useState<number>(0);
    const [maxExercises, setMaxExercises] = React.useState<number>(0);
    const [soundsEnabled, setSoundsEnabled] = React.useState<boolean>(false);
    const [includeTieCase, setIncludeTieCase] = React.useState<boolean>(false);
    const [showHint, setShowHint] = React.useState<boolean>(false);

    // Task state
    const [original, setOriginal] = React.useState<number>(0);
    const [target, setTarget] = React.useState<TargetPlace>(10);
    const [options, setOptions] = React.useState<number[]>([]);
    const [taskId, setTaskId] = React.useState<number>(0);

    // Input mode state
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

    const {beep, chord} = useBeeps(soundsEnabled);

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
        chord();
    }

    function selectedTargets(): TargetPlace[] {
        const arr: TargetPlace[] = [];
        if (target10) arr.push(10);
        if (target100) arr.push(100);
        if (target1000) arr.push(1000);
        if (arr.length === 0) return [10, 100, 1000]; // default if none selected
        return arr;
    }

    function typesFilterEmpty() {
        return !includeWhole && !includeDecimals;
    }

    function signsFilterEmpty() {
        return !includePositives && !includeNegatives;
    }

    function pickMagnitude(minPlace: TargetPlace): number {
        // Generate |n| according to magnitude constraints, then sign/decimals added later
        if (magMode === "digits") {
            let dMin = Math.min(minDigits, maxDigits);
            let dMax = Math.max(minDigits, maxDigits);
            dMin = clamp(dMin, 1, 10);
            dMax = clamp(dMax, 1, 10);
            // Ensure min digits large enough for minPlace
            const minDigitsFromPlace = Math.max(1, Math.ceil(Math.log10(minPlace + 1))); // e.g., 100 -> 3
            dMin = Math.max(dMin, minDigitsFromPlace);
            const digits = randInt(dMin, dMax);
            const low = 10 ** (digits - 1);
            const high = 10 ** digits - 1;
            return randInt(low, Math.max(low, high));
        } else {
            let vMin = Math.min(minValue, maxValue);
            let vMax = Math.max(minValue, maxValue);
            vMin = Math.max(1, vMin);
            vMax = Math.max(vMin, vMax);
            // Ensure coherence for minPlace
            vMin = Math.max(vMin, minPlace);
            return randInt(vMin, vMax);
        }
    }

    function maybeApplyDecimals(base: number): number {
        if (typesFilterEmpty() || includeDecimals) {
            // Decimals allowed
            if (includeDecimals && !includeWhole) {
                // decimals only
                return applyDecimals(base, decimalPlaces);
            }
            if (includeDecimals && includeWhole) {
                // 50/50 choose to add decimals
                return Math.random() < 0.5 ? base : applyDecimals(base, decimalPlaces);
            }
        }
        // Whole only or none filter means allow whole
        return base;
    }

    function applyDecimals(base: number, places: number): number {
        if (places <= 0) return base;
        const factor = 10 ** places;
        const frac = randInt(0, factor - 1) / factor;
        const res = base + frac;
        return res;
    }

    function applySign(mag: number): number {
        if (signsFilterEmpty()) {
            // both allowed
            return Math.random() < 0.5 ? mag : -mag;
        }
        if (includePositives && !includeNegatives) return mag;
        if (!includePositives && includeNegatives) return -mag;
        // both true -> random
        return Math.random() < 0.5 ? mag : -mag;
    }

    function pickNextTask() {
        const targets = selectedTargets();
        // Pick a target for this task
        const t = targets[randInt(0, targets.length - 1)];

        // Ensure magnitude supports `t`
        let magnitude = pickMagnitude(t);

        // Build candidate number according to filters
        let n = maybeApplyDecimals(magnitude);
        n = applySign(n);

        // Guardrail: ensure |n| >= t
        if (Math.abs(n) < t) n = (Math.sign(n) || 1) * (t + randInt(0, t - 1));

        // Optional: force a tie-case (.5) at least once
        if (includeTieCase && history.length === 0) {
            // Construct an exact 5 case relative to `t` (e.g., ...50 for tens, ...500 for thousands)
            const sign = Math.sign(n) || 1;
            const base = floorToPlace(Math.abs(n), t);
            const half = base + t / 2;
            n = sign * half;
        }

        setTarget(t);
        setOriginal(n);
        setAnswer("");

        if (mode === "quiz") {
            setOptions(generateOptions(n, t));
        } else {
            setOptions([]);
        }
        setTaskId((id) => id + 1);
    }

    function startGame() {
        // If no target selected, default to tens+hundreds+thousands
        if (!target10 && !target100 && !target1000) {
            setTarget10(true);
            setTarget100(true);
            setTarget1000(true);
        }
        clearSession();
        setScreen("play");
        pickNextTask();
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
            const parsed = parseFloat(answer.trim());
            if (Number.isNaN(parsed)) {
                inputRef.current?.focus();
                return;
            }
            user = parsed;
        }

        const correctRounded = roundHalfUpTo(original, target);
        const isCorrect = user === correctRounded;

        const item: HistoryItem = {
            original,
            target,
            user,
            correctRounded,
            correct: isCorrect,
            explanation: makeExplanation(original, target, correctRounded),
        };

        setHistory((h) => [item, ...h].slice(0, 200));
        setLastLine(`${fmt(original)} → ${targetLabel(target)} = ${fmt(user)}`);
        setLastCorrect(isCorrect);

        if (isCorrect) {
            setCorrectCount((c) => c + 1);
            beep(880, 100, 0.05);
        } else {
            setWrongCount((w) => w + 1);
            beep(220, 120, 0.05);
        }

        const totalAnswered = correctCount + wrongCount + 1;
        if (maxExercises > 0 && totalAnswered >= maxExercises) {
            endGame("ex");
            return;
        }

        pickNextTask();
    }

    function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") setAnswer("");
    }

    // ----------------------------
    // Render
    // ----------------------------

    return (
        <div
            className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50 flex flex-col p-2 sm:p-4 overflow-hidden">
            <div className="w-full flex flex-col h-full">
                {/* Top bar */}
                <div className="flex items-center gap-2 justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" className="px-3 py-2 h-auto text-xs sm:text-sm">
                            <Link to="/" aria-label={RT.labels.backToMenu}>
                                {RT.labels.menu}
                            </Link>
                        </Button>
                        <span className="hidden sm:inline text-xs text-gray-600">{RT.labels.title}</span>
                    </div>

                    {screen === "play" && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={newSession}
                                variant="outline"
                                className="text-xs sm:text-sm h-auto px-3 py-2"
                                aria-label={RT.labels.newSession}
                            >
                                {RT.labels.newSession}
                            </Button>
                            <Button
                                onClick={backToSetup}
                                variant="outline"
                                className="text-xs sm:text-sm h-auto px-3 py-2"
                                aria-label={RT.labels.changeRange}
                            >
                                {RT.labels.changeRange}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center text-center">
                    {screen === "play" && (
                        <span className="w-full text-[10px] sm:text-xs text-gray-500">
              {RT.labels.rangeAccuracy(minRangeLabel(), maxRangeLabel(), accuracy)}
            </span>
                    )}
                </div>

                {screen === "setup" ? (
                    <div
                        className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-5xl mx-auto w-full">
                        <p className="text-gray-700 mb-4">{RT.labels.setupIntro}</p>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Left: Mode, Timer, Max, Sounds */}
                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <LabeledField label={RT.labels.mode} htmlFor="mode-select">
                                        <Select value={mode} onValueChange={(val) => setMode(val as Mode)}>
                                            <SelectTrigger id="mode-select" className="rounded-xl w-full h-10">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="input">{RT.labels.modeInput}</SelectItem>
                                                <SelectItem value="quiz">{RT.labels.modeQuiz}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </LabeledField>

                                    <LabeledField label={RT.labels.timer} htmlFor="timer-min">
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

                                    <LabeledField label={RT.labels.maxExercises} htmlFor="max-ex">
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

                                    <div className="flex items-center gap-3">
                                        <Switch checked={soundsEnabled} onCheckedChange={setSoundsEnabled}
                                                id="sound-switch"/>
                                        <label htmlFor="sound-switch" className="text-sm text-gray-700">
                                            {RT.labels.sounds}
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Right: Number type & sign filters */}
                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">{RT.labels.numberTypes}</div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <label className="inline-flex items-center gap-2">
                                                <Checkbox id="whole-check" checked={includeWhole}
                                                          onCheckedChange={(v) => setIncludeWhole(Boolean(v))}/>
                                                <span className="text-sm text-gray-700">{RT.labels.wholeNumbers}</span>
                                            </label>
                                            <label className="inline-flex items-center gap-2">
                                                <Checkbox id="dec-check" checked={includeDecimals}
                                                          onCheckedChange={(v) => setIncludeDecimals(Boolean(v))}/>
                                                <span className="text-sm text-gray-700">{RT.labels.decimals}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <LabeledField label={RT.labels.decimalPlaces} htmlFor="dec-places">
                                        <Select
                                            value={String(decimalPlaces)}
                                            onValueChange={(val) => setDecimalPlaces(parseInt(val, 10))}
                                            disabled={!includeDecimals}
                                        >
                                            <SelectTrigger id="dec-places" className="rounded-xl w-full h-10">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[0, 1, 2].map((n) => (
                                                    <SelectItem key={n} value={String(n)}>
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </LabeledField>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">{RT.labels.signs}</div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <label className="inline-flex items-center gap-2">
                                                <Checkbox id="pos-check" checked={includePositives}
                                                          onCheckedChange={(v) => setIncludePositives(Boolean(v))}/>
                                                <span className="text-sm text-gray-700">{RT.labels.positives}</span>
                                            </label>
                                            <label className="inline-flex items-center gap-2">
                                                <Checkbox id="neg-check" checked={includeNegatives}
                                                          onCheckedChange={(v) => setIncludeNegatives(Boolean(v))}/>
                                                <span className="text-sm text-gray-700">{RT.labels.negatives}</span>
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Magnitude & Targets */}
                        <div className="grid gap-6 lg:grid-cols-2 mt-6">
                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">{RT.labels.magnitude}</div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={magMode === "digits" ? "default" : "outline"}
                                                className="h-8 px-3"
                                                onClick={() => setMagMode("digits")}
                                            >
                                                {RT.labels.digitsMode}
                                            </Button>
                                            <Button
                                                variant={magMode === "range" ? "default" : "outline"}
                                                className="h-8 px-3"
                                                onClick={() => setMagMode("range")}
                                            >
                                                {RT.labels.rangeMode}
                                            </Button>
                                        </div>
                                    </div>

                                    {magMode === "digits" ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <LabeledField label={RT.labels.minDigits} htmlFor="min-digits">
                                                <Select value={String(minDigits)}
                                                        onValueChange={(val) => setMinDigits(parseInt(val, 10))}>
                                                    <SelectTrigger id="min-digits" className="rounded-xl w-full h-10">
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DIGITS_CHOICES.map((n) => (
                                                            <SelectItem key={n} value={String(n)}>
                                                                {n}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </LabeledField>
                                            <LabeledField label={RT.labels.maxDigits} htmlFor="max-digits">
                                                <Select value={String(maxDigits)}
                                                        onValueChange={(val) => setMaxDigits(parseInt(val, 10))}>
                                                    <SelectTrigger id="max-digits" className="rounded-xl w-full h-10">
                                                        <SelectValue/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DIGITS_CHOICES.map((n) => (
                                                            <SelectItem key={n} value={String(n)}>
                                                                {n}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </LabeledField>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <LabeledField label={RT.labels.minValue} htmlFor="min-value">
                                                <Input
                                                    id="min-value"
                                                    type="number"
                                                    value={minValue}
                                                    onChange={(e) => setMinValue(parseInt(e.target.value || "0", 10) || 0)}
                                                    className="rounded-xl"
                                                />
                                            </LabeledField>
                                            <LabeledField label={RT.labels.maxValue} htmlFor="max-value">
                                                <Input
                                                    id="max-value"
                                                    type="number"
                                                    value={maxValue}
                                                    onChange={(e) => setMaxValue(parseInt(e.target.value || "0", 10) || 0)}
                                                    className="rounded-xl"
                                                />
                                            </LabeledField>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 sm:p-6 grid gap-4">
                                    <div className="text-sm text-gray-600">{RT.labels.targets}</div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <label className="inline-flex items-center gap-2">
                                            <Checkbox id="t10" checked={target10}
                                                      onCheckedChange={(v) => setTarget10(Boolean(v))}/>
                                            <span className="text-sm text-gray-700">{RT.labels.tens}</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <Checkbox id="t100" checked={target100}
                                                      onCheckedChange={(v) => setTarget100(Boolean(v))}/>
                                            <span className="text-sm text-gray-700">{RT.labels.hundreds}</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <Checkbox id="t1000" checked={target1000}
                                                      onCheckedChange={(v) => setTarget1000(Boolean(v))}/>
                                            <span className="text-sm text-gray-700">{RT.labels.thousands}</span>
                                        </label>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-2">
                                        <label className="inline-flex items-center gap-2">
                                            <Checkbox id="tie" checked={includeTieCase}
                                                      onCheckedChange={(v) => setIncludeTieCase(Boolean(v))}/>
                                            <span className="text-sm text-gray-700">{RT.labels.includeTie}</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <Checkbox id="hint" checked={showHint}
                                                      onCheckedChange={(v) => setShowHint(Boolean(v))}/>
                                            <span className="text-sm text-gray-700">{RT.labels.showHint}</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                            <Button onClick={startGame} className="w-full sm:w-auto">
                                {RT.labels.start}
                            </Button>
                            <Button asChild variant="outline" className="w-full sm:w-auto">
                                <Link to="/" aria-label={RT.labels.backToMenu}>
                                    {RT.labels.menu}
                                </Link>
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">{RT.labels.note}</p>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                            {/* Left column */}
                            <div className="flex flex-col min-h-0">
                                {/* Finished banner */}
                                {gameOver && (
                                    <Alert className="mb-4 bg-emerald-50 border-emerald-200 text-emerald-900">
                                        <AlertDescription>
                                            {endReason === "time" ? RT.labels.finishedTime : RT.labels.finishedCount}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <StatCard label={RT.labels.statsCorrect} value={correctCount}/>
                                    <StatCard label={RT.labels.statsWrong} value={wrongCount}/>
                                    <StatCard label={RT.labels.statsAccuracy} value={`${accuracy}%`}/>
                                    <StatCard label={RT.labels.statsTime} value={formatTime(elapsedSec)}/>
                                    {timerMinutes > 0 && (
                                        <StatCard label={RT.labels.statsTimeLeft}
                                                  value={formatTime(timerMinutes * 60 - elapsedSec)}/>
                                    )}
                                </div>

                                {/* Current task */}
                                {gameOver === false && (
                                    <div className="text-center mb-6">
                                        <div
                                            className="text-3xl sm:text-5xl font-semibold tracking-wide text-gray-900 select-none">
                                            {fmt(original)} <span aria-hidden>→</span> <span
                                            className="sr-only">{RT.labels.srTo}</span> {targetLabel(target)}
                                        </div>

                                        {showHint && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                {renderHint(original, target)}
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-center gap-3">
                                            {mode === "input" ? (
                                                <>
                                                    <Input
                                                        ref={inputRef}
                                                        type="number"
                                                        inputMode="decimal"
                                                        placeholder={RT.labels.inputPlaceholder}
                                                        aria-label={RT.labels.inputPlaceholder}
                                                        value={answer}
                                                        onChange={(e) => setAnswer(e.target.value)}
                                                        onKeyDown={onInputKeyDown}
                                                        disabled={gameOver}
                                                        className="w-48 text-center text-2xl sm:text-3xl rounded-xl"
                                                    />
                                                    <Button onClick={() => submit()} disabled={gameOver}
                                                            className="text-lg">
                                                        {RT.labels.inputSubmit}
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
                                                            aria-label={`${opt}`}
                                                            disabled={gameOver}
                                                            className="px-5 py-4 text-2xl font-medium"
                                                        >
                                                            {fmt(opt)}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 text-lg sm:text-xl" aria-live="polite" aria-atomic="true">
                                            {lastLine && (
                                                <span className="inline-flex items-center gap-2">
                          <span className="font-medium">{lastLine}</span>
                                                    {lastCorrect === true && (
                                                        <span role="img" aria-label={RT.labels.ariaCorrect}>
                              ✅
                            </span>
                                                    )}
                                                    {lastCorrect === false && (
                                                        <span role="img" aria-label={RT.labels.ariaWrong}>
                              ❌
                            </span>
                                                    )}
                        </span>
                                            )}
                                        </div>

                                        {mode === "input" && (
                                            <p className="mt-2 text-xs text-gray-500">{RT.labels.inputHint}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right column: history */}
                            <div className="h-full overflow-auto rounded-xl border border-gray-200 bg-white">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-gray-50">
                                        <TableRow>
                                            <TableHead className="px-4 text-center">{RT.labels.tableExample}</TableHead>
                                            <TableHead className="px-4 text-center">{RT.labels.tableAnswer}</TableHead>
                                            <TableHead className="px-4 text-center">{RT.labels.tableResult}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length === 0 ? (
                                            <TableRow>
                                                <TableCell className="px-4 py-3 text-gray-500" colSpan={3}>
                                                    {RT.labels.tableEmpty}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map((h, idx) => (
                                                <TableRow key={idx} className="border-t border-gray-100">
                                                    <TableCell className="px-4 py-2 text-center whitespace-nowrap">
                                                        {fmt(h.original)} → {targetLabel(h.target)}
                                                    </TableCell>
                                                    <TableCell
                                                        className="px-4 py-2 text-center">{fmt(h.user)}</TableCell>
                                                    <TableCell className="px-4 py-2 align-top">
                                                        {h.correct ? (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-green-700">
                                <span role="img" aria-label={RT.labels.ariaCorrect}>
                                  ✅
                                </span>
                                                                {RT.labels.tableCorrect}
                              </span>
                                                        ) : (
                                                            <div
                                                                className="text-red-700 whitespace-normal break-words text-pretty leading-tight max-w-[12rem] sm:max-w-none">
                                <span className="inline-flex items-center gap-1">
                                  <span role="img" aria-label={RT.labels.ariaWrong}>
                                    ❌
                                  </span>
                                    {h.explanation} (correct: {fmt(h.correctRounded)})
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

    // ------ helpers nested to access hooks safely ------

    function minRangeLabel() {
        if (magMode === "digits") return `${minDigits}d`;
        return fmt(minValue);
    }

    function maxRangeLabel() {
        if (magMode === "digits") return `${maxDigits}d`;
        return fmt(maxValue);
    }

    function renderHint(n: number, place: TargetPlace) {
        const abs = Math.abs(Math.trunc(n));
        const check = getCheckDigitForPlace(n, place);
        const dir = check >= 5 ? "↑" : "↓";
        return (
            <span>
        {place === 10 && (
            <>
                Look at <b>ones</b> digit of {fmt(abs)}: <b>{abs % 10}</b> {dir}
            </>
        )}
                {place === 100 && (
                    <>
                        Look at <b>tens</b> digit of {fmt(abs)}: <b>{Math.floor((abs % 100) / 10)}</b> {dir}
                    </>
                )}
                {place === 1000 && (
                    <>
                        Look at <b>hundreds</b> digit of {fmt(abs)}: <b>{Math.floor((abs % 1000) / 100)}</b> {dir}
                    </>
                )}
      </span>
        );
    }
}

// ----------------------------------
// Option generator (quiz mode)
// ----------------------------------

function generateOptions(n: number, place: TargetPlace): number[] {
    const correct = roundHalfUpTo(n, place);

    const down = floorToPlace(n, place); // truncation/toward zero
    const up = ceilToPlace(n, place); // away from zero

    const check = getCheckDigitForPlace(n, place);
    const actualDir = check >= 5 ? "up" : "down";
    const theOtherWay = actualDir === "up" ? down : up;

    // Wrong place: adjacent valid place (prefer lower; tens uses hundreds)
    const wrongPlace: TargetPlace = place === 10 ? 100 : place === 100 ? 10 : 100;
    const wrongPlaceValue = roundHalfUpTo(n, wrongPlace);

    const set = new Set<number>([correct, theOtherWay, down, wrongPlaceValue]);

    // Ensure 4 unique; nudge if collisions
    let safety = 0;
    while (set.size < 4 && safety++ < 10) {
        const bump = Math.round(place / 10) || 1;
        set.add(correct + (Math.random() < 0.5 ? -bump : bump));
    }

    return shuffle(Array.from(set)).slice(0, 4);
}

function targetLabel(place: TargetPlace): string {
    if (place === 10) return "tens";
    if (place === 100) return "hundreds";
    return "thousands";
}

// ----------------------------------
// Small presentational pieces
// ----------------------------------

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
