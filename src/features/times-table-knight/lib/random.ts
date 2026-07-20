/** Injectable randomness so domain logic stays deterministic under test */
export type Rng = () => number;

export function randInt(min: number, max: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Weighted<T> {
  item: T;
  weight: number;
}

/** Small deterministic PRNG — stage layouts are reproducible per seed */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedPick<T>(items: readonly Weighted<T>[], rng: Rng = Math.random): T {
  const total = items.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * total;
  for (const { item, weight } of items) {
    roll -= weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1].item;
}
