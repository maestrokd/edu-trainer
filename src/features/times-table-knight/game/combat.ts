import {
  ARROW_MAX_PIERCE,
  ARROW_SPEED,
  BOOTS_SECONDS,
  COIN_PICKUP_VALUE,
  INVULN_SECONDS,
  KNOCKBACK_LIFT,
  KNOCKBACK_SPEED,
  MAGNET_RADIUS,
  MAGNET_SECONDS,
  WEAPONS,
} from "../model/game.constants";
import type { Creature, Rect, World } from "./entities";
import type { GameEvents } from "./events";
import { aabb, centerX, centerY, overlaps } from "./physics";

// Real combat exists in Adventure only (§3): weapons slay creatures, contact
// and pits cost hearts. Practice never calls into this module's damage paths.

function burst(world: World, x: number, y: number, color: string, count = 8, text?: string) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const speed = 50 + Math.random() * 110;
    world.particles.push({
      pos: { x, y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 50 },
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color,
      size: text ? 13 : 3.5 + Math.random() * 3,
      text,
      gravity: true,
    });
  }
}

export function damageCreature(world: World, creature: Creature, damage: number, events: Partial<GameEvents>) {
  if (creature.slain) return;
  creature.hp -= damage;
  creature.hitFlash = 1;
  if (creature.hp <= 0) {
    creature.slain = true;
    burst(world, centerX(creature.rect), centerY(creature.rect), "#ffd700", 10, "💥");
    events.onCreatureSlain?.();
  }
}

/** resolve one attack press with the equipped weapon (Adventure) */
export function performAttack(world: World, events: Partial<GameEvents>) {
  const spec = WEAPONS[world.weapon];
  const knight = world.knight;

  if (spec.attack === "melee") {
    const hitbox: Rect = {
      x: knight.facing === 1 ? knight.rect.x + knight.rect.w : knight.rect.x - spec.reachPx,
      y: knight.rect.y - 4,
      w: spec.reachPx,
      h: knight.rect.h + 8,
    };
    for (const c of world.creatures) {
      if (!c.slain && aabb(hitbox, c.rect)) damageCreature(world, c, spec.damage, events);
    }
    return;
  }

  if (spec.attack === "ranged") {
    world.projectiles.push({
      rect: { x: centerX(knight.rect), y: knight.rect.y + 16, w: 18, h: 4 },
      vel: { x: knight.facing * ARROW_SPEED, y: 0 },
      fromKnight: true,
      damage: spec.damage,
      pierced: 0,
      dead: false,
    });
    return;
  }

  // smite: every creature currently on screen feels the holy blade
  const viewMinX = world.knight.rect.x - 400;
  const viewMaxX = world.knight.rect.x + 400;
  burst(world, centerX(knight.rect), centerY(knight.rect) - 20, "#ffe680", 16, "✨");
  for (const c of world.creatures) {
    if (!c.slain && c.rect.x > viewMinX && c.rect.x < viewMaxX) {
      damageCreature(world, c, spec.damage, events);
    }
  }
}

function knockbackKnight(world: World, fromX: number) {
  const knight = world.knight;
  const away = centerX(knight.rect) >= fromX ? 1 : -1;
  knight.vel.x = away * KNOCKBACK_SPEED;
  knight.vel.y = -KNOCKBACK_LIFT;
  knight.rect.x += away * 10;
  knight.invulnTimer = INVULN_SECONDS;
}

