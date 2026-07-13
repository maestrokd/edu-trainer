import type { Rect } from "./entities";

export interface Camera {
  x: number;
  viewW: number;
  viewH: number;
  /** boss-arena lock; null = free side-scroll */
  lockMinX: number | null;
  lockMaxX: number | null;
}

export function createCamera(viewW: number, viewH: number): Camera {
  return { x: 0, viewW, viewH, lockMinX: null, lockMaxX: null };
}

/** side-scroll follow: knight sits ~38% from the left edge, smoothed */
export function updateCamera(cam: Camera, knight: Rect, stageWidth: number, dt: number): void {
  const target = knight.x + knight.w / 2 - cam.viewW * 0.38;
  const minX = cam.lockMinX ?? 0;
  const maxX = Math.max(minX, (cam.lockMaxX ?? stageWidth) - cam.viewW);
  const clamped = Math.min(maxX, Math.max(minX, target));
  const lerp = Math.min(1, dt * 6);
  cam.x += (clamped - cam.x) * lerp;
}
