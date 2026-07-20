import type { ArmorTier, EncounterKind, GameMode, Hero, SkinId, WeaponTier } from "../model/game.types";

// ---------------------------------------------------------------------------
// The ONLY contract between the React world and the canvas engine (§10).
// The engine never imports React and never touches the session reducer;
// it emits these events, and receives the Engine command surface in return.
// Nothing syncs per-frame — only at these boundaries.
// ---------------------------------------------------------------------------

export type HitCause = "contact" | "pit" | "boss";
export type PowerUpKind = "boots" | "magnet";
export type TouchControl = "left" | "right" | "jump" | "attack";

export interface EncounterRequest {
  kind: EncounterKind;
  /** id of the anvil/scroll/creature/dropped scroll that triggered the stop */
  stationId: number;
}

export interface GameEvents {
  /** a question stop was touched — the engine has already frozen the world */
  onEncounterRequested(req: EncounterRequest): void;
  /** reflex damage (Adventure only): creature contact, pit fall, boss attack */
  onKnightHit(cause: HitCause): void;
  onCreatureSlain(): void;
  onCoinCollected(value: number): void;
  onPowerUpCollected(kind: PowerUpKind): void;
  onCheckpointReached(): void;
  /** knight reached the boss gate; the controller decides when to enter the arena */
  onBossGateReached(): void;
  onBossDamaged(damage: number): void;
}

export interface EngineConfig {
  mode: GameMode;
  level: number;
  hero: Hero;
  skin: SkinId;
  reducedMotion: boolean;
  /** Practice: how many question creatures the stage needs (from the fact plan) */
  practiceCreatureCount: number;
  /** stage layout seed — reproducible worlds under test */
  seed: number;
}

export interface Engine {
  start(): void;
  destroy(): void;
  /** world stops completely — a question is open (freeze-for-math, §1) */
  freeze(): void;
  resume(): void;
  setPaused(paused: boolean): void;
  setTouchControl(control: TouchControl, pressed: boolean): void;
  /** reducer → engine: equipment tiers changed (forge/scroll outcome) */
  applyEquipment(weapon: WeaponTier, armor: ArmorTier): void;
  /** volley closed: success drives the station/creature outcome animation */
  resolveEncounter(stationId: number, success: boolean): void;
  /** controller finished pre-boss business (re-asks) — start the fight */
  enterBossArena(): void;
  /** reducer says boss HP hit 0 — play death + celebration */
  defeatBoss(finale: boolean): void;
  /** hearts depleted — hold a still frame under the results card */
  stopWorld(): void;
  /** friendly retry: fresh stage, same seed; reducer resets hearts/equipment */
  retryStage(): void;
}
