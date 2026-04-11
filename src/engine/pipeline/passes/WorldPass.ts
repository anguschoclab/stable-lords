import { SeededRNG } from "@/utils/random";
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

export function rollWeather(rng: SeededRNG): WeatherType {
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

export function runWorldPass(state: GameState, rng: SeededRNG, nextWeek: number): GameState {
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rng);

  return {
    ...state,
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather
  };
}
