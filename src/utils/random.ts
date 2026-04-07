/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 * 
 * Uses the Mulberry32 algorithm for fast, high-quality, 
 * deterministic randomness in the engine.
 */

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
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffles an array (returns a new array) */
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
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
    (clone as any).state = this.state;
    return clone;
  }
}

/** Legacy secure RNG (kept for non-deterministic UI needs if any) */
export function random32(): number {
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    (globalThis as any).crypto.getRandomValues(array);
    return array[0];
  }
  throw new Error("Secure random number generator not available in this environment.");
}
