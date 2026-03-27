/**
 * Combat Fatigue — endurance cost and fatigue penalty calculations.
 * Single source of truth for fatigue mechanics used by simulate.ts.
 */

// Endurance scaling
const ENDURANCE_OE_SCALING = 0.4;
const ENDURANCE_AL_SCALING = 0.2;

// Fatigue thresholds
const FATIGUE_MODERATE_THRESHOLD = 0.65; // Increased to trigger moderate fatigue earlier
const FATIGUE_HEAVY_THRESHOLD = 0.40; // Increased to trigger heavy fatigue earlier

// Fatigue penalties
const FATIGUE_MODERATE_PENALTY = -2;
const FATIGUE_HEAVY_PENALTY = -8; // Increased penalty to make fatigue more punishing

export function enduranceCost(oe: number, al: number): number {
  return Math.floor(oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING);
}

export function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const ratio = endurance / Math.max(1, maxEndurance);
  if (ratio > FATIGUE_MODERATE_THRESHOLD) return 0;
  if (ratio > FATIGUE_HEAVY_THRESHOLD) return FATIGUE_MODERATE_PENALTY;
  return FATIGUE_HEAVY_PENALTY;
}
