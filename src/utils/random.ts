/**
 * Utility functions for random number generation.
 *
 * Provides cryptographically secure random numbers
 * for operations that require strong unpredictability.
 */
export function random32(): number {
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto && (globalThis as any).crypto.getRandomValues) {
    const array = new Uint32Array(1);
    (globalThis as any).crypto.getRandomValues(array);
    return array[0];
  }

  // Fail closed if secure RNG is not available
  throw new Error("Secure random number generator not available in this environment.");
}
