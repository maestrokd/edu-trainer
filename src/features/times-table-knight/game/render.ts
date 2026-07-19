import type { ArmorTier, Hero, SkinId, WeaponTier } from "../model/game.types";
import { KNIGHT_HEIGHT, KNIGHT_WIDTH, VIEW_HEIGHT } from "../model/game.constants";
import type { Boss, Creature, Knight, Station, World } from "./entities";
import type { Camera } from "./camera";
import { worldFor } from "./worlds";

const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

export const SKIN_COLORS: Record<SkinId, { base: string; light: string; dark: string }> = {
  steel: { base: "#8e9bab", light: "#c3cdd9", dark: "#5c6773" },
  crimson: { base: "#b8434e", light: "#e08790", dark: "#7c2830" },
  azure: { base: "#3a7bd5", light: "#8ab6f0", dark: "#245089" },
  gold: { base: "#d4a017", light: "#f0cf6e", dark: "#8f6a0d" },
};

const HERO_PLUME: Record<Hero, string> = {
  dame: "#ff6b81",
  sir: "#38b6e0",
};

/** every level has its own world palette — see game/worlds.ts */
function bandFor(level: number) {
  return worldFor(level).palette;
}

function drawEmoji(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number, shadow = false) {
  ctx.save();
  if (shadow) {
    // pale emoji art (bats, parchment) washes out against the pastel sky;
    // a soft drop shadow keeps creatures and stations reading at full opacity
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
  }
  ctx.font = `${size}px ${EMOJI_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, cam: Camera, level: number, t: number, reducedMotion: boolean) {
  const band = bandFor(level);
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, band.skyTop);
  grad.addColorStop(1, band.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(cam.x, 0, cam.viewW, VIEW_HEIGHT);

  // two parallax hill layers
  const layers: { color: string; factor: number; base: number; amp: number; wl: number }[] = [
    { color: band.hillFar, factor: 0.25, base: VIEW_HEIGHT - 105, amp: 26, wl: 340 },
    { color: band.hillNear, factor: 0.5, base: VIEW_HEIGHT - 82, amp: 20, wl: 220 },
  ];
  for (const layer of layers) {
    const offset = cam.x * (1 - layer.factor);
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(cam.x, VIEW_HEIGHT);
    for (let sx = 0; sx <= cam.viewW + 16; sx += 16) {
      const wx = cam.x + sx;
      const y = layer.base - (Math.sin((wx - offset) / layer.wl) * 0.5 + 0.5) * layer.amp;
      ctx.lineTo(wx, y);
    }
    ctx.lineTo(cam.x + cam.viewW, VIEW_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // drifting clouds (skipped under reduced motion — they otherwise never stop)
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const drift = reducedMotion ? 0 : t * 8;
  for (let i = 0; i < 4; i++) {
    const wx = cam.x * 0.85 + ((i * 260 + drift) % (cam.viewW + 200)) - 100 + cam.x * 0.15;
    const wy = 40 + (i % 3) * 26;
    ctx.beginPath();
    ctx.ellipse(wx, wy, 34, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(wx + 20, wy + 4, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms(ctx: CanvasRenderingContext2D, world: World, cam: Camera) {
  const band = bandFor(levelOf(world));
  for (const p of world.plan.platforms) {
    if (p.x + p.w < cam.x - 40 || p.x > cam.x + cam.viewW + 40) continue;
    const isGround = p.y >= world.plan.groundY;
    ctx.fillStyle = isGround ? band.ground : "#7d7468";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = isGround ? band.groundTop : "#9d948a";
    ctx.fillRect(p.x, p.y, p.w, 6);
    if (!isGround) {
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    }
  }
}

function levelOf(world: World): number {
  return world.levelHint;
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, world: World) {
  const x = world.plan.checkpointX;
  if (x == null) return;
  const y = world.plan.groundY;
  ctx.fillStyle = "#5c4a3a";
  ctx.fillRect(x - 2, y - 74, 4, 74);
  drawEmoji(ctx, world.checkpointPassed ? "✅" : "🚩", x + 10, y - 66, 22);
}

function drawBossGate(ctx: CanvasRenderingContext2D, world: World) {
  const x = world.plan.bossGateX;
  const y = world.plan.groundY;
  ctx.fillStyle = "#6e6259";
  ctx.fillRect(x - 14, y - 120, 12, 120);
  ctx.fillRect(x + 42, y - 120, 12, 120);
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 120);
  ctx.quadraticCurveTo(x + 20, y - 168, x + 54, y - 120);
  ctx.lineTo(x + 42, y - 120);
  ctx.quadraticCurveTo(x + 20, y - 150, x - 2, y - 120);
  ctx.closePath();
  ctx.fill();
  drawEmoji(ctx, "🏰", x + 20, y - 138, 26);
}

function drawStation(ctx: CanvasRenderingContext2D, station: Station, t: number) {
  const { rect } = station;
  ctx.save();
  if (station.used) ctx.globalAlpha = 0.45;
  if (station.kind === "forge-anvil") {
    ctx.fillStyle = "#4a4440";
    ctx.fillRect(rect.x + 4, rect.y + rect.h - 12, rect.w - 8, 12);
    drawEmoji(ctx, "⚒️", rect.x + rect.w / 2, rect.y + rect.h - 26, 26, true);
  } else {
    const bob = Math.sin(t * 2.4 + station.id) * 4;
    drawEmoji(ctx, "📜", rect.x + rect.w / 2, rect.y + rect.h / 2 + bob, 26, true);
  }
  ctx.restore();
  if (station.flash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, station.flash);
    ctx.strokeStyle = station.lastOutcome === "up" ? "#38c172" : "#e3342f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2 - 8, 26 + (1 - station.flash) * 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCreature(ctx: CanvasRenderingContext2D, creature: Creature, t: number) {
  if (creature.slain) return;
  const { rect } = creature;
  const cx = rect.x + rect.w / 2;
  const bob = creature.behavior === "flyer" ? Math.sin(t * 3 + creature.phase) * 4 : 0;
  const cy = rect.y + rect.h / 2 + bob;
  ctx.save();
  if (creature.questionDone) ctx.globalAlpha = 0.4;
  drawEmoji(ctx, creature.emoji, cx, cy, rect.h, true);
  ctx.restore();
  if (creature.hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = creature.hitFlash * 0.7;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, rect.h * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (creature.maxHp > 1 && !creature.questionDone) {
    for (let i = 0; i < creature.maxHp; i++) {
      ctx.fillStyle = i < creature.hp ? "#e3342f" : "rgba(0,0,0,0.25)";
      ctx.fillRect(rect.x + i * 8, rect.y - 10, 6, 4);
    }
  }
}

// the Black Knight boss: the hero's silhouette in near-black plate,
// dark-red plume, glowing visor — a mirror duel instead of a monster
const BLACK_KNIGHT_COLORS = { base: "#2f2f38", light: "#565662", dark: "#16161d" };
const BLACK_KNIGHT_PLUME = "#8a1f2a";
const BLACK_KNIGHT_VISOR = "#ff5040";

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, t: number, asKnight: boolean) {
  if (boss.state === "dead") return;
  const { rect } = boss;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  let shakeX = 0;
  if (boss.state === "telegraph") {
    shakeX = Math.sin(t * 40) * 2.5;
    ctx.shadowColor = "#ff3b30";
    ctx.shadowBlur = 24;
  }
  if (boss.state === "flinch") {
    ctx.globalAlpha = 0.65;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 30;
  }
  if (boss.state === "dying") {
    ctx.globalAlpha = Math.max(0, boss.stateTimer / 1.4);
    ctx.translate(cx, cy);
    ctx.rotate((1.4 - boss.stateTimer) * 1.2);
    ctx.translate(-cx, -cy);
  }
  ctx.translate(cx + shakeX, cy);
  if (asKnight) {
    const scale = rect.h / KNIGHT_HEIGHT;
    ctx.scale(boss.facing * scale, scale); // body faces +x, like the hero
    ctx.translate(0, -KNIGHT_HEIGHT / 2);
    drawKnightBody(ctx, {
      w: KNIGHT_WIDTH,
      h: KNIGHT_HEIGHT,
      colors: BLACK_KNIGHT_COLORS,
      plume: BLACK_KNIGHT_PLUME,
      hair: false,
      visor: BLACK_KNIGHT_VISOR,
      weapon: 1,
      armor: 3,
      legSwing: boss.state === "attack" ? Math.sin(t * 14) * 5 : 0,
      airborne: false,
      attackTimer: boss.state === "attack" ? 0.15 : 0,
    });
  } else {
    ctx.scale(boss.facing === 1 ? -1 : 1, 1); // emoji face left by default
    drawEmoji(ctx, boss.emoji, 0, 0, rect.h, true);
  }
  ctx.restore();
}

interface KnightBodyOpts {
  w: number;
  h: number;
  colors: { base: string; light: string; dark: string };
  plume: string;
  /** golden hair strand — the Dame's mark */
  hair: boolean;
  visor: string;
  weapon: WeaponTier;
  armor: ArmorTier;
  legSwing: number;
  airborne: boolean;
  attackTimer: number;
}

export function drawKnight(
  ctx: CanvasRenderingContext2D,
  knight: Knight,
  hero: Hero,
  skin: SkinId,
  weapon: WeaponTier,
  armor: ArmorTier,
  t: number
) {
  // invulnerability blink
  if (knight.invulnTimer > 0 && Math.floor(t * 12) % 2 === 0) return;

  const { rect } = knight;
  const walking = knight.onGround && Math.abs(knight.vel.x) > 10;

  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y);
  ctx.scale(knight.facing, 1);
  drawKnightBody(ctx, {
    w: rect.w,
    h: rect.h,
    colors: SKIN_COLORS[skin],
    plume: HERO_PLUME[hero],
    hair: hero === "dame",
    visor: "#1f2430",
    weapon,
    armor,
    legSwing: walking ? Math.sin(knight.walkPhase) * 5 : 0,
    airborne: !knight.onGround,
    attackTimer: knight.attackTimer,
  });
  ctx.restore();
}

/** the armored figure, facing +x, origin at the top-center of its rect */
function drawKnightBody(ctx: CanvasRenderingContext2D, opts: KnightBodyOpts) {
  const { w, h, colors, weapon, armor, legSwing, airborne } = opts;

  // legs
  ctx.fillStyle = colors.dark;
  if (airborne) {
    ctx.fillRect(-9, h - 16, 7, 12);
    ctx.fillRect(2, h - 14, 7, 10);
  } else {
    ctx.fillRect(-9 + legSwing, h - 14, 7, 14);
    ctx.fillRect(2 - legSwing, h - 14, 7, 14);
  }

  // torso (armor) — higher armor tiers read as broader pauldrons
  ctx.fillStyle = colors.base;
  const torsoW = w - 8 + armor * 2;
  roundRect(ctx, -torsoW / 2, 12, torsoW, h - 26, 4);
  ctx.fill();
  ctx.fillStyle = colors.light;
  ctx.fillRect(-torsoW / 2, 14, torsoW, 3);
  if (armor >= 2) {
    ctx.fillStyle = colors.light;
    ctx.fillRect(-torsoW / 2 - 2, 12, 5, 8);
    ctx.fillRect(torsoW / 2 - 3, 12, 5, 8);
  }

  // shield on the back arm
  ctx.fillStyle = colors.dark;
  ctx.beginPath();
  ctx.ellipse(-torsoW / 2 - 2, 24, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // helmet
  ctx.fillStyle = colors.light;
  roundRect(ctx, -8, -2, 16, 16, 5);
  ctx.fill();
  ctx.fillStyle = opts.visor;
  ctx.fillRect(2, 4, 6, 3); // visor slit (faces +x before flip)

  // identity: plume for all, hair strand for the Dame
  ctx.strokeStyle = opts.plume;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.quadraticCurveTo(-10, -10, -14, -2);
  ctx.stroke();
  if (opts.hair) {
    ctx.strokeStyle = "#f4c430";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, 12);
    ctx.quadraticCurveTo(-12, 20, -10, 28);
    ctx.stroke();
  }

  // weapon arm
  const attacking = opts.attackTimer > 0;
  const swing = attacking ? (1 - opts.attackTimer / 0.25) * 2.1 - 1.5 : -0.5;
  ctx.save();
  ctx.translate(torsoW / 2 - 1, 20);
  if (weapon === 2) {
    // longbow: no swing — draw the bow upright
    ctx.strokeStyle = "#7a4f2a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, 0, 12, -Math.PI / 2.3, Math.PI / 2.3);
    ctx.stroke();
    ctx.strokeStyle = "#e8e6df";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4 + Math.cos(-Math.PI / 2.3) * 12, Math.sin(-Math.PI / 2.3) * 12);
    ctx.lineTo(4 + Math.cos(Math.PI / 2.3) * 12, Math.sin(Math.PI / 2.3) * 12);
    ctx.stroke();
  } else {
    ctx.rotate(swing);
    const blade = weapon === 0 ? 12 : weapon === 1 ? 20 : 24;
    if (weapon === 3) {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = weapon === 3 ? "#ffe680" : "#d8dde4";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(blade, -blade * 0.4);
    ctx.stroke();
    if (weapon >= 1) {
      ctx.strokeStyle = "#8a6d3b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3.5, -4);
      ctx.lineTo(6.5, 3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: World, cam: Camera, reducedMotion: boolean) {
  drawBackground(ctx, cam, levelOf(world), world.t, reducedMotion);
  drawPlatforms(ctx, world, cam);
  drawCheckpoint(ctx, world);
  drawBossGate(ctx, world);

  for (const s of world.stations) drawStation(ctx, s, world.t);

  for (const c of world.coins) {
    if (c.taken) continue;
    const bob = Math.sin(world.t * 3 + c.phase) * 3;
    drawEmoji(ctx, "🪙", c.rect.x + c.rect.w / 2, c.rect.y + c.rect.h / 2 + bob, 16);
  }

  for (const p of world.powerUps) {
    if (p.taken) continue;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    drawEmoji(ctx, p.kind === "boots" ? "🐎" : "🧲", p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2, 18, true);
  }

  for (const c of world.creatures) drawCreature(ctx, c, world.t);

  for (const s of world.droppedScrolls) {
    if (s.taken) continue;
    drawEmoji(ctx, "📜", s.rect.x + s.rect.w / 2, s.rect.y + s.rect.h / 2, 24, true);
  }

  for (const pr of world.projectiles) {
    if (pr.dead) continue;
    if (pr.fromKnight) {
      ctx.strokeStyle = "#5b4326";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const cy = pr.rect.y + pr.rect.h / 2;
      ctx.moveTo(pr.rect.x, cy);
      ctx.lineTo(pr.rect.x + pr.rect.w * Math.sign(pr.vel.x || 1), cy);
      ctx.stroke();
    } else {
      drawEmoji(ctx, "🔥", pr.rect.x + pr.rect.w / 2, pr.rect.y + pr.rect.h / 2, 20, true);
    }
  }

  if (world.boss) drawBoss(ctx, world.boss, world.t, worldFor(world.levelHint).bossKind === "knight");

  drawKnight(ctx, world.knight, world.hero, world.skin, world.weapon, world.armor, world.t);

  for (const p of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    if (p.text) {
      drawEmoji(ctx, p.text, p.pos.x, p.pos.y, p.size);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x - p.size / 2, p.pos.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}
