/**
 * Combat Fatigue — endurance cost and fatigue penalty calculations.
 * Single source of truth for fatigue mechanics used by simulate.ts.
 */

import { getWeatherEffect } from "./weatherEffects";
import type { WeatherType } from "@/types/shared.types";

// Endurance scaling — tuned so OE=8 fighters (END≈25) last ~20-25 exchanges before exhaustion
const ENDURANCE_OE_SCALING = 0.10;
const ENDURANCE_AL_SCALING = 0.05;

// Fatigue thresholds (fighters need to be genuinely exhausted before penalties kick in)
const FATIGUE_MODERATE_THRESHOLD = 0.45;
const FATIGUE_HEAVY_THRESHOLD = 0.25;

// Fatigue penalties (reduced to avoid disproportionately punishing aggressive styles)
const FATIGUE_MODERATE_PENALTY = -4;
const FATIGUE_HEAVY_PENALTY = -8;

export function enduranceCost(oe: number, al: number, weather?: WeatherType | string): number {
  const baseCost = oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING;
  const weatherMod = getWeatherEffect((weather as WeatherType) ?? "Clear").staminaMult;
  return Math.floor(baseCost * weatherMod);
}

/**
 * Returns the skill roll penalty for the fighter's current fatigue level.
 * @param penaltyReduction Optional fraction to reduce the penalty (0 = no reduction, 0.5 = halved). From RopeADope trainer specialty.
 */
export function fatiguePenalty(endurance: number, maxEndurance: number, penaltyReduction: number = 0): number {
  const ratio = endurance / Math.max(1, maxEndurance);
  let base = 0;
  if (ratio <= FATIGUE_HEAVY_THRESHOLD) base = FATIGUE_HEAVY_PENALTY;
  else if (ratio <= FATIGUE_MODERATE_THRESHOLD) base = FATIGUE_MODERATE_PENALTY;
  if (base === 0 || penaltyReduction === 0) return base;
  return Math.ceil(base * (1 - penaltyReduction)); // ceil because penalties are negative (less negative = better)
}
