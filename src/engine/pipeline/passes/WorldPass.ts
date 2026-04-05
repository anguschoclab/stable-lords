import { GameState, Season, WeatherType } from "@/types/game";
import { seededRng } from "@/engine/rivals";

/**
 * Stable Lords — World Pipeline Pass
 */

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4];
}

export function rollWeather(rng: () => number): WeatherType {
  const roll = rng();
  if (roll < 0.6) return "Clear";
  if (roll < 0.75) return "Overcast";
  if (roll < 0.85) return "Rainy";
  if (roll < 0.90) return "Scalding";
  if (roll < 0.95) return "Blazing Sun";
  return "Drafty";
}

export function runWorldPass(state: GameState): GameState {
  const nextWeek = state.week + 1;
  const nextSeason = computeNextSeason(nextWeek);
  
  // Deterministic weather roll
  const weatherRng = seededRng(nextWeek * 1337 + 42);
  const nextWeather = rollWeather(() => weatherRng());

  return {
    ...state,
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather
  };
}
