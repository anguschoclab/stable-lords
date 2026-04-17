/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 * 
 * Uses the Mulberry32 algorithm for fast, high-quality, 
 * deterministic randomness in the engine.
 */
import type { IRNGService } from "@/engine/core/rng/IRNGService";

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Generates a random float between 0 and 1 */
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
      throw new Error("Cannot pick from empty array");
    }
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  /** Shuffles an array (returns a new array) */
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i]!, copy[j]!] = [copy[j]!, copy[i]!];
    }
    return copy;
  }

  /** Generates a deterministic hex-based ID with an optional prefix */
  uuid(prefix?: string): string {
    const chars = "abcdef0123456789";
    let str = "";
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

/** Legacy secure RNG (kept for non-deterministic UI needs if any) */
export function random32(): number {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof (globalThis.crypto as Crypto).getRandomValues === "function") {
    const array = new Uint32Array(1);
    (globalThis.crypto as Crypto).getRandomValues(array);
    return array[0]!;
  }
  throw new Error("Secure random number generator not available in this environment.");
}

/**
 * Universal random picker that works with both function-based RNG and IRNGService
 * Eliminates DRY violation of Math.floor(rng() * arr.length) pattern
 */
export function randomPick<T>(rng: (() => number) | IRNGService, arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  if (typeof rng === 'function') {
    return arr[Math.floor(rng() * arr.length)]!;
  }
  return rng.pick(arr);
}

/**
 * Converts a string to a numeric seed using character code reduction
 * Eliminates DRY violation of seed generation patterns
 */
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * FNV-1a hash function for deterministic string-to-number conversion
 * Used for generating consistent seeds from IDs
 * Eliminates DRY violation of hash string patterns
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
 * Creates a deterministic RNG seeded from week number
 * Eliminates DRY violation of `new SeededRNGService(week * PRIME + OFFSET)` pattern
 * 
 * @param week - The game week number
 * @param salt - Optional salt (string or number) for variation
 * @param basePrime - Prime number multiplier (default: 9973)
 */
export function createWeekRng(
  week: number,
  salt?: string | number,
  basePrime: number = 9973
): SeededRNG {
  const baseSeed = week * basePrime;
  if (typeof salt === 'string') {
    return new SeededRNG(baseSeed + hashStr(salt));
  }
  return new SeededRNG(baseSeed + (salt ?? 0));
}

/**
 * Creates a deterministic RNG using legacy seed pattern
 * Used for backward compatibility with existing seed calculations
 * 
 * @param week - The game week number
 * @param id - String ID or numeric identifier
 * @param multiplier - Prime multiplier (default: 7919)
 */
export function createWeekRngLegacy(
  week: number,
  id: string | number,
  multiplier: number = 7919
): SeededRNG {
  const salt = typeof id === 'string' ? id.length : id;
  return new SeededRNG(week * multiplier + salt);
}
