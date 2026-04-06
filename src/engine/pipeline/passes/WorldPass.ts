import { SeededRNG } from "@/utils/random";
import type { GameState, Season, WeatherType } from "@/types/game";

/**
 * Stable Lords — World Pipeline Pass
 */

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
  return "Blood Moon";
}

export function runWorldPass(state: GameState, rootRng?: SeededRNG): GameState {
  const nextWeek = state.week + 1;
  const nextSeason = computeNextSeason(nextWeek);
  
  // Deterministic weather roll - use injected RNG or sub-seed
  const weatherRng = rootRng?.clone() ?? new SeededRNG(nextWeek * 1337 + 42);
  const nextWeather = rollWeather(weatherRng);

  return {
    ...state,
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather
  };
}
