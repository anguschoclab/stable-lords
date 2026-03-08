/**
 * Fame/Popularity bump helpers.
 */
export type FamePopBump = {
  fameDelta?: number;
  popDelta?: number;
  reason?: string;
};

export function applyFamePopBump(
  fame: number,
  pop: number,
  bump: FamePopBump
): { fame: number; pop: number } {
  return {
    fame: Math.max(0, Math.min(100, fame + (bump.fameDelta ?? 0))),
    pop: Math.max(0, Math.min(100, pop + (bump.popDelta ?? 0))),
  };
}
