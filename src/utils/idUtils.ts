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
 */
export function generateId(): string {
  if (mockIdGenerator) return mockIdGenerator();

  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments where crypto is available but randomUUID is not
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return (([1e7] as unknown as number) + -1e3 + -4e3 + -8e3 + -1e11).replace(
      /[018]/g,
      (c: string) =>
        (
          Number(c) ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
        ).toString(16)
    );
  }

  // Ultimate fallback
  return Date.now() + "_" + Math.floor(Math.random() * 1e6);
}
