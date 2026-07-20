import type { Rect, Vec } from "./entities";

export function aabb(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function overlaps(a: Rect, b: Rect, pad = 0): boolean {
  return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}

export interface MoveResult {
  onGround: boolean;
  hitWall: boolean;
  hitCeiling: boolean;
}

/**
 * Axis-separated AABB move & resolve against solid platforms.
 * Mutates rect (position) and vel.y (zeroed on vertical contact).
 */
export function moveAndCollide(rect: Rect, vel: Vec, platforms: readonly Rect[], dt: number): MoveResult {
  const result: MoveResult = { onGround: false, hitWall: false, hitCeiling: false };

  rect.x += vel.x * dt;
  for (const p of platforms) {
    if (aabb(rect, p)) {
      if (vel.x > 0) rect.x = p.x - rect.w;
      else if (vel.x < 0) rect.x = p.x + p.w;
      result.hitWall = true;
    }
  }

  rect.y += vel.y * dt;
  for (const p of platforms) {
    if (aabb(rect, p)) {
      if (vel.y > 0) {
        rect.y = p.y - rect.h;
        vel.y = 0;
        result.onGround = true;
      } else if (vel.y < 0) {
        rect.y = p.y + p.h;
        vel.y = 0;
        result.hitCeiling = true;
      }
    }
  }

  return result;
}

export function centerX(r: Rect): number {
  return r.x + r.w / 2;
}

export function centerY(r: Rect): number {
  return r.y + r.h / 2;
}
