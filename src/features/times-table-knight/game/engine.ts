import {
  ATTACK_COOLDOWN_SECONDS,
  FIXED_DT,
  GRAVITY,
  INVULN_SECONDS,
  JUMP_VELOCITY,
  KNIGHT_HEIGHT,
  KNIGHT_WIDTH,
  MAX_FRAME_DT,
  MOVE_SPEED,
  VIEW_HEIGHT,
} from "../model/game.constants";
import type { Coin, Creature, Knight, PowerUp, StagePlan, Station, World } from "./entities";
import type { Engine, EngineConfig, GameEvents } from "./events";
import { createCamera, updateCamera } from "./camera";
import { createInput } from "./input";
import { moveAndCollide, overlaps } from "./physics";
import { buildStagePlan, GROUND_Y } from "./spawner";
import { renderWorld } from "./render";
import {
  checkBossGate,
  checkCheckpoint,
  collectPickups,
  performAttack,
  spawnBoss,
  updateBoss,
  updateCreatures,
  updateDroppedScrolls,
  updateProjectiles,
} from "./combat";
import { BOSS_DYING_SECONDS } from "../model/game.constants";

const STATION_TRIGGER_PAD = 6;
const CREATURE_TRIGGER_PAD = 14;
const RETREAT_SECONDS = 0.9;

const MAX_FALL_SPEED = 900;
const BOOTS_SPEED_FACTOR = 1.35;
const ATTACK_SWING_SECONDS = 0.25;
const RESPAWN_FALL_MARGIN = 40;

function createKnight(plan: StagePlan): Knight {
  return {
    rect: { x: plan.knightStartX, y: plan.groundY - KNIGHT_HEIGHT, w: KNIGHT_WIDTH, h: KNIGHT_HEIGHT },
    vel: { x: 0, y: 0 },
    facing: 1,
    onGround: false,
    attackTimer: 0,
    attackCooldown: 0,
    invulnTimer: 0,
    bootsTimer: 0,
    magnetTimer: 0,
    walkPhase: 0,
  };
}

function createWorld(plan: StagePlan, config: EngineConfig): World {
  const creatures: Creature[] = plan.creatures.map((s) => {
    const size = 34;
    const baseY = s.behavior === "flyer" ? plan.groundY - 120 : plan.groundY - size;
    return {
      id: s.id,
      rect: { x: s.x, y: baseY, w: size, h: size },
      behavior: s.behavior,
      emoji: s.emoji,
      hp: s.hp,
      maxHp: s.hp,
      speed: s.speed,
      dir: -1,
      patrolMinX: s.x - s.patrolHalfSpan,
      patrolMaxX: s.x + s.patrolHalfSpan,
      baseY,
      phase: s.id * 1.7,
      slain: false,
      hitFlash: 0,
      questionDone: false,
      retreatTimer: 0,
    };
  });

  const stations: Station[] = plan.stations.map((s) => ({
    id: s.id,
    kind: s.kind,
    rect: { x: s.x - 22, y: plan.groundY - 48, w: 44, h: 48 },
    used: false,
    flash: 0,
    lastOutcome: null,
  }));

  const coins: Coin[] = plan.coins.map((pos, i) => ({
    id: 300 + i,
    rect: { x: pos.x - 8, y: pos.y - 8, w: 16, h: 16 },
    taken: false,
    phase: i * 0.9,
  }));

  const powerUps: PowerUp[] = plan.powerUps.map((p) => ({
    id: p.id,
    kind: p.kind,
    rect: { x: p.pos.x - 12, y: p.pos.y - 12, w: 24, h: 24 },
    taken: false,
  }));

  return {
    t: 0,
    phase: "run",
    levelHint: config.level,
    plan,
    knight: createKnight(plan),
    creatures,
    stations,
    coins,
    powerUps,
    projectiles: [],
    boss: null,
    droppedScrolls: [],
    particles: [],
    weapon: 0,
    armor: 0,
    hero: config.hero,
    skin: config.skin,
    respawnX: plan.knightStartX,
    checkpointPassed: false,
    bossGateEmitted: false,
    requestedStops: new Set<number>(),
    finale: false,
    celebrationTimer: 0,
    nextScrollId: 400,
  };
}

