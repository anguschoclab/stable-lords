import type { Attributes, SeasonalGrowth } from "@/types/game";

/**
 * Retrieves the partial attribute gains for a specific warrior in a specific season.
 */
export function getSeasonalGains(
  seasonalGrowth: SeasonalGrowth[],
  warriorId: string,
  season: string
): Partial<Record<keyof Attributes, number>> {
  const entry = seasonalGrowth.find(sg => sg.warriorId === warriorId && sg.season === season);
  return entry?.gains ?? {};
}

/**
 * Updates the seasonal growth record for a warrior after a successful training session.
 */
export function updateSeasonalGains(
  seasonalGrowth: SeasonalGrowth[],
  warriorId: string,
  season: string,
  attr: keyof Attributes
): SeasonalGrowth[] {
  const existing = seasonalGrowth.find(sg => sg.warriorId === warriorId && sg.season === season);
  if (existing) {
    return seasonalGrowth.map(sg =>
      sg === existing
        ? { ...sg, gains: { ...sg.gains, [attr]: (sg.gains[attr] ?? 0) + 1 } }
        : sg
    );
  }
  return [...seasonalGrowth, { warriorId, season: season as any, gains: { [attr]: 1 } }];
}
