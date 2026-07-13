import type { ArmorTier, Hero, SkinId, WeaponTier } from "../model/game.types";
import type { PowerUpKind } from "./events";

export interface Vec {
  x: number;
  y: number;
}

/** axis-aligned box; x,y = top-left, in world px */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Knight {
  rect: Rect;
  vel: Vec;
  facing: 1 | -1;
  onGround: boolean;
  /** >0 while the swing/shot animation plays */
  attackTimer: number;
  attackCooldown: number;
  invulnTimer: number;
  /** speed-boots power-up remaining seconds (0 = none) */
  bootsTimer: number;
  magnetTimer: number;
  walkPhase: number;
}

export type CreatureBehavior = "walker" | "flyer";

export interface Creature {
  id: number;
  rect: Rect;
  behavior: CreatureBehavior;
  emoji: string;
  hp: number;
  maxHp: number;
  speed: number;
  dir: 1 | -1;
  patrolMinX: number;
  patrolMaxX: number;
  baseY: number;
  phase: number;
  slain: boolean;
  hitFlash: number;
  /** Practice: creature is a question stop; true once its volley was served */
  questionDone: boolean;
  /** short celebration/retreat animation timer after its volley resolves */
  retreatTimer: number;
}

export type StationKind = "forge-anvil" | "armor-scroll";

export interface Station {
  id: number;
  kind: StationKind;
  rect: Rect;
  used: boolean;
  flash: number;
  lastOutcome: "up" | "down" | null;
}

export interface Coin {
  id: number;
  rect: Rect;
  taken: boolean;
  phase: number;
}

export interface PowerUp {
  id: number;
  kind: PowerUpKind;
  rect: Rect;
  taken: boolean;
}

export interface Projectile {
  rect: Rect;
  vel: Vec;
  fromKnight: boolean;
  damage: number;
  /** longbow arrows pierce — count of creatures already hit */
  pierced: number;
  dead: boolean;
}

export type BossState = "waiting" | "idle" | "telegraph" | "attack" | "recover" | "flinch" | "dying" | "dead";
export type BossPattern = "charge" | "fireball";

export interface Boss {
  rect: Rect;
  vel: Vec;
  facing: 1 | -1;
  homeX: number;
  state: BossState;
  stateTimer: number;
  pattern: BossPattern;
  attackCycles: number;
  touchCooldown: number;
  emoji: string;
}

export interface DroppedScroll {
  id: number;
  rect: Rect;
  vel: Vec;
  taken: boolean;
}

export interface Particle {
  pos: Vec;
  vel: Vec;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
  gravity: boolean;
}

export interface CreatureSpawn {
  id: number;
  x: number;
  behavior: CreatureBehavior;
  emoji: string;
  hp: number;
  speed: number;
  patrolHalfSpan: number;
}

export interface StationSpawn {
  id: number;
  kind: StationKind;
  x: number;
}

export interface StagePlan {
  width: number;
  groundY: number;
  /** solid geometry incl. ground segments; pits are simply gaps */
  platforms: Rect[];
  creatures: CreatureSpawn[];
  stations: StationSpawn[];
  coins: Vec[];
  powerUps: { id: number; kind: PowerUpKind; pos: Vec }[];
  checkpointX: number | null;
  bossGateX: number;
  arenaMinX: number;
  arenaMaxX: number;
  knightStartX: number;
}

export type WorldPhase = "run" | "boss" | "over" | "celebration";

export interface World {
  t: number;
  phase: WorldPhase;
  /** stage level — drives visuals (background band, boss emoji) */
  levelHint: number;
  plan: StagePlan;
  knight: Knight;
  creatures: Creature[];
  stations: Station[];
  coins: Coin[];
  powerUps: PowerUp[];
  projectiles: Projectile[];
  boss: Boss | null;
  droppedScrolls: DroppedScroll[];
  particles: Particle[];
  /** visual equipment mirror (source of truth is the session reducer) */
  weapon: WeaponTier;
  armor: ArmorTier;
  hero: Hero;
  skin: SkinId;
  respawnX: number;
  checkpointPassed: boolean;
  bossGateEmitted: boolean;
  /** ids of stations/creatures whose encounter was requested (single-fire) */
  requestedStops: Set<number>;
  finale: boolean;
}
