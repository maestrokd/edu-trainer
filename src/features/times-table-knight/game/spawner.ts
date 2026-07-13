import { mulberry32, randInt, type Rng } from "../lib/random";
import {
  ADVENTURE_ANVIL_COUNT,
  ADVENTURE_CREATURE_COUNT,
  ADVENTURE_SCROLL_COUNT,
  VIEW_HEIGHT,
} from "../model/game.constants";
import type { CreatureSpawn, Rect, StagePlan, StationSpawn, Vec } from "./entities";
import type { EngineConfig, PowerUpKind } from "./events";

export const GROUND_Y = VIEW_HEIGHT - 60;
const GROUND_THICKNESS = 80;
const FLOAT_PLATFORM_H = 14;

interface PitSpan {
  minX: number;
  maxX: number;
}

/** creepy-creature roster by level band: tougher stages, scarier woods */
function creatureRoster(level: number): { emoji: string; behavior: "walker" | "flyer" }[] {
  if (level <= 5)
    return [
      { emoji: "🐌", behavior: "walker" },
      { emoji: "🦇", behavior: "flyer" },
    ];
  if (level <= 10)
    return [
      { emoji: "🕷️", behavior: "walker" },
      { emoji: "👻", behavior: "flyer" },
    ];
  return [
    { emoji: "🐺", behavior: "walker" },
    { emoji: "🧟", behavior: "walker" },
    { emoji: "🦅", behavior: "flyer" },
  ];
}

export function bossEmoji(level: number): string {
  if (level <= 5) return "🧌";
  if (level <= 10) return "🐲";
  return "🐉";
}

function groundSegments(width: number, pits: PitSpan[]): Rect[] {
  const segments: Rect[] = [];
  let cursor = 0;
  for (const pit of [...pits].sort((a, b) => a.minX - b.minX)) {
    if (pit.minX > cursor) {
      segments.push({ x: cursor, y: GROUND_Y, w: pit.minX - cursor, h: GROUND_THICKNESS });
    }
    cursor = pit.maxX;
  }
  if (cursor < width) segments.push({ x: cursor, y: GROUND_Y, w: width - cursor, h: GROUND_THICKNESS });
  return segments;
}

function insidePit(x: number, pits: PitSpan[], margin = 40): boolean {
  return pits.some((p) => x > p.minX - margin && x < p.maxX + margin);
}

function shiftOutOfPits(x: number, pits: PitSpan[]): number {
  let shifted = x;
  let guard = 0;
  while (insidePit(shifted, pits) && guard < 10) {
    const pit = pits.find((p) => shifted > p.minX - 40 && shifted < p.maxX + 40);
    if (!pit) break;
    shifted = pit.maxX + 60;
    guard++;
  }
  return shifted;
}

function coinArc(centerX: number, topY: number, count: number): Vec[] {
  const coins: Vec[] = [];
  const spread = 36;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = centerX + (t - 0.5) * spread * (count - 1);
    const y = topY + Math.sin(t * Math.PI) * -26;
    coins.push({ x, y });
  }
  return coins;
}

function buildPracticeStage(config: EngineConfig, rng: Rng): StagePlan {
  const creatureCount = Math.max(1, config.practiceCreatureCount);
  const firstCreatureX = 420;
  const spacing = 270;
  const arenaWidth = 640;
  const runLength = firstCreatureX + creatureCount * spacing + 160;
  const width = runLength + arenaWidth;

  const roster = creatureRoster(config.level);
  const creatures: CreatureSpawn[] = [];
  for (let i = 0; i < creatureCount; i++) {
    const kind = roster[i % roster.length];
    creatures.push({
      id: i + 1,
      x: firstCreatureX + i * spacing,
      // practice creatures hold their post on the ground so every one is met —
      // they pose problems, not threats
      behavior: "walker",
      emoji: kind.emoji,
      hp: 1,
      speed: 0,
      patrolHalfSpan: 0,
    });
  }

  const platforms: Rect[] = [{ x: 0, y: GROUND_Y, w: width, h: GROUND_THICKNESS }];
  const coins: Vec[] = [];
  for (let x = 340; x < runLength - 200; x += 340 + randInt(-40, 40, rng)) {
    const y = GROUND_Y - randInt(80, 120, rng);
    platforms.push({ x, y, w: 110, h: FLOAT_PLATFORM_H });
    coins.push(...coinArc(x + 55, y - 26, 3));
  }

  return {
    width,
    groundY: GROUND_Y,
    platforms,
    creatures,
    stations: [],
    coins,
    powerUps: [],
    checkpointX: null,
    bossGateX: runLength,
    arenaMinX: runLength + 40,
    arenaMaxX: width - 40,
    knightStartX: 60,
    // Practice has no pits: nothing can hurt the knight here (§3)
  };
}

