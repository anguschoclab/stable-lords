import { SeededRNG } from "./random";

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Returns a deterministic, seeded pseudo-random number generator.
 * Uses the unified SeededRNG utility (mulberry32).
 */
export function seededRng(seed: number) {
  const rng = new SeededRNG(seed);
  return () => rng.next();
}
