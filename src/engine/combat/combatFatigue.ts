/**
 * Combat Fatigue — endurance cost and fatigue penalty calculations.
 * Single source of truth for fatigue mechanics used by simulate.ts.
 */

// Endurance scaling
const ENDURANCE_OE_SCALING = 0.4;
const ENDURANCE_AL_SCALING = 0.2;

// Fatigue thresholds
const FATIGUE_MODERATE_THRESHOLD = 0.65; // Triggered slightly earlier to make stamina an urgent tactical factor
const FATIGUE_HEAVY_THRESHOLD = 0.45; // Adjusted to align with a harsher stamina economy

// Fatigue penalties
const FATIGUE_MODERATE_PENALTY = -6; // Harsher penalty to punish sub-optimal pacing
const FATIGUE_HEAVY_PENALTY = -15; // Brutal penalty to represent severe exhaustion in the arena

export function enduranceCost(oe: number, al: number): number {
  return Math.floor(oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING);
}

export function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const ratio = endurance / Math.max(1, maxEndurance);
  if (ratio > FATIGUE_MODERATE_THRESHOLD) return 0;
  if (ratio > FATIGUE_HEAVY_THRESHOLD) return FATIGUE_MODERATE_PENALTY;
  return FATIGUE_HEAVY_PENALTY;
}