export function createEngine(canvas: HTMLCanvasElement, config: EngineConfig, events: Partial<GameEvents>): Engine {
  let world = createWorld(buildStagePlan(config), config);
  const camera = createCamera(640, VIEW_HEIGHT);
  const input = createInput();

  let rafId = 0;
  let lastTs = 0;
  let accumulator = 0;
  let running = false;
  let frozen = false;
  let paused = false;
  let destroyed = false;

  function freezeWorld() {
    frozen = true;
    input.setEnabled(false);
  }

  function spawnBurst(x: number, y: number, color: string, count = 10, text?: string) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 120;
      world.particles.push({
        pos: { x, y },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 60 },
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        color,
        size: text ? 14 : 4 + Math.random() * 3,
        text,
        gravity: true,
      });
    }
  }

  /** question stops fire once, freeze the world FIRST, then notify (§1) */
  function checkQuestionStops() {
    const knight = world.knight;
    for (const s of world.stations) {
      if (s.used || world.requestedStops.has(s.id)) continue;
      if (overlaps(knight.rect, s.rect, STATION_TRIGGER_PAD)) {
        world.requestedStops.add(s.id);
        freezeWorld();
        events.onEncounterRequested?.({ kind: s.kind, stationId: s.id });
        return;
      }
    }
    if (config.mode === "practice") {
      for (const c of world.creatures) {
        if (c.slain || c.questionDone) continue;
        // horizontal-only, to mirror updateKnight's horizontal path block: an
        // AABB overlap never fires for a knight arriving on a platform above
        // the creature, stranding them at an invisible wall with no volley
        if (knight.rect.x + knight.rect.w + CREATURE_TRIGGER_PAD >= c.rect.x) {
          world.requestedStops.add(c.id);
          freezeWorld();
          events.onEncounterRequested?.({ kind: "practice-creature", stationId: c.id });
          return;
        }
      }
    }
  }

  function updateKnight(dt: number) {
    const knight = world.knight;
    const inp = input.state;

    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const speed = MOVE_SPEED * (knight.bootsTimer > 0 ? BOOTS_SPEED_FACTOR : 1);
    knight.vel.x = dir * speed;
    if (dir !== 0) knight.facing = dir as 1 | -1;

    if (inp.jumpPressed) {
      if (knight.onGround) knight.vel.y = -JUMP_VELOCITY;
      inp.jumpPressed = false;
    }
    if (inp.attackPressed) {
      tryAttack();
      inp.attackPressed = false;
    }

    knight.vel.y = Math.min(MAX_FALL_SPEED, knight.vel.y + GRAVITY * dt);
    const moved = moveAndCollide(knight.rect, knight.vel, world.plan.platforms, dt);
    knight.onGround = moved.onGround;

    // world bounds (arena lock applies while fighting the boss)
    const minX = camera.lockMinX ?? 0;
    let maxX = (camera.lockMaxX ?? world.plan.width) - knight.rect.w;
    if (config.mode === "practice") {
      // a practice creature blocks the path until its volley is answered (§4);
      // the proximity trigger fires well before this clamp is ever felt
      for (const c of world.creatures) {
        if (!c.slain && !c.questionDone) {
          maxX = Math.min(maxX, c.rect.x - knight.rect.w - 2);
        }
      }
    }
    knight.rect.x = Math.min(maxX, Math.max(minX, knight.rect.x));

    knight.walkPhase += Math.abs(knight.vel.x) * dt * 0.09;
    knight.attackTimer = Math.max(0, knight.attackTimer - dt);
    knight.attackCooldown = Math.max(0, knight.attackCooldown - dt);
    knight.invulnTimer = Math.max(0, knight.invulnTimer - dt);
    knight.bootsTimer = Math.max(0, knight.bootsTimer - dt);
    knight.magnetTimer = Math.max(0, knight.magnetTimer - dt);

    if (knight.rect.y > VIEW_HEIGHT + RESPAWN_FALL_MARGIN) handlePitFall();
  }

  function tryAttack() {
    const knight = world.knight;
    if (knight.attackCooldown > 0) return;
    knight.attackTimer = ATTACK_SWING_SECONDS;
    knight.attackCooldown = ATTACK_COOLDOWN_SECONDS;
    // real combat exists in Adventure only; the Practice swing is celebration
    if (config.mode === "adventure") performAttack(world, events);
  }

  function handlePitFall() {
    const knight = world.knight;
    events.onKnightHit?.("pit");
    knight.rect.x = world.respawnX;
    knight.rect.y = GROUND_Y - KNIGHT_HEIGHT;
    knight.vel.x = 0;
    knight.vel.y = 0;
    knight.invulnTimer = INVULN_SECONDS;
  }

  function updateAmbient(dt: number) {
    // the calm practice mini-boss animates its flinch/growl outside updateBoss
    if (config.mode === "practice" && world.boss && (world.boss.state === "flinch" || world.boss.state === "telegraph")) {
      world.boss.stateTimer -= dt;
      if (world.boss.stateTimer <= 0) world.boss.state = "waiting";
    }
    for (const c of world.creatures) {
      c.hitFlash = Math.max(0, c.hitFlash - dt * 3);
      if (c.retreatTimer > 0) {
        // a practice creature that survived its volley backs away from the knight
        c.retreatTimer = Math.max(0, c.retreatTimer - dt);
        const away = c.rect.x >= world.knight.rect.x ? 1 : -1;
        c.rect.x += away * 90 * dt;
      }
    }
    for (const s of world.stations) {
      s.flash = Math.max(0, s.flash - dt);
    }
    for (const p of world.particles) {
      p.life -= dt;
      if (p.gravity) p.vel.y += GRAVITY * 0.35 * dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
    }
    world.particles = world.particles.filter((p) => p.life > 0);
  }

  function step(dt: number) {
    world.t += dt;
    if (world.phase === "run" || world.phase === "boss") {
      updateKnight(dt);
      if (config.mode === "adventure") {
        updateCreatures(world, dt, events);
        updateProjectiles(world, dt, events);
      }
      collectPickups(world, dt, events);
    }
    if (world.phase === "run") {
      checkQuestionStops();
      if (config.mode === "adventure") checkCheckpoint(world, events);
      checkBossGate(world, events);
    }
    if (world.phase === "boss" && config.mode === "adventure") {
      updateBoss(world, dt, events);
      const scrollId = updateDroppedScrolls(world, dt);
      if (scrollId !== null) {
        freezeWorld();
        events.onEncounterRequested?.({ kind: "boss-scroll", stationId: scrollId });
      }
    }
    if (world.phase === "celebration") {
      updateCelebration(dt);
    }
    updateAmbient(dt);
    updateCamera(camera, world.knight.rect, world.plan.width, dt);
  }

  function spawnConfetti(count: number) {
    const colors = ["#ff6b81", "#ffd700", "#38c172", "#3a7bd5", "#b28dff"];
    for (let i = 0; i < count; i++) {
      world.particles.push({
        pos: { x: camera.x + Math.random() * camera.viewW, y: -10 - Math.random() * 60 },
        vel: { x: (Math.random() - 0.5) * 60, y: 60 + Math.random() * 90 },
        life: 2 + Math.random() * 1.5,
        maxLife: 3.5,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 4,
        gravity: false,
      });
    }
  }

  function updateCelebration(dt: number) {
    if (world.boss && world.boss.state === "dying") {
      world.boss.stateTimer -= dt;
      if (world.boss.stateTimer <= 0) world.boss.state = "dead";
    }
    if (world.celebrationTimer > 0) {
      world.celebrationTimer -= dt;
      // finale keeps the fireworks coming; a stage clear is a single shower
      if (world.finale && !config.reducedMotion && Math.random() < dt * 2) {
        spawnConfetti(30);
      }
    }
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = canvas.height / VIEW_HEIGHT;
    camera.viewW = canvas.width / scale;
    ctx.setTransform(scale, 0, 0, scale, -camera.x * scale, 0);
    renderWorld(ctx, world, camera, config.reducedMotion);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function frame(ts: number) {
    if (destroyed) return;
    rafId = requestAnimationFrame(frame);
    const rawDt = Math.min(MAX_FRAME_DT, (ts - lastTs) / 1000 || 0);
    lastTs = ts;
    if (!frozen && !paused) {
      accumulator += rawDt;
      while (accumulator >= FIXED_DT) {
        step(FIXED_DT);
        accumulator -= FIXED_DT;
      }
    }
    draw();
  }

  return {
    start() {
      if (running || destroyed) return;
      running = true;
      input.attach();
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    destroy() {
      destroyed = true;
      running = false;
      cancelAnimationFrame(rafId);
      input.detach();
    },
    freeze() {
      freezeWorld();
    },
    resume() {
      frozen = false;
      if (!paused) input.setEnabled(true);
    },
    setPaused(value: boolean) {
      paused = value;
      input.setEnabled(!value && !frozen);
    },
    setTouchControl(control, pressed) {
      input.set(control, pressed);
    },
    applyEquipment(weapon, armor) {
      world.weapon = weapon;
      world.armor = armor;
    },
    resolveEncounter(stationId, success) {
      // the practice mini-boss volley: strike lands on success, growl on a miss
      if (stationId === -1 && world.boss) {
        world.knight.attackTimer = success ? 0.25 : 0;
        world.boss.state = success ? "flinch" : "telegraph";
        world.boss.stateTimer = success ? 0.4 : 0.5;
        if (success) {
          spawnBurst(world.boss.rect.x + world.boss.rect.w / 2, world.boss.rect.y + world.boss.rect.h / 2, "#ffffff", 10, "💥");
        }
        return;
      }
      // a boss-fight scroll resolved: flash around the knight
      if (stationId >= 400) {
        const kx = world.knight.rect.x + world.knight.rect.w / 2;
        spawnBurst(kx, world.knight.rect.y, success ? "#38c172" : "#e3342f", 8, success ? "✨" : undefined);
        return;
      }
      const station = world.stations.find((s) => s.id === stationId);
      if (station) {
        station.used = true;
        station.flash = 1;
        station.lastOutcome = success ? "up" : "down";
        const cx = station.rect.x + station.rect.w / 2;
        spawnBurst(cx, station.rect.y, success ? "#38c172" : "#e3342f", 8, success ? "✨" : undefined);
        return;
      }
      const creature = world.creatures.find((c) => c.id === stationId);
      if (creature) {
        creature.questionDone = true;
        const cx = creature.rect.x + creature.rect.w / 2;
        const cy = creature.rect.y + creature.rect.h / 2;
        if (success) {
          // flawless volley: celebratory strike, creature defeated
          world.knight.attackTimer = 0.25;
          creature.slain = true;
          spawnBurst(cx, cy, "#ffd700", 12, "✨");
        } else {
          creature.retreatTimer = RETREAT_SECONDS;
        }
      }
    },
    enterBossArena() {
      if (world.phase !== "run") return;
      world.phase = "boss";
      camera.lockMinX = world.plan.arenaMinX - 20;
      camera.lockMaxX = world.plan.arenaMaxX + 20;
      spawnBoss(world, config.mode === "practice");
      if (config.mode === "practice" && world.boss) {
        // the calm mini-boss never attacks — volleys of problems decide the fight
        world.boss.state = "waiting";
      }
    },
    defeatBoss(finale) {
      world.finale = finale;
      world.phase = "celebration";
      if (world.boss) {
        world.boss.state = "dying";
        world.boss.stateTimer = BOSS_DYING_SECONDS;
      }
      world.celebrationTimer = finale ? 6 : 2.5;
      spawnConfetti(config.reducedMotion ? 20 : 80);
      input.setEnabled(false);
    },
    stopWorld() {
      world.phase = "over";
      input.setEnabled(false);
    },
    retryStage() {
      world = createWorld(buildStagePlan(config), config);
      camera.x = 0;
      camera.lockMinX = null;
      camera.lockMaxX = null;
      frozen = false;
      paused = false;
      input.setEnabled(true);
    },
  };
}