function buildAdventureStage(config: EngineConfig, rng: Rng): StagePlan {
  const runLength = 2600 + config.level * 60;
  const arenaWidth = 600;
  const width = runLength + arenaWidth;

  const pits: PitSpan[] = [0.24, 0.47, 0.7].map((f) => {
    const center = runLength * f + randInt(-60, 60, rng);
    const half = randInt(50, 68, rng);
    return { minX: center - half, maxX: center + half };
  });

  const platforms = groundSegments(width, pits);
  const coins: Vec[] = [];

  // a rescue platform above each pit + brave-jump coins over the gap
  for (const pit of pits) {
    const pitCenter = (pit.minX + pit.maxX) / 2;
    const pitW = pit.maxX - pit.minX;
    platforms.push({ x: pit.minX - 30, y: GROUND_Y - 120, w: pitW + 60, h: FLOAT_PLATFORM_H });
    coins.push(...coinArc(pitCenter, GROUND_Y - 40, 5));
  }

  // extra floating platforms with coin arcs between the pits
  for (let x = 380; x < runLength - 260; x += 420 + randInt(-60, 60, rng)) {
    if (insidePit(x, pits, 140) || insidePit(x + 120, pits, 140)) continue;
    const y = GROUND_Y - randInt(85, 130, rng);
    platforms.push({ x, y, w: 120, h: FLOAT_PLATFORM_H });
    coins.push(...coinArc(x + 60, y - 26, 3));
  }

  // 3 forge anvils + 3 armor scrolls alternate along the run (§14)
  const stations: StationSpawn[] = [];
  const stationCount = ADVENTURE_ANVIL_COUNT + ADVENTURE_SCROLL_COUNT;
  for (let i = 1; i <= stationCount; i++) {
    const x = shiftOutOfPits((runLength * i) / (stationCount + 1), pits);
    stations.push({ id: 100 + i, kind: i % 2 === 1 ? "forge-anvil" : "armor-scroll", x });
  }

  const roster = creatureRoster(config.level);
  const creatures: CreatureSpawn[] = [];
  for (let i = 0; i < ADVENTURE_CREATURE_COUNT; i++) {
    const kind = roster[randInt(0, roster.length - 1, rng)];
    const rawX = 350 + ((runLength - 550) * i) / (ADVENTURE_CREATURE_COUNT - 1) + randInt(-50, 50, rng);
    creatures.push({
      id: i + 1,
      x: shiftOutOfPits(rawX, pits),
      behavior: kind.behavior,
      emoji: kind.emoji,
      hp: config.level <= 5 ? 1 : config.level <= 10 ? 2 : 3,
      speed: kind.behavior === "walker" ? 46 + config.level * 3 : 34 + config.level * 2,
      patrolHalfSpan: randInt(60, 100, rng),
    });
  }

  const powerUps: { id: number; kind: PowerUpKind; pos: Vec }[] = [
    { id: 201, kind: "boots", pos: { x: shiftOutOfPits(runLength * 0.32, pits), y: GROUND_Y - 150 } },
    { id: 202, kind: "magnet", pos: { x: shiftOutOfPits(runLength * 0.62, pits), y: GROUND_Y - 150 } },
  ];

  return {
    width,
    groundY: GROUND_Y,
    platforms,
    creatures,
    stations,
    coins,
    powerUps,
    checkpointX: shiftOutOfPits(runLength * 0.5, pits),
    bossGateX: runLength,
    arenaMinX: runLength + 40,
    arenaMaxX: width - 40,
    knightStartX: 60,
  };
}

export function buildStagePlan(config: EngineConfig): StagePlan {
  const rng = mulberry32(config.seed);
  return config.mode === "practice" ? buildPracticeStage(config, rng) : buildAdventureStage(config, rng);
}
