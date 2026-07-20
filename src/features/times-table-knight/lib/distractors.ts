import type { Fact } from "../model/game.types";
import { randInt, shuffle, type Rng } from "./random";

const OPTION_COUNT = 4;

function swapLastTwoDigits(n: number): number {
  const s = String(n);
  if (s.length < 2) return n;
  const chars = s.split("");
  [chars[s.length - 2], chars[s.length - 1]] = [chars[s.length - 1], chars[s.length - 2]];
  return Number(chars.join(""));
}

/**
 * Pedagogical distractors (§7 of the game plan): options mirror real errors —
 * off-by-one multiples, operation confusion, digit swaps / ±10 — never pure random.
 */
export function buildOptions(fact: Fact, rng: Rng = Math.random): number[] {
  const { a, b } = fact;
  const correct = a * b;

  const preferred = [a * (b + 1), a * (b - 1), a + b, swapLastTwoDigits(correct), correct + 10, correct - 10];

  const options = new Set<number>([correct]);
  for (const candidate of preferred) {
    if (options.size >= OPTION_COUNT) break;
    if (candidate >= 1 && candidate !== correct) options.add(candidate);
  }

  // Fallback: random near-misses, mirroring the trainer's random-delta logic
  let attempts = 0;
  while (options.size < OPTION_COUNT && attempts < 100) {
    const candidate = correct + randInt(-9, 9, rng);
    if (candidate >= 1 && candidate !== correct) options.add(candidate);
    attempts++;
  }
  while (options.size < OPTION_COUNT) {
    options.add(correct + options.size);
  }

  const distractors = [...options].filter((n) => n !== correct).slice(0, OPTION_COUNT - 1);
  return shuffle([correct, ...distractors], rng);
}
