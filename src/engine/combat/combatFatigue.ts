
export function enduranceCost(oe: number, al: number): number {
  const ENDURANCE_OE_SCALING = 0.4;
  const ENDURANCE_AL_SCALING = 0.2;
  return Math.floor(oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING);
}

export function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const FATIGUE_MODERATE_THRESHOLD = 0.5;
  const FATIGUE_HEAVY_THRESHOLD = 0.25;
  const ratio = endurance / Math.max(1, maxEndurance);
  if (ratio <= FATIGUE_HEAVY_THRESHOLD) return -4;
  if (ratio <= FATIGUE_MODERATE_THRESHOLD) return -2;
  return 0;
}
