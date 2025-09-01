import React from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";

// ТРЕНАЖЕР ТАБЛИЧКИ МНОЖЕННЯ
// ----------------------------------------------
// Особливості:
// • Вибір діапазону (мін/макс) перед стартом
// • Приклади у форматі: 5 × 8 = або 40 ÷ 5 =
// • Користувач вводить відповідь (наприклад: 40) і одразу бачить: 5 × 8 = 40 ✅/❌
// • Лічильник правильних/неправильних, точність, історія відповідей
// • Кнопка "Нова сесія" скидає статистику
// • Адаптивний повноекранний інтерфейс (телефон/компʼютер)

// Порада: вставте цей компонент як головний у Vite + React проєкті.
// Tailwind рекомендується для стилів (класи вже додані нижче).

// Допоміжні типи
type Op = "mul" | "div";

interface HistoryItem {
    a: number; // лівий операнд (для ділення: ділене)
    b: number; // правий операнд (для ділення: дільник)
    answer: number;
    correct: boolean;
    op: Op;
}

type Screen = "setup" | "play";

type Mode = "input" | "quiz";

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

export default function MultiplicationTrainer1() {
    const {t} = useTranslation();
    const [mode, setMode] = React.useState<Mode>("input");
    const [screen, setScreen] = React.useState<Screen>("setup");
    const [minVal, setMinVal] = React.useState<number>(4);
    const [maxVal, setMaxVal] = React.useState<number>(9);

    const [includeMul, setIncludeMul] = React.useState<boolean>(true);
    const [includeDiv, setIncludeDiv] = React.useState<boolean>(true);

    const [a, setA] = React.useState<number>(0);
    const [b, setB] = React.useState<number>(0);
    const [op, setOp] = React.useState<Op>("mul");
    const [answer, setAnswer] = React.useState<string>("");
    const [options, setOptions] = React.useState<number[]>([]);
    const [lastLine, setLastLine] = React.useState<string>("");
    const [lastCorrect, setLastCorrect] = React.useState<boolean | null>(null);

    const [correctCount, setCorrectCount] = React.useState<number>(0);
    const [wrongCount, setWrongCount] = React.useState<number>(0);
    const [history, setHistory] = React.useState<HistoryItem[]>([]);
    // Used to force remounting of quiz option buttons to avoid lingering hover/focus on touch devices
    const [taskId, setTaskId] = React.useState<number>(0);

    const inputRef = React.useRef<HTMLInputElement>(null);

    // Timer and session controls
    const [timerMinutes, setTimerMinutes] = React.useState<number>(0); // 0 = unlimited
    const [maxExercises, setMaxExercises] = React.useState<number>(0); // 0 = unlimited
    // const [startTs, setStartTs] = React.useState<number | null>(null);
    const [elapsedSec, setElapsedSec] = React.useState<number>(0);
    const [gameOver, setGameOver] = React.useState<boolean>(false);
    const [endReason, setEndReason] = React.useState<"time" | "ex" | null>(null);
    const tickRef = React.useRef<number | null>(null);

    const accuracy = React.useMemo(() => {
        const total = correctCount + wrongCount;
        if (total === 0) return 0;
        return Math.round((correctCount / total) * 100);
    }, [correctCount, wrongCount]);

    function clearTick() {
        if (tickRef.current != null) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }
    }

    function startTimer() {
        clearTick();
        setElapsedSec(0);
        setGameOver(false);
        setEndReason(null);
        // Tick every 1s
        tickRef.current = window.setInterval(() => {
            setElapsedSec((s) => s + 1);
        }, 1000) as unknown as number;
    }

    function endGame(reason: "time" | "ex") {
        clearTick();
        setGameOver(true);
        setEndReason(reason);
    }

    // Cleanup on unmount
    React.useEffect(() => {
        return () => clearTick();
    }, []);

    // Auto-stop when countdown reaches zero
    React.useEffect(() => {
        if (screen !== "play" || gameOver) return;
        if (timerMinutes > 0) {
            const total = timerMinutes * 60;
            if (elapsedSec >= total) {
                endGame("time");
            }
        }
    }, [elapsedSec, screen, gameOver, timerMinutes]);

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
        // generate close distractors around correct
        const deltas = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
        let attempts = 0;
        while (opts.size < 4 && attempts < 100) {
            const d = deltas[randInt(0, deltas.length - 1)];
            let candidate = correct + d;
            if (candidate < 0) candidate = Math.abs(candidate);
            if (candidate === correct) {
                attempts++;
                continue;
            }
            opts.add(candidate);
            attempts++;
        }
        // if not enough (edge cases), fill with random plausible numbers near correct
        while (opts.size < 4) {
            const candidate = Math.max(0, correct + randInt(-9, 9));
            if (candidate !== correct) opts.add(candidate);
        }
        return shuffle(Array.from(opts)).slice(0, 4);
    }

    function nextTask(min = minVal, max = maxVal) {
        // Визначаємо операцію згідно вибору користувача
        let chosenOp: Op = "mul";
        if (includeMul && includeDiv) {
            chosenOp = Math.random() < 0.5 ? "mul" : "div";
        } else if (includeDiv && !includeMul) {
            chosenOp = "div";
        } else {
            // Якщо жодної не вибрано (запасний варіант) — множення
            chosenOp = "mul";
        }

        let na = 0;
        let nb = 0;
        let correct = 0;

        if (chosenOp === "mul") {
            na = randInt(min, max);
            nb = randInt(1, 12);
            correct = na * nb;
        } else {
            // Ділення: генеруємо кратну пару, щоб результат був цілим
            const multiplicand = randInt(min, max);
            const multiplier = randInt(1, 12);
            const product = multiplicand * multiplier;
            // Випадково показуємо product ÷ multiplicand або product ÷ multiplier
            if (Math.random() < 0.5) {
                na = product; // ділене
                nb = multiplicand; // дільник
                correct = multiplier; // частка
            } else {
                na = product; // ділене
                nb = multiplier; // дільник
                correct = multiplicand; // частка
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
            // Затримка фокусу, щоб дочекатися відмальовування
            setTimeout(() => inputRef.current?.focus(), 0);
        }
        // bump task id to force remounting quiz options and clear any lingering touch hover/focus
        setTaskId((id) => id + 1);
    }

    function startGame() {
        let startMin = Math.min(minVal, maxVal);
        let startMax = Math.max(minVal, maxVal);

        // Обмежимо розумним діапазоном 2..12
        startMin = Math.max(2, Math.min(12, startMin));
        startMax = Math.max(2, Math.min(12, startMax));

        setMinVal(startMin);
        setMaxVal(startMax);

        // Якщо користувач зняв обидві галочки, за замовчуванням увімкнемо множення
        if (!includeMul && !includeDiv) {
            setIncludeMul(true);
        }

        setCorrectCount(0);
        setWrongCount(0);
        setHistory([]);
        setLastLine("");
        setLastCorrect(null);
        setGameOver(false);
        setEndReason(null);
        setElapsedSec(0);

        setScreen("play");
        // start timer and first task
        startTimer();
        nextTask(startMin, startMax);
    }

    function submit(chosen?: number) {
        if (gameOver) return;
        let user: number;
        if (typeof chosen === "number") {
            user = chosen;
        } else {
            const parsed = parseInt(answer.trim(), 10);
            if (Number.isNaN(parsed)) {
                // ніжне підсвічування для помилки вводу
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
        nextTask();
    }

    function newSession() {
        // Почати заново, залишивши обраний діапазон
        setCorrectCount(0);
        setWrongCount(0);
        setHistory([]);
        setLastLine("");
        setLastCorrect(null);
        setGameOver(false);
        setEndReason(null);
        setElapsedSec(0);
        startTimer();
        nextTask();
    }

    function backToSetup() {
        clearTick();
        setGameOver(false);
        setEndReason(null);
        setScreen("setup");
    }

    // Обробка Enter
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            submit();
        }
    }

    return (
        <div
            className="min-h-dvh w-full bg-gradient-to-br from-sky-50 to-indigo-50 flex flex-col p-2 sm:p-4 overflow-hidden">
            <div className="w-full flex flex-col h-full">
                {/* Compact top bar */}
                <div className="flex items-center gap-2 justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white/70 text-gray-800 backdrop-blur border border-gray-200 hover:bg-white shadow-sm"
                            aria-label={t('multiT.aria.backToMenu')}
                        >
                            {t('multiT.menu')}
                        </Link>
                        <span className="hidden sm:inline text-xs text-gray-600">{t('multiT.title')}</span>
                        {screen === "play" && (
                            <span className="text-[10px] sm:text-xs text-gray-500">{t('multiT.rangeAccuracy', {
                                min: minVal,
                                max: maxVal,
                                acc: accuracy
                            })}</span>
                        )}
                    </div>
                    {screen === "play" && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={newSession}
                                className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm"
                                aria-label={t('multiT.aria.newSession')}
                            >
                                {t('multiT.newSession')}
                            </button>
                            <button
                                onClick={backToSetup}
                                className="text-xs sm:text-sm rounded-xl px-3 py-2 bg-white/70 text-gray-800 backdrop-blur border border-gray-200 hover:bg-white shadow-sm"
                                aria-label={t('multiT.aria.changeRange')}
                            >
                                {t('multiT.changeRange')}
                            </button>
                        </div>
                    )}
                </div>

                {screen === "setup" ? (
                    <div
                        className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-3xl mx-auto w-full">
                        <p className="text-gray-700 mb-4">
                            {t('multiT.setup.intro')} <b>4…9</b>.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <label className="flex flex-col">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.min')}</span>
                                <select
                                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={minVal}
                                    onChange={(e) => setMinVal(parseInt(e.target.value, 10))}
                                    aria-label={t('multiT.aria.minRange')}
                                >
                                    {Array.from({length: 11}, (_, i) => i + 2).map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.max')}</span>
                                <select
                                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={maxVal}
                                    onChange={(e) => setMaxVal(parseInt(e.target.value, 10))}
                                    aria-label={t('multiT.aria.maxRange')}
                                >
                                    {Array.from({length: 11}, (_, i) => i + 2).map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.mode')}</span>
                                <select
                                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as Mode)}
                                    aria-label={t('multiT.aria.mode')}
                                >
                                    <option value="input">{t('multiT.mode.input')}</option>
                                    <option value="quiz">{t('multiT.mode.quiz')}</option>
                                </select>
                            </label>

                            <div className="flex flex-col sm:col-span-2 lg:col-span-3">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.exercises')}</span>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300"
                                            checked={includeMul}
                                            onChange={(e) => setIncludeMul(e.target.checked)}
                                            aria-label={t('multiT.aria.includeMul')}
                                        />
                                        <span className="text-sm text-gray-700">{t('multiT.ex.mul')}</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300"
                                            checked={includeDiv}
                                            onChange={(e) => setIncludeDiv(e.target.checked)}
                                            aria-label={t('multiT.aria.includeDiv')}
                                        />
                                        <span className="text-sm text-gray-700">{t('multiT.ex.div')}</span>
                                    </label>
                                </div>
                            </div>

                            <label className="flex flex-col">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.timer')}</span>
                                <input
                                    type="number"
                                    min={0}
                                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={timerMinutes}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setTimerMinutes(Number.isFinite(v) ? Math.max(0, v) : 0);
                                    }}
                                    aria-label={t('multiT.aria.timerMinutes')}
                                />
                            </label>

                            <label className="flex flex-col">
                                <span className="text-sm text-gray-600 mb-1">{t('multiT.setup.maxExercises')}</span>
                                <input
                                    type="number"
                                    min={0}
                                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={maxExercises}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setMaxExercises(Number.isFinite(v) ? Math.max(0, v) : 0);
                                    }}
                                    aria-label={t('multiT.aria.maxExercises')}
                                />
                            </label>

                            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:col-span-2 lg:col-span-3">
                                <button
                                    onClick={startGame}
                                    className="mt-2 sm:mt-0 w-full sm:w-auto rounded-xl px-5 py-3 bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    aria-label={t('multiT.aria.startGame')}
                                >
                                    {t('multiT.start')}
                                </button>
                                <Link
                                    to="/"
                                    className="mt-2 sm:mt-0 w-full sm:w-auto rounded-xl px-4 py-3 bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm text-center"
                                    aria-label={t('multiT.aria.backToMenu')}
                                >
                                    {t('multiT.menu')}
                                </Link>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                            {t('multiT.setup.note')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 flex-1 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                            {/* Left column: stats + current task */}
                            <div className="flex flex-col min-h-0">
                                {/* Статистика */}
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <Stat label={t('multiT.stats.correct')} value={correctCount}/>
                                    <Stat label={t('multiT.stats.wrong')} value={wrongCount}/>
                                    <Stat label={t('multiT.stats.accuracy')} value={`${accuracy}%`}/>
                                    <Stat label={t('multiT.stats.time')} value={formatTime(elapsedSec)}/>
                                    {timerMinutes > 0 && (
                                        <Stat label={t('multiT.stats.timeLeft')}
                                              value={formatTime(timerMinutes * 60 - elapsedSec)}/>
                                    )}
                                </div>

                                {/* Поточний приклад */}
                                <div className="text-center mb-6">
                                    {gameOver && (
                                        <div
                                            className="mb-4 inline-block rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2">
                                            {endReason === "time" ? t('multiT.finished.timeUp') : t('multiT.finished.exLimit', {count: correctCount + wrongCount})}
                                        </div>
                                    )}
                                    <div
                                        className="text-4xl sm:text-6xl font-semibold tracking-wide text-gray-900 select-none">
                                        {a} <span aria-hidden>{op === "mul" ? "×" : "÷"}</span> <span
                                        className="sr-only">{op === "mul" ? t('multiT.sr.mul') : t('multiT.sr.div')}</span> {b} =
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        {mode === "input" ? (
                                            <>
                                                <input
                                                    ref={inputRef}
                                                    type="number"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className="w-40 text-center text-2xl sm:text-3xl rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
                                                    placeholder={t('multiT.input.placeholder')}
                                                    aria-label={t('multiT.aria.answerField')}
                                                    value={answer}
                                                    onChange={(e) => setAnswer(e.target.value)}
                                                    onKeyDown={onKeyDown}
                                                    disabled={gameOver}
                                                />
                                                <button
                                                    onClick={() => submit()}
                                                    className="rounded-xl px-5 py-3 bg-indigo-600 text-white text-lg font-medium hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={gameOver}
                                                >
                                                    {t('multiT.input.submit')}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                                {options.map((opt, idx) => (
                                                    <button
                                                        key={`${taskId}-${idx}`}
                                                        onClick={(e) => {
                                                            (e.currentTarget as HTMLButtonElement).blur();
                                                            if (!gameOver) submit(opt);
                                                        }}
                                                        onTouchEnd={(e) => {
                                                            (e.currentTarget as HTMLButtonElement).blur();
                                                        }}
                                                        className="rounded-xl px-5 py-4 bg-white border border-gray-300 hover:bg-indigo-50 text-2xl font-medium text-gray-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label={t('multiT.quiz.optionAria', {opt})}
                                                        disabled={gameOver}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="mt-4 text-lg sm:text-xl"
                                        aria-live="polite"
                                        aria-atomic="true"
                                    >
                                        {lastLine && (
                                            <span className="inline-flex items-center gap-2">
                                                    <span className="font-medium">{lastLine}</span>
                                                {lastCorrect === true &&
                                                    <span role="img" aria-label={t('multiT.aria.correct')}>✅</span>}
                                                {lastCorrect === false &&
                                                    <span role="img" aria-label={t('multiT.aria.wrong')}>❌</span>}
                                                </span>
                                        )}
                                    </div>
                                    {mode === "input" && (
                                        <p className="mt-2 text-xs text-gray-500">{t('multiT.input.hint')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Right column: history */}
                            <div className="h-full overflow-auto rounded-xl border border-gray-200 bg-white">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold text-gray-700">{t('multiT.table.example')}</th>
                                        <th className="px-4 py-2 font-semibold text-gray-700">{t('multiT.table.answer')}</th>
                                        <th className="px-4 py-2 font-semibold text-gray-700">{t('multiT.table.result')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {history.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-500" colSpan={3}>
                                                {t('multiT.table.empty')}
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((h, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="px-4 py-2 whitespace-nowrap">{h.a} {h.op === "mul" ? "×" : "÷"} {h.b}</td>
                                                <td className="px-4 py-2">{h.answer}</td>
                                                <td className="px-4 py-2">
                                                    {h.correct ? (
                                                        <span className="inline-flex items-center gap-1 text-green-700">
                                                                <span role="img"
                                                                      aria-label={t('multiT.aria.correct')}>✅</span>
                                                            {t('multiT.table.correct')}
                                                            </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-700">
                                                                <span role="img"
                                                                      aria-label={t('multiT.aria.wrong')}>❌</span>
                                                            {t('multiT.table.incorrect', {correct: h.op === "mul" ? h.a * h.b : Math.floor(h.a / h.b)})}
                                                            </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({label, value}: { label: string; value: number | string }) {
    return (
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-2 shadow-sm min-w-[120px]">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-semibold text-gray-900">{value}</div>
        </div>
    );
}
