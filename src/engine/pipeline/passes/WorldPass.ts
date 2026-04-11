import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";
import type { GameState, WeatherType, Season } from "@/types/state.types";
import { generateWeather, advanceSeason } from "@/engine/weather";

/**
 * Stable Lords — World Pipeline Pass
 * Handles seasonal transitions and weather changes.
 */
export const PASS_METADATA = {
  name: "WorldPass",
  dependencies: ["EquipmentPass"] // Depends on equipment pass completing
};

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4];
}

export function rollWeather(rng: IRNGService): WeatherType {
  const roll = rng.next();
  if (roll < 0.6) return "Clear";
  if (roll < 0.75) return "Overcast";
  if (roll < 0.85) return "Rainy";
  if (roll < 0.90) return "Scalding";
  if (roll < 0.95) return "Blazing Sun";
  if (roll < 0.98) return "Drafty";
  if (roll < 0.99) return "Gale";
  return "Blood Moon";
}

export function runWorldPass(state: GameState, rng?: IRNGService, nextWeek: number): GameState {
  const rngService = rng || new SeededRNGService(nextWeek * 13);
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rngService);

  return {
    ...state,
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather
  };
}
