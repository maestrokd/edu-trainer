import React, {useEffect, useRef, useState} from "react";

interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface QuizQ {
    a: number;
    b: number;
    answer?: number;
    correct?: boolean;
}

// Fireworks particles
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;    // seconds lived
    ttl: number;     // total lifetime
    color: string;   // hex color
    size: number;    // radius in px
}

const FIREWORK_COLORS = ["#ff3b30", "#ffcc00", "#34c759", "#5ac8fa", "#007aff", "#af52de", "#ff2d55"];

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function RabbitJumpX9({numQuestions = 3}: { numQuestions?: number }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fxCanvasRef = useRef<HTMLCanvasElement | null>(null); // top fireworks canvas
    const loopRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const gameAreaRef = useRef<HTMLDivElement | null>(null);

    // UI state
    const [score, setScore] = useState(0);
    const [paused, setPaused] = useState(false);
    const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
    const [quizIndex, setQuizIndex] = useState(0);
    const [started, setStarted] = useState(false);
    const [quizCount, setQuizCount] = useState<number>(numQuestions);
    const [message, setMessage] = useState<string | null>(null);
    const [won, setWon] = useState(false);

    // Game state (mutable ref, avoids per-frame React re-renders)
    const gameRef = useRef({
        time: 0,
        width: 800,
        height: 450,
        groundY: 380,
        gravity: 1800,
        jumpV: -700,
        rabbit: {x: 120, y: 380, vy: 0, w: 46, h: 42},
        speed: 260,
        flowers: [] as Obstacle[],
        nextSpawn: 0,
        // finish/threshold flags
        speedBoosted: false,
        spawnedFinish: false,
        finishX: null as number | null,
        finished: false,
        // fireworks
        fireworks: [] as Particle[],
        fireworkTimer: 0,
        fireworkNext: 0,
    });

    // Resize canvases to the game area container size (responsive)
    useEffect(() => {
        const base = canvasRef.current;
        const fx = fxCanvasRef.current;
        const container = gameAreaRef.current;
        if (!base || !fx || !container) return;

        const resizeToContainer = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            const targetW = Math.max(200, rect.width);
            const targetH = Math.max(200, rect.height);
            // style sizes
            base.style.width = `${targetW}px`;
            base.style.height = `${targetH}px`;
            fx.style.width = `${targetW}px`;
            fx.style.height = `${targetH}px`;
            // backing sizes
            const g = gameRef.current;
            g.width = Math.floor(targetW * dpr);
            g.height = Math.floor(targetH * dpr);
            base.width = g.width;
            base.height = g.height;
            fx.width = g.width;
            fx.height = g.height;
            g.groundY = Math.floor(g.height * 0.84);
            // clear fx canvas when resizing
            const ctxFx = fx.getContext("2d");
            ctxFx?.clearRect(0, 0, g.width, g.height);
        };

        resizeToContainer();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => resizeToContainer());
            ro.observe(container);
        } else {
            const onResize = () => resizeToContainer();
            window.addEventListener("resize", onResize);
            return () => window.removeEventListener("resize", onResize);
        }
        return () => {
            ro?.disconnect();
        };
    }, []);

    // Track desktop breakpoint to toggle layouts and focus targets
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const sync = () => setIsDesktop(mq.matches);
        sync();
        if (mq.addEventListener) mq.addEventListener("change", sync);
        else if ((mq as any).addListener) (mq as any).addListener(sync);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", sync);
            else if ((mq as any).removeListener) (mq as any).removeListener(sync);
        };
    }, []);

    // Ensure input is focused when quiz is shown or layout changes
    useEffect(() => {
        if (paused && quiz) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [paused, quizIndex, isDesktop, quiz]);

    const focusCanvas = () => {
        const el = canvasRef.current;
        if (el) {
            try {
                el.focus({preventScroll: true} as any);
            } catch {
            }
        }
    };

    // Input handlers (ignored until started and not paused)
    useEffect(() => {
        const onPointer = (e: Event) => {
            e.preventDefault();
            const g = gameRef.current;
            if (!started || paused || g.finished) return;
            jump();
        };
        const onKey = (e: KeyboardEvent) => {
            if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
                e.preventDefault();
                const g = gameRef.current;
                if (!started || paused || g.finished) return;
                jump();
            }
        };
        const el = canvasRef.current!;
        el.addEventListener("pointerdown", onPointer, {passive: false});
        window.addEventListener("keydown", onKey, {passive: false});
        return () => {
            el.removeEventListener("pointerdown", onPointer as any);
            window.removeEventListener("keydown", onKey);
        };
    }, [paused, started]);

    const jump = () => {
        const g = gameRef.current;
        if (g.rabbit.y >= g.groundY - g.rabbit.h - 4) {
            g.rabbit.vy = g.jumpV;
        }
    };

    // Helpers to apply thresholds based on new score value
    const handleThresholds = (newScore: number) => {
        const g = gameRef.current;
        if (newScore >= 10 && !g.speedBoosted) {
            g.speed = Math.min(620, g.speed + 90); // little faster at 10
            g.speedBoosted = true;
            setMessage("Speed up! 🚀");
            setTimeout(() => setMessage(null), 900);
        }
        if (newScore >= 15 && !g.spawnedFinish) {
            g.spawnedFinish = true;
            g.finishX = g.width + 20; // spawn finish line off-screen right
            setMessage("Finish ahead! 🏁");
            setTimeout(() => setMessage(null), 900);
        }
    };

    // Main game loop
    useEffect(() => {
        let last = performance.now();
        const tick = (now: number) => {
            const g = gameRef.current;
            const base = canvasRef.current!;
            const ctx = base.getContext("2d")!;
            const fx = fxCanvasRef.current!;
            const fxCtx = fx.getContext("2d")!;
            const dt = Math.min(0.033, (now - last) / 1000);
            last = now;

            if (!paused && started && !g.finished) {
                g.time += dt;

                // Spawn flowers only until finish is spawned
                g.nextSpawn -= dt;
                if (!g.spawnedFinish && g.nextSpawn <= 0) {
                    const flowerSize = randRange(36, 56);
                    const space = randRange(0.9, 1.6);
                    g.flowers.push({
                        x: g.width + flowerSize,
                        y: g.groundY - flowerSize,
                        w: flowerSize,
                        h: flowerSize,
                    });
                    g.nextSpawn = space;
                    g.speed = Math.min(520, g.speed + 0.3);
                }

                // Physics
                g.rabbit.vy += g.gravity * dt;
                g.rabbit.y += g.rabbit.vy * dt;
                if (g.rabbit.y > g.groundY - g.rabbit.h) {
                    g.rabbit.y = g.groundY - g.rabbit.h;
                    g.rabbit.vy = 0;
                }

                // Move flowers
                for (const f of g.flowers) f.x -= g.speed * dt;
                // Move finish line if spawned
                if (g.spawnedFinish && g.finishX != null) {
                    g.finishX -= g.speed * dt;
                    // When finish passes rabbit, win
                    if (g.finishX <= g.rabbit.x + g.rabbit.w) {
                        if (!g.finished) {
                            g.finished = true;
                            startFireworks();
                            setWon(true);
                            setMessage(null);
                            setPaused(false);
                            setQuiz(null);
                        }
                    }
                }

                // remove off-screen flowers -> score++ and thresholds
                while (g.flowers.length && g.flowers[0].x + g.flowers[0].w < -20) {
                    g.flowers.shift();
                    setScore((s) => {
                        const ns = s + 1;
                        handleThresholds(ns);
                        return ns;
                    });
                }

                // collision (only before finish)
                if (!g.spawnedFinish) {
                    const r = {x: g.rabbit.x, y: g.rabbit.y, w: g.rabbit.w, h: g.rabbit.h};
                    for (const f of g.flowers) {
                        if (aabb(r, f)) {
                            triggerQuiz();
                            break;
                        }
                    }
                }
            }

            // Fireworks update runs always (even when finished)
            updateFireworks(dt);

            draw(ctx);
            drawFireworksTop(fxCtx); // draw on top canvas so it's never covered

            loopRef.current = requestAnimationFrame(tick);
        };
        loopRef.current = requestAnimationFrame(tick);
        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
        };
    }, [paused, started]);

    const aabb = (a: { x: number; y: number; w: number; h: number }, b: Obstacle) =>
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    const draw = (ctx: CanvasRenderingContext2D) => {
        const g = gameRef.current;
        const W = g.width;
        const H = g.height;

        // Background
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#c7f0ff";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#7bc96f";
        ctx.fillRect(0, g.groundY, W, H - g.groundY);

        // Rabbit & obstacles
        drawRabbit(ctx, g.rabbit.x, g.rabbit.y, g.rabbit.w, g.rabbit.h);
        for (const f of g.flowers) drawFlower(ctx, f);

        // Finish line
        if (g.spawnedFinish && g.finishX != null) {
            drawFinishLine(ctx, g.finishX, g.groundY, H);
        }
    };

    function drawRabbit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        const r = Math.min(w, h) * 0.25;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, x, y, w, h, r);
        ctx.fill();
        // eyes
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(x + w * 0.35, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
        ctx.arc(x + w * 0.65, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
        ctx.fill();
        // ears
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + w * 0.15, y - h * 0.6, w * 0.22, h * 0.6);
        ctx.fillRect(x + w * 0.63, y - h * 0.6, w * 0.22, h * 0.6);
        ctx.fillStyle = "#ff9ec7";
        ctx.fillRect(x + w * 0.19, y - h * 0.45, w * 0.14, h * 0.45);
        ctx.fillRect(x + w * 0.67, y - h * 0.45, w * 0.14, h * 0.45);
        // nose
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.55, Math.max(2, w * 0.06), 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFlower(ctx: CanvasRenderingContext2D, f: Obstacle) {
        ctx.fillStyle = "#2e7d32"; // stem
        ctx.fillRect(f.x + f.w * 0.45, f.y + f.h * 0.3, f.w * 0.1, f.h * 0.7);
        ctx.fillStyle = "#ffd54f"; // petals
        const petals = 6;
        for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2;
            const px = f.x + f.w * 0.5 + Math.cos(angle) * f.w * 0.3;
            const py = f.y + f.h * 0.3 + Math.sin(angle) * f.h * 0.3;
            roundRect(ctx, px - f.w * 0.18, py - f.h * 0.18, f.w * 0.36, f.h * 0.36, f.w * 0.12);
            ctx.fill();
        }
        ctx.fillStyle = "#ff8a00"; // center
        ctx.beginPath();
        ctx.arc(f.x + f.w * 0.5, f.y + f.h * 0.3, f.w * 0.16, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFinishLine(ctx: CanvasRenderingContext2D, x: number, groundY: number, H: number) {
        const poleW = 10;
        const bannerW = 22;
        const height = Math.min(160, (H - groundY) + 120);
        const top = groundY - height;
        // pole
        ctx.fillStyle = "#555";
        ctx.fillRect(x - poleW, top, poleW, height);
        // checker banner
        const w = bannerW;
        const h = Math.min(120, height - 20);
        const cell = 10;
        for (let ry = 0; ry < h; ry += cell) {
            for (let rx = 0; rx < w; rx += cell) {
                ctx.fillStyle = (Math.floor(rx / cell) + Math.floor(ry / cell)) % 2 === 0 ? "#fff" : "#000";
                ctx.fillRect(x, top + ry, Math.min(cell, w - rx), Math.min(cell, h - ry));
            }
        }
    }

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        r = clamp(r, 0, Math.min(w, h) / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // ----- FIREWORKS (BRIGHT, TOP-LAYER) -----
    const startFireworks = () => {
        const g = gameRef.current;
        g.fireworks = [];
        g.fireworkTimer = 3.0;  // a bit longer
        g.fireworkNext = 0;     // spawn immediately
        const W = g.width, H = g.height;
        for (let i = 0; i < 5; i++) {
            spawnBurst(randRange(W * 0.2, W * 0.8), randRange(H * 0.22, H * 0.55));
        }
    };

    const spawnBurst = (cx: number, cy: number) => {
        const g = gameRef.current;
        const count = 80; // denser
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randRange(150, 420);
            const color = FIREWORK_COLORS[(Math.random() * FIREWORK_COLORS.length) | 0];
            g.fireworks.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                ttl: randRange(1.1, 1.8),
                color,
                size: randRange(2.2, 4.4),
            });
        }
    };

    const updateFireworks = (dt: number) => {
        const g = gameRef.current;
        if (!started) return;

        if (g.fireworkTimer > 0) {
            g.fireworkTimer -= dt;
            g.fireworkNext -= dt;
            if (g.fireworkNext <= 0) {
                const W = g.width, H = g.height;
                spawnBurst(randRange(W * 0.15, W * 0.85), randRange(H * 0.2, H * 0.5));
                g.fireworkNext = randRange(0.2, 0.4);
            }
        }

        if (!g.fireworks.length) return;

        const gravity = 420;     // px/s^2
        const drag = 0.985;
        for (let i = g.fireworks.length - 1; i >= 0; i--) {
            const p = g.fireworks[i];
            p.life += dt;
            if (p.life > p.ttl) {
                g.fireworks.splice(i, 1);
                continue;
            }
            p.vx *= drag;
            p.vy = p.vy * drag + gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    };

    const drawFireworksTop = (ctx: CanvasRenderingContext2D) => {
        const g = gameRef.current;
        const W = g.width, H = g.height;
        // Always clear the top canvas first
        ctx.clearRect(0, 0, W, H);
        if (!g.fireworks.length) return;

        ctx.save();
        ctx.globalCompositeOperation = "lighter"; // additive
        ctx.shadowBlur = 24; // strong glow

        for (const p of g.fireworks) {
            const t = p.life / p.ttl;           // 0..1
            const alpha = Math.min(1, Math.pow(1 - t, 0.6) * 1.2); // brighter falloff
            const [r, gg, b] = hexToRgb(p.color);

            // White hot core
            ctx.shadowColor = "#ffffff";
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.6, p.size * 0.6), 0, Math.PI * 2);
            ctx.fill();

            // Colored glow
            ctx.shadowColor = p.color;
            ctx.fillStyle = `rgba(${r},${gg},${b},${alpha})`;
            ctx.beginPath();
            const rad = Math.max(0.8, p.size * (1.4 - 0.8 * t));
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    function hexToRgb(hex: string): [number, number, number] {
        const s = hex.startsWith('#') ? hex.slice(1) : hex;
        const r = parseInt(s.slice(0, 2), 16);
        const g = parseInt(s.slice(2, 4), 16);
        const b = parseInt(s.slice(4, 6), 16);
        return [r, g, b];
    }

    // ----- QUIZ -----
    const makeQuiz = (): QuizQ[] => {
        const qs: QuizQ[] = [];
        const used = new Set<number>();
        while (qs.length < quizCount) {
            const b = Math.floor(randRange(2, 13)); // 2..12
            if (used.has(b)) continue;
            used.add(b);
            qs.push({a: 9, b});
        }
        return qs;
    };

    const triggerQuiz = () => {
        // Do not spawn quiz after finish is spawned
        if (gameRef.current.spawnedFinish) return;
        setPaused(true);
        setQuiz(makeQuiz());
        setQuizIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const submitAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quiz) return;
        const idx = quizIndex;
        const q = quiz[idx];
        const value = Number(inputRef.current?.value || NaN);
        const correct = value === q.a * q.b;
        const next = [...quiz];
        next[idx] = {...q, answer: value, correct};
        setQuiz(next);

        if (correct) {
            const lastIndex = quizCount - 1;
            if (idx >= lastIndex) {
                // Clear nearby flowers to avoid instant re-hit
                const g = gameRef.current;
                g.flowers = g.flowers.filter((f) => f.x - (g.rabbit.x + g.rabbit.w) > g.width * 0.2);
                setPaused(false);
                setQuiz(null); // hide quiz entirely
                setMessage(null);
                try {
                    inputRef.current?.blur();
                } catch {
                }
                focusCanvas();
            } else {
                setQuizIndex(idx + 1);
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.value = "";
                        inputRef.current.focus();
                    }
                }, 30);
            }
        } else {
            setMessage("Try again! ✏️");
            setTimeout(() => setMessage(null), 900);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.select();
                    inputRef.current.focus();
                }
            }, 30);
        }
    };

    return (
        <div className="w-screen h-[100dvh] bg-sky-100 flex flex-col lg:flex-row">
            <div ref={gameAreaRef} className="relative flex-1 h-full overflow-hidden">
                {/* Base world canvas */}
                <canvas
                    ref={canvasRef}
                    className="touch-none w-full h-full block"
                    aria-label="Rabbit jump game canvas"
                    tabIndex={0}
                />

                {/* Top fireworks canvas (always above overlays) */}
                <canvas
                    ref={fxCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-50"
                    aria-hidden
                />

                {/* HUD (score only) - mobile/tablet only */}
                {!isDesktop && (
                    <div className="absolute left-2 top-2 select-none z-20">
                        <div
                            className="px-3 py-1 rounded-xl bg-white/80 backdrop-blur border border-white/70 shadow text-slate-900 text-sm md:text-base font-semibold">
                            Score: {score}
                        </div>
                    </div>
                )}

                {/* Non-blocking toast message - mobile/tablet only */}
                {message && !isDesktop && (
                    <div
                        className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/70 text-white text-sm md:text-base shadow z-30">
                        {message}
                    </div>
                )}

                {/* Win overlay (below fireworks) - mobile/tablet only */}
                {won && !isDesktop && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-40"
                         role="dialog" aria-modal="true">
                        <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 shadow-xl space-y-4 text-center">
                            <h2 className="text-2xl font-bold">You finished! 🏁</h2>
                            <p className="text-slate-700">Final score: {score}</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                                    onClick={() => {
                                        // reset to start screen
                                        const g = gameRef.current;
                                        g.flowers = [];
                                        g.speed = 260;
                                        g.speedBoosted = false;
                                        g.spawnedFinish = false;
                                        g.finishX = null;
                                        g.finished = false;
                                        g.fireworks = [];
                                        g.fireworkTimer = 0;
                                        g.fireworkNext = 0;
                                        g.rabbit = {...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0};
                                        g.time = 0;
                                        // clear top canvas
                                        const fx = fxCanvasRef.current;
                                        if (fx) fx.getContext('2d')?.clearRect(0, 0, g.width, g.height);
                                        setScore(0);
                                        setWon(false);
                                        setStarted(false); // show start overlay again
                                        setMessage(null);
                                    }}
                                >
                                    Play again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Overlay with configurable question count - mobile/tablet only */}
                {!isDesktop && !started && !won && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-40"
                         role="dialog" aria-modal="true">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4">
                            <h2 className="text-xl font-bold">Rabbit Jump ×9</h2>
                            <p className="text-slate-600">
                                Tap/click or press Space to jump over flowers. If you hit a flower, answer ×9 questions
                                to continue.
                            </p>

                            <label className="text-sm font-medium block">
                                Number of questions on hit
                                <select
                                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                                    value={quizCount}
                                    onChange={(e) => setQuizCount(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                                onClick={() => {
                                    // reset state for a fresh run
                                    const g = gameRef.current;
                                    g.flowers = [];
                                    g.speed = 260;
                                    g.speedBoosted = false;
                                    g.spawnedFinish = false;
                                    g.finishX = null;
                                    g.finished = false;
                                    g.fireworks = [];
                                    g.fireworkTimer = 0;
                                    g.fireworkNext = 0;
                                    g.rabbit = {...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0};
                                    g.time = 0;
                                    // clear top canvas
                                    const fx = fxCanvasRef.current;
                                    if (fx) fx.getContext('2d')?.clearRect(0, 0, g.width, g.height);
                                    setScore(0);
                                    setStarted(true);
                                    setMessage(null);
                                    focusCanvas();
                                }}
                            >
                                Start
                            </button>
                        </div>
                    </div>
                )}

                {/* Quiz Modal - mobile/tablet only */}
                {!isDesktop && paused && quiz && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-40"
                         role="dialog" aria-modal="true">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                            <h2 className="text-xl font-bold mb-3">Answer ×9 to continue ({quizCount} total)</h2>
                            <div className="flex gap-1 mb-3" aria-hidden>
                                {quiz.map((q, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 flex-1 rounded ${
                                            i < quizIndex ? (q.correct ? "bg-green-500" : "bg-red-500") : i === quizIndex ? "bg-blue-500" : "bg-slate-300"
                                        }`}
                                    />
                                ))}
                            </div>

                            <form onSubmit={submitAnswer}
                                  className="grid grid-cols-1 sm:grid-cols-[auto,1fr,auto] gap-3 items-center">
                                <label className="text-lg font-medium sm:text-right" htmlFor="answer">
                                    {quiz[quizIndex].a} × {quiz[quizIndex].b} =
                                </label>
                                <input
                                    id="answer"
                                    ref={!isDesktop ? inputRef : null}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="?"
                                    aria-label="Type your answer"
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                                >
                                    OK
                                </button>
                            </form>

                            <p className="mt-3 text-slate-600 text-sm">
                                Tip: press <kbd className="px-1 py-0.5 border rounded">Space</kbd> / tap to jump.
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex w-[360px] max-w-[420px] flex-col border-l border-slate-200 bg-white/70 backdrop-blur p-4 gap-4">
                {/* Score */}
                <div className="select-none">
                    <div
                        className="px-3 py-1 rounded-xl bg-white border border-white/70 shadow text-slate-900 text-sm md:text-base font-semibold">
                        Score: {score}
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className="px-3 py-1.5 rounded-full bg-black/70 text-white text-sm shadow self-start">
                        {message}
                    </div>
                )}

                {/* Start Panel */}
                {!started && !won && (
                    <div className="rounded-2xl bg-white p-5 shadow border">
                        <h2 className="text-xl font-bold mb-2">Rabbit Jump ×9</h2>
                        <p className="text-slate-600 mb-3">
                            Press Space to jump. If you hit a flower, answer ×9 questions to continue.
                        </p>
                        <label className="text-sm font-medium block">
                            Number of questions on hit
                            <select
                                className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                                value={quizCount}
                                onChange={(e) => setQuizCount(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            className="mt-4 w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                            onClick={() => {
                                // reset state for a fresh run
                                const g = gameRef.current;
                                g.flowers = [];
                                g.speed = 260;
                                g.speedBoosted = false;
                                g.spawnedFinish = false;
                                g.finishX = null;
                                g.finished = false;
                                g.fireworks = [];
                                g.fireworkTimer = 0;
                                g.fireworkNext = 0;
                                g.rabbit = {...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0};
                                g.time = 0;
                                // clear top canvas
                                const fx = fxCanvasRef.current;
                                if (fx) fx.getContext('2d')?.clearRect(0, 0, g.width, g.height);
                                setScore(0);
                                setStarted(true);
                                setMessage(null);
                                focusCanvas();
                            }}
                        >
                            Start
                        </button>
                    </div>
                )}

                {/* Quiz Panel */}
                {isDesktop && paused && quiz && (
                    <div className="rounded-2xl bg-white p-5 shadow border">
                        <h2 className="text-xl font-bold mb-3">Answer ×9 to continue ({quizCount} total)</h2>
                        <div className="flex gap-1 mb-3" aria-hidden>
                            {quiz.map((q, i) => (
                                <div
                                    key={i}
                                    className={`h-2 flex-1 rounded ${
                                        i < quizIndex ? (q.correct ? 'bg-green-500' : 'bg-red-500') : i === quizIndex ? 'bg-blue-500' : 'bg-slate-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <form onSubmit={submitAnswer}
                              className="grid grid-cols-1 sm:grid-cols-[auto,1fr,auto] gap-3 items-center">
                            <label className="text-lg font-medium sm:text-right" htmlFor="answer-desktop">
                                {quiz[quizIndex].a} × {quiz[quizIndex].b} =
                            </label>
                            <input
                                id="answer-desktop"
                                ref={isDesktop ? inputRef : null}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="?"
                                aria-label="Type your answer"
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                            >
                                OK
                            </button>
                        </form>
                        <p className="mt-3 text-slate-600 text-sm">
                            Tip: press <kbd className="px-1 py-0.5 border rounded">Space</kbd> / click to jump.
                        </p>
                    </div>
                )}

                {/* Win Panel */}
                {isDesktop && won && (
                    <div className="rounded-2xl bg-white p-5 shadow border text-center space-y-4">
                        <h2 className="text-2xl font-bold">You finished! 🏁</h2>
                        <p className="text-slate-700">Final score: {score}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.99]"
                                onClick={() => {
                                    // reset to start screen
                                    const g = gameRef.current;
                                    g.flowers = [];
                                    g.speed = 260;
                                    g.speedBoosted = false;
                                    g.spawnedFinish = false;
                                    g.finishX = null;
                                    g.finished = false;
                                    g.fireworks = [];
                                    g.fireworkTimer = 0;
                                    g.fireworkNext = 0;
                                    g.rabbit = {...g.rabbit, y: g.groundY - g.rabbit.h, vy: 0};
                                    g.time = 0;
                                    // clear top canvas
                                    const fx = fxCanvasRef.current;
                                    if (fx) fx.getContext('2d')?.clearRect(0, 0, g.width, g.height);
                                    setScore(0);
                                    setWon(false);
                                    setStarted(false); // show start overlay again
                                    setMessage(null);
                                }}
                            >
                                Play again
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
