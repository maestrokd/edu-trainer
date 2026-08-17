import { useCallback, useEffect, useRef } from "react";
import { canAdvanceRabbitWorld } from "../lib/game-loop";

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RabbitGameEngineOptions {
  runId: number;
  running: boolean;
  paused: boolean;
  askOnHit: boolean;
  effectsEnabled: boolean;
  onScoreChange: (score: number) => void;
  onQuizRequested: () => void;
  onFinished: () => void;
  onMessage: (message: "speedUp" | "finishAhead" | "ouch") => void;
}

interface GameWorld {
  width: number;
  height: number;
  groundY: number;
  gravity: number;
  jumpVelocity: number;
  rabbit: { x: number; y: number; vy: number; w: number; h: number };
  speed: number;
  flowers: Obstacle[];
  nextSpawn: number;
  jumpsAvailable: number;
  speedBoosted: boolean;
  spawnedFinish: boolean;
  finishX: number | null;
  finished: boolean;
  score: number;
  celebrationTimer: number;
  celebrationPhase: number;
  hitCooldown: number;
}

const createWorld = (): GameWorld => ({
  width: 800,
  height: 450,
  groundY: 380,
  gravity: 1800,
  jumpVelocity: -700,
  rabbit: { x: 120, y: 338, vy: 0, w: 46, h: 42 },
  speed: 260,
  flowers: [],
  nextSpawn: 0.8,
  jumpsAvailable: 2,
  speedBoosted: false,
  spawnedFinish: false,
  finishX: null,
  finished: false,
  score: 0,
  celebrationTimer: 0,
  celebrationPhase: 0,
  hitCooldown: 0,
});

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const supportsVibration = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export function useRabbitGameEngine(options: RabbitGameEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<GameWorld>(createWorld());
  const frameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundTimeoutsRef = useRef<number[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const ensureAudioContext = useCallback(() => {
    if (!optionsRef.current.effectsEnabled) return null;
    const AudioContextConstructor = (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined;

    if (!audioContextRef.current && AudioContextConstructor) {
      try {
        audioContextRef.current = new AudioContextConstructor();
      } catch {
        return null;
      }
    }

    if (audioContextRef.current?.state === "suspended") void audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, volume = 0.12, type: OscillatorType = "sine") => {
      const context = ensureAudioContext();
      if (!context) return;

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    },
    [ensureAudioContext]
  );

  const scheduleTone = useCallback(
    (delay: number, ...tone: Parameters<typeof playTone>) => {
      const timeout = window.setTimeout(() => playTone(...tone), delay);
      soundTimeoutsRef.current.push(timeout);
    },
    [playTone]
  );

  const playSound = useCallback(
    (kind: "jump" | "hit" | "correct" | "wrong" | "finish") => {
      if (!optionsRef.current.effectsEnabled) return;
      if (kind === "jump") playTone(620, 0.08, 0.06, "triangle");
      if (kind === "hit") {
        playTone(180, 0.12, 0.12, "sawtooth");
        playTone(90, 0.14, 0.08, "square");
      }
      if (kind === "correct") {
        playTone(720, 0.08, 0.08, "triangle");
        scheduleTone(50, 860, 0.1, 0.06, "triangle");
      }
      if (kind === "wrong") {
        playTone(260, 0.1, 0.12, "sawtooth");
        scheduleTone(60, 200, 0.1, 0.08, "sawtooth");
      }
      if (kind === "finish") {
        playTone(760, 0.14, 0.1, "triangle");
        scheduleTone(70, 920, 0.16, 0.08, "triangle");
        scheduleTone(140, 1080, 0.18, 0.06, "triangle");
      }
    },
    [playTone, scheduleTone]
  );

  const vibrate = useCallback((pattern: number | number[]) => {
    if (optionsRef.current.effectsEnabled && supportsVibration()) navigator.vibrate(pattern);
  }, []);

  const prepareLandingSpace = useCallback((collidedX?: number) => {
    const world = worldRef.current;
    const safeGap = world.width * 0.18;
    world.flowers = world.flowers.filter((flower) => {
      if (collidedX != null && flower.x <= collidedX + flower.w) return false;
      return flower.x - (world.rabbit.x + world.rabbit.w) > safeGap;
    });
    world.rabbit.y = Math.min(world.rabbit.y, world.groundY - world.rabbit.h);
    world.rabbit.vy = 0;
    world.jumpsAvailable = 2;
    world.hitCooldown = 0.8;
    world.nextSpawn = Math.max(world.nextSpawn, 0.5);
  }, []);

  const jump = useCallback(() => {
    const world = worldRef.current;
    const current = optionsRef.current;
    if (!current.running || current.paused || world.finished || world.jumpsAvailable <= 0) return;
    ensureAudioContext();
    world.rabbit.vy = world.jumpVelocity;
    world.jumpsAvailable -= 1;
    playSound("jump");
  }, [ensureAudioContext, playSound]);

  const playQuizFeedback = useCallback(
    (correct: boolean) => {
      playSound(correct ? "correct" : "wrong");
      vibrate(correct ? 80 : [60, 30, 60]);
    },
    [playSound, vibrate]
  );

  const updateWorld = useCallback(
    (world: GameWorld, elapsed: number, current: RabbitGameEngineOptions) => {
      if (world.hitCooldown > 0) world.hitCooldown = Math.max(0, world.hitCooldown - elapsed);

      world.nextSpawn -= elapsed;
      if (!world.spawnedFinish && world.nextSpawn <= 0) {
        const size = randomBetween(36, 56);
        world.flowers.push({ x: world.width + size, y: world.groundY - size, w: size, h: size });
        world.nextSpawn = randomBetween(0.9, 1.6);
        world.speed = Math.min(520, world.speed + 0.3);
      }

      world.rabbit.vy += world.gravity * elapsed;
      world.rabbit.y += world.rabbit.vy * elapsed;
      if (world.rabbit.y > world.groundY - world.rabbit.h) {
        world.rabbit.y = world.groundY - world.rabbit.h;
        world.rabbit.vy = 0;
        world.jumpsAvailable = 2;
      }

      world.flowers.forEach((flower) => {
        flower.x -= world.speed * elapsed;
      });

      if (world.spawnedFinish && world.finishX != null) {
        world.finishX -= world.speed * elapsed;
        if (world.finishX <= world.rabbit.x + world.rabbit.w) {
          world.finished = true;
          world.celebrationTimer = 2.6;
          world.celebrationPhase = 0;
          playSound("finish");
          vibrate([80, 40, 120]);
          current.onFinished();
        }
      }

      while (world.flowers.length && world.flowers[0].x + world.flowers[0].w < -20) {
        world.flowers.shift();
        world.score += 1;
        current.onScoreChange(world.score);

        if (world.score >= 10 && !world.speedBoosted) {
          world.speed = Math.min(620, world.speed + 90);
          world.speedBoosted = true;
          current.onMessage("speedUp");
        }
        if (world.score >= 15 && !world.spawnedFinish) {
          world.spawnedFinish = true;
          world.finishX = world.width + 20;
          current.onMessage("finishAhead");
        }
      }

      if (!world.spawnedFinish && world.hitCooldown <= 0) {
        const hitIndex = world.flowers.findIndex((flower) => intersects(world.rabbit, flower));
        if (hitIndex >= 0) {
          const collidedX = world.flowers[hitIndex]?.x;
          world.flowers.splice(hitIndex, 1);
          prepareLandingSpace(collidedX);
          playSound("hit");
          vibrate(180);
          if (current.askOnHit) current.onQuizRequested();
          else current.onMessage("ouch");
        }
      }
    },
    [playSound, prepareLandingSpace, vibrate]
  );

  const focusCanvas = useCallback(() => canvasRef.current?.focus({ preventScroll: true }), []);
  const prepareAfterQuiz = useCallback(() => prepareLandingSpace(), [prepareLandingSpace]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gameArea = gameAreaRef.current;
    if (!canvas || !gameArea) return;

    const resize = () => {
      const rect = gameArea.getBoundingClientRect();
      const width = Math.max(200, rect.width);
      const height = Math.max(200, rect.height);
      const dpr = window.devicePixelRatio || 1;
      const world = worldRef.current;
      const wasGrounded = world.rabbit.vy === 0 && world.rabbit.y >= world.groundY - world.rabbit.h - 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      world.width = width;
      world.height = height;
      world.groundY = Math.floor(height * 0.84);
      if (wasGrounded) world.rabbit.y = world.groundY - world.rabbit.h;
    };

    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(gameArea);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const previous = worldRef.current;
    const world = createWorld();
    world.width = previous.width;
    world.height = previous.height;
    world.groundY = previous.groundY;
    world.rabbit.y = world.groundY - world.rabbit.h;
    worldRef.current = world;
  }, [options.runId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointer = (event: PointerEvent) => {
      event.preventDefault();
      jump();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!["Space", "ArrowUp", "KeyW"].includes(event.code)) return;
      event.preventDefault();
      jump();
    };

    canvas.addEventListener("pointerdown", handlePointer, { passive: false });
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let previousTime = performance.now();

    const frame = (time: number) => {
      const world = worldRef.current;
      const current = optionsRef.current;
      const elapsed = Math.min(0.033, (time - previousTime) / 1000);
      previousTime = time;

      if (!current.paused) {
        if (world.celebrationTimer > 0) {
          world.celebrationTimer = Math.max(0, world.celebrationTimer - elapsed);
          world.celebrationPhase += elapsed;
        }

        if (canAdvanceRabbitWorld(current.running, current.paused, world.finished)) {
          updateWorld(world, elapsed, current);
        }
      }

      const context = canvas.getContext("2d");
      if (context) drawWorld(context, world, window.devicePixelRatio || 1);
      frameRef.current = requestAnimationFrame(frame);
    };

    frameRef.current = requestAnimationFrame(frame);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [updateWorld]);

  useEffect(
    () => () => {
      soundTimeoutsRef.current.forEach(window.clearTimeout);
      soundTimeoutsRef.current = [];
      if (audioContextRef.current) void audioContextRef.current.close();
    },
    []
  );

  return {
    canvasRef,
    gameAreaRef,
    focusCanvas,
    prepareAfterQuiz,
    playQuizFeedback,
  };
}

function intersects(a: Obstacle, b: Obstacle) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawWorld(context: CanvasRenderingContext2D, world: GameWorld, dpr: number) {
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, world.width, world.height);
  context.fillStyle = "#c7f0ff";
  context.fillRect(0, 0, world.width, world.height);
  context.fillStyle = "#7bc96f";
  context.fillRect(0, world.groundY, world.width, world.height - world.groundY);

  drawRabbit(context, world.rabbit);
  world.flowers.forEach((flower) => drawFlower(context, flower));
  if (world.spawnedFinish && world.finishX != null) {
    drawFinishLine(context, world.finishX, world.groundY, world.height);
  }
  if (world.finished) drawCelebration(context, world);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = clamp(radius, 0, Math.min(width, height) / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawRabbit(context: CanvasRenderingContext2D, rabbit: GameWorld["rabbit"]) {
  const { x, y, w, h } = rabbit;
  context.fillStyle = "#ffffff";
  roundedRect(context, x, y, w, h, Math.min(w, h) * 0.25);
  context.fill();
  context.fillStyle = "#333333";
  context.beginPath();
  context.arc(x + w * 0.35, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
  context.arc(x + w * 0.65, y + h * 0.35, Math.max(2, w * 0.06), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.fillRect(x + w * 0.15, y - h * 0.6, w * 0.22, h * 0.6);
  context.fillRect(x + w * 0.63, y - h * 0.6, w * 0.22, h * 0.6);
  context.fillStyle = "#ff9ec7";
  context.fillRect(x + w * 0.19, y - h * 0.45, w * 0.14, h * 0.45);
  context.fillRect(x + w * 0.67, y - h * 0.45, w * 0.14, h * 0.45);
  context.fillStyle = "#ff6b6b";
  context.beginPath();
  context.arc(x + w * 0.5, y + h * 0.55, Math.max(2, w * 0.06), 0, Math.PI * 2);
  context.fill();
}

function drawFlower(context: CanvasRenderingContext2D, flower: Obstacle) {
  context.fillStyle = "#2e7d32";
  context.fillRect(flower.x + flower.w * 0.45, flower.y + flower.h * 0.3, flower.w * 0.1, flower.h * 0.7);
  context.fillStyle = "#ffd54f";
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const x = flower.x + flower.w * 0.5 + Math.cos(angle) * flower.w * 0.3;
    const y = flower.y + flower.h * 0.3 + Math.sin(angle) * flower.h * 0.3;
    roundedRect(context, x - flower.w * 0.18, y - flower.h * 0.18, flower.w * 0.36, flower.h * 0.36, flower.w * 0.12);
    context.fill();
  }
  context.fillStyle = "#ff8a00";
  context.beginPath();
  context.arc(flower.x + flower.w * 0.5, flower.y + flower.h * 0.3, flower.w * 0.16, 0, Math.PI * 2);
  context.fill();
}

function drawFinishLine(context: CanvasRenderingContext2D, x: number, groundY: number, height: number) {
  const lineHeight = Math.min(160, height - groundY + 120);
  const top = groundY - lineHeight;
  context.fillStyle = "#555555";
  context.fillRect(x - 10, top, 10, lineHeight);
  const bannerHeight = Math.min(120, lineHeight - 20);
  for (let row = 0; row < bannerHeight; row += 10) {
    for (let column = 0; column < 22; column += 10) {
      context.fillStyle = (Math.floor(column / 10) + Math.floor(row / 10)) % 2 === 0 ? "#ffffff" : "#000000";
      context.fillRect(x + column, top + row, Math.min(10, 22 - column), Math.min(10, bannerHeight - row));
    }
  }
}

function drawCelebration(context: CanvasRenderingContext2D, world: GameWorld) {
  if (world.celebrationTimer <= 0) return;
  const centerX = world.rabbit.x + world.rabbit.w * 0.5;
  const centerY = world.rabbit.y + world.rabbit.h * 0.5;
  const remaining = world.celebrationTimer / 2.6;
  const radius = Math.min(world.width, world.height) * 0.18;
  const pulse = Math.sin(world.celebrationPhase * 4);

  context.save();
  context.globalAlpha = 0.6 * remaining;
  const glow = context.createRadialGradient(centerX, centerY, radius * 0.25, centerX, centerY, radius);
  glow.addColorStop(0, "rgba(255,255,255,0.95)");
  glow.addColorStop(1, "rgba(255,215,130,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, radius * (0.9 + 0.08 * pulse), 0, Math.PI * 2);
  context.fill();

  context.globalAlpha = 1;
  context.fillStyle = "#ffe8b3";
  context.strokeStyle = "#f59e0b";
  context.lineWidth = 3;
  const badgeRadius = Math.min(26, radius * 0.3);
  context.beginPath();
  context.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#b45309";
  context.font = `${badgeRadius * 0.9}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("★", centerX, centerY);
  context.restore();
}
