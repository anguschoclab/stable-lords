/**
 * Combat Fatigue — endurance cost and fatigue penalty calculations.
 * Single source of truth for fatigue mechanics used by simulate.ts.
 */

// Endurance scaling
const ENDURANCE_OE_SCALING = 0.5;
const ENDURANCE_AL_SCALING = 0.3;

// Fatigue thresholds
const FATIGUE_MODERATE_THRESHOLD = 0.5;
const FATIGUE_HEAVY_THRESHOLD = 0.25;
const FATIGUE_COLLAPSE_THRESHOLD = 0.1;

// Fatigue penalties
const FATIGUE_MODERATE_PENALTY = -2;
const FATIGUE_HEAVY_PENALTY = -4;
const FATIGUE_COLLAPSE_PENALTY = -7;

export function enduranceCost(oe: number, al: number): number {
  return Math.max(1, Math.round(oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING));
}

export function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const ratio = endurance / maxEndurance;
  if (ratio > FATIGUE_MODERATE_THRESHOLD) return 0;
  if (ratio > FATIGUE_HEAVY_THRESHOLD) return FATIGUE_MODERATE_PENALTY;
  if (ratio > FATIGUE_COLLAPSE_THRESHOLD) return FATIGUE_HEAVY_PENALTY;
  return FATIGUE_COLLAPSE_PENALTY;
}
