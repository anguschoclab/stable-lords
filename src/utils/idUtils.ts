import { type SeededRNG } from "./random";

/**
 * ID Generation utilities with support for deterministic testing.
 */

let mockIdGenerator: (() => string) | null = null;

/**
 * Set a custom ID generator for unit testing.
 * @param generator - A function that returns a string ID
 */
export function setMockIdGenerator(generator: (() => string) | null) {
  mockIdGenerator = generator;
}

/**
 * Generates a unique ID (UUID or fallback).
 * Supports standard browser crypto and provides a deterministic path for tests.
 * @param rng - Optional SeededRNG for deterministic generation
 */
export function generateId(rng?: SeededRNG, prefix?: string): string {
  if (mockIdGenerator) return mockIdGenerator();

  if (rng) {
    return rng.uuid(prefix);
  }

  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : (typeof crypto !== "undefined" ? crypto : undefined);

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  // Fallback for environments where crypto is available but randomUUID is not
  if (cryptoObj?.getRandomValues) {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
        const n = parseInt(c, 10);
        return (n ^ (cryptoObj.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
    });
  }

  throw new Error("Secure random number generator not available in this environment.");
}

/** Simple FNV-1a hash for deterministic seeds from IDs */
export function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
