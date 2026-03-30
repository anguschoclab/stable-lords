/**
 * Standardized key generation for Maps to ensure consistency across the engine.
 */

/**
 * Returns a consistent key for a pair of stable IDs, regardless of order.
 * Ensures that (A, B) and (B, A) result in the same key.
 */
export function getStablePairKey(id1: string, id2: string): string {
  if (id1 < id2) return `${id1}|${id2}`;
  return `${id2}|${id1}`;
}

/**
 * Returns a consistent key for a pair of warrior IDs.
 */
export function getWarriorPairKey(id1: string, id2: string): string {
  if (id1 < id2) return `${id1}|${id2}`;
  return `${id2}|${id1}`;
}
