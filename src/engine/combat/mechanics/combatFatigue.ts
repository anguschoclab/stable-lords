/**
 * Combat Fatigue — endurance cost and fatigue penalty calculations.
 * Single source of truth for fatigue mechanics used by simulate.ts.
 */

import { getWeatherEffect } from './weatherEffects';
import type { WeatherType } from '@/types/shared.types';

// Endurance scaling — tuned so OE=5/AL=5 fighters with END≈25 reach the
// FATIGUE_MODERATE threshold around exchange ~10-12 (mid game). Prior values
// (0.1 / 0.05) produced base costs <1.0, which Math.floor inside this fn then
// truncated to 0 for any OE≤9, meaning defensive fighters never tired and
// the entire fatigue system was effectively dead for sub-aggressive plans.
const ENDURANCE_OE_SCALING = 0.18;
const ENDURANCE_AL_SCALING = 0.09;

// Fatigue thresholds (fighters need to be genuinely exhausted before penalties kick in)
const FATIGUE_MODERATE_THRESHOLD = 0.45;
const FATIGUE_HEAVY_THRESHOLD = 0.25;

// Fatigue penalties (reduced to avoid disproportionately punishing aggressive styles)
const FATIGUE_MODERATE_PENALTY = -4;
const FATIGUE_HEAVY_PENALTY = -8;

export function enduranceCost(oe: number, al: number, weather?: WeatherType | string): number {
  const baseCost = oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING;
  const weatherMod = getWeatherEffect((weather as WeatherType) ?? 'Clear').staminaMult;
  // Return raw fractional cost — the consumer (applyEnduranceCosts) rounds
  // once after all multipliers are applied, so we don't accumulate
  // double-rounding error here.
  return baseCost * weatherMod;
}

/**
 * Returns the skill roll penalty for the fighter's current fatigue level.
 * @param penaltyReduction Optional fraction to reduce the penalty (0 = no reduction, 0.5 = halved). From RopeADope trainer specialty.
 */
export function fatiguePenalty(
  endurance: number,
  maxEndurance: number,
  penaltyReduction: number = 0
): number {
  const ratio = endurance / Math.max(1, maxEndurance);
  let base = 0;
  if (ratio <= FATIGUE_HEAVY_THRESHOLD) base = FATIGUE_HEAVY_PENALTY;
  else if (ratio <= FATIGUE_MODERATE_THRESHOLD) base = FATIGUE_MODERATE_PENALTY;
  if (base === 0 || penaltyReduction === 0) return base;
  return Math.ceil(base * (1 - penaltyReduction)); // ceil because penalties are negative (less negative = better)
}
