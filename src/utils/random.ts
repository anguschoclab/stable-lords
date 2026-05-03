/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 *
 * Uses the Mulberry32 algorithm for fast, high-quality,
 * deterministic randomness in the engine.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Generates a random float between 0 and 1 */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Generates a random integer between min and max (inclusive) */
  roll(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns true if a random roll is less than the given threshold (0-1) */
  chance(threshold: number): boolean {
    return this.next() < threshold;
  }

  /** Picks a random element from an array */
  pick<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * arr.length);
    const item = arr[idx];
    if (item === undefined) {
      throw new Error('RNG index out of bounds');
    }
    return item;
  }

  /** Shuffles an array (returns a new array) */
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tempI = copy[i];
      const tempJ = copy[j];
      if (tempI === undefined || tempJ === undefined) {
        throw new Error('Shuffle index out of bounds');
      }
      copy[i] = tempJ;
      copy[j] = tempI;
    }
    return copy;
  }

  /** Generates a deterministic hex-based ID with an optional prefix */
  uuid(prefix?: string): string {
    const chars = 'abcdef0123456789';
    let str = '';
    for (let i = 0; i < 12; i++) {
      str += chars[Math.floor(this.next() * chars.length)];
    }
    return prefix ? `${prefix}-${str}` : str;
  }

  /** Returns a new SeededRNG with the exact same state */
  clone(): SeededRNG {
    const clone = new SeededRNG(0);
    clone.state = this.state;
    return clone;
  }
}

/**
 * Universal random picker that works with both function-based RNG and IRNGService.
 * Standardizes selection across the entire engine.
 */
export function randomPick<T>(arr: T[], rng: (() => number) | IRNGService): T {
  if (arr.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  if (typeof rng === 'function') {
    const idx = Math.floor(rng() * arr.length);
    return arr[idx] as T;
  }
  return rng.pick(arr);
}

/**
 * Legacy pick alias for backward compatibility.
 * @deprecated Use randomPick instead.
 */
export const pick = randomPick;

/**
 * Converts a string to a numeric seed using character code reduction.
 */
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * FNV-1a hash function for deterministic string-to-number conversion.
 * Used for generating consistent seeds from IDs.
 */
export function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Universal shuffle that works with both function-based RNG and IRNGService.
 * Returns a new array.
 */
export function randomShuffle<T>(arr: T[], rng: (() => number) | IRNGService): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j =
      typeof rng === 'function' ? Math.floor(rng() * (i + 1)) : Math.floor(rng.next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Legacy shuffled alias for backward compatibility.
 * @deprecated Use randomShuffle instead.
 */
export const shuffled = randomShuffle;
