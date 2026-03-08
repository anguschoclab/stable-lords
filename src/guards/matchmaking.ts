/**
 * Matchmaking guards — rules that prevent invalid pairings.
 */

/** Stablemates cannot fight each other */
export function disallowStablemates(
  aStableId: string,
  dStableId: string
): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
}