export function updateCreatures(world: World, dt: number, events: Partial<GameEvents>) {
  const knight = world.knight;
  for (const c of world.creatures) {
    if (c.slain) continue;

    if (c.behavior === "walker") {
      if (c.speed > 0) {
        c.rect.x += c.dir * c.speed * dt;
        if (c.rect.x <= c.patrolMinX) c.dir = 1;
        else if (c.rect.x + c.rect.w >= c.patrolMaxX + c.rect.w) c.dir = -1;
      }
    } else {
      if (c.speed > 0) {
        c.rect.x += c.dir * c.speed * dt;
        if (c.rect.x <= c.patrolMinX) c.dir = 1;
        else if (c.rect.x >= c.patrolMaxX) c.dir = -1;
      }
      c.rect.y = c.baseY + Math.sin(world.t * 2.2 + c.phase) * 26;
    }

    // contact damage — armor absorption and hearts are the reducer's business
    if (knight.invulnTimer <= 0 && overlaps(knight.rect, c.rect, -4)) {
      knockbackKnight(world, centerX(c.rect));
      events.onKnightHit?.("contact");
    }
  }
}

export function updateProjectiles(world: World, dt: number, events: Partial<GameEvents>) {
  const knight = world.knight;
  for (const p of world.projectiles) {
    if (p.dead) continue;
    p.rect.x += p.vel.x * dt;
    p.rect.y += p.vel.y * dt;

    if (p.rect.x < -50 || p.rect.x > world.plan.width + 50 || p.rect.y > world.plan.groundY + 60) {
      p.dead = true;
      continue;
    }

    if (p.fromKnight) {
      for (const c of world.creatures) {
        if (c.slain || !aabb(p.rect, c.rect)) continue;
        damageCreature(world, c, p.damage, events);
        p.pierced++;
        if (p.pierced >= ARROW_MAX_PIERCE) {
          p.dead = true;
          break;
        }
      }
    } else if (knight.invulnTimer <= 0 && aabb(p.rect, knight.rect)) {
      p.dead = true;
      knockbackKnight(world, centerX(p.rect));
      events.onKnightHit?.("boss");
    }
  }
  world.projectiles = world.projectiles.filter((p) => !p.dead);
}

export function collectPickups(world: World, dt: number, events: Partial<GameEvents>) {
  const knight = world.knight;
  const kx = centerX(knight.rect);
  const ky = centerY(knight.rect);

  for (const coin of world.coins) {
    if (coin.taken) continue;
    if (knight.magnetTimer > 0) {
      const dx = kx - centerX(coin.rect);
      const dy = ky - centerY(coin.rect);
      const dist = Math.hypot(dx, dy);
      if (dist < MAGNET_RADIUS && dist > 1) {
        coin.rect.x += (dx / dist) * 260 * dt;
        coin.rect.y += (dy / dist) * 260 * dt;
      }
    }
    if (overlaps(knight.rect, coin.rect, 2)) {
      coin.taken = true;
      burst(world, centerX(coin.rect), centerY(coin.rect), "#ffd700", 5);
      events.onCoinCollected?.(COIN_PICKUP_VALUE);
    }
  }

  for (const pu of world.powerUps) {
    if (pu.taken || !overlaps(knight.rect, pu.rect, 2)) continue;
    pu.taken = true;
    if (pu.kind === "boots") knight.bootsTimer = BOOTS_SECONDS;
    else knight.magnetTimer = MAGNET_SECONDS;
    burst(world, centerX(pu.rect), centerY(pu.rect), "#9be7ff", 8, pu.kind === "boots" ? "👟" : "🧲");
    events.onPowerUpCollected?.(pu.kind);
  }
}

export function checkCheckpoint(world: World, events: Partial<GameEvents>) {
  const x = world.plan.checkpointX;
  if (x == null || world.checkpointPassed) return;
  if (world.knight.rect.x + world.knight.rect.w >= x) {
    world.checkpointPassed = true;
    world.respawnX = x;
    burst(world, x, world.plan.groundY - 60, "#38c172", 10, "🚩");
    events.onCheckpointReached?.();
  }
}

export function checkBossGate(world: World, events: Partial<GameEvents>) {
  if (world.bossGateEmitted) return;
  if (world.knight.rect.x + world.knight.rect.w >= world.plan.bossGateX) {
    world.bossGateEmitted = true;
    events.onBossGateReached?.();
  }
}
