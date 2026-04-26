import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { GameState, WeatherType, Season } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — World Pipeline Pass
 * Handles seasonal transitions and weather changes.
 */
const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4];
}

export function rollWeather(rng: IRNGService): WeatherType {
  const roll = rng.next();
  if (roll < 0.6) return 'Clear';
  if (roll < 0.75) return 'Overcast';
  if (roll < 0.85) return 'Rainy';
  if (roll < 0.9) return 'Sweltering';
  if (roll < 0.95) return 'Blazing Sun';
  if (roll < 0.96) return 'Gale';
  if (roll < 0.97) return 'Thick Fog';
  if (roll < 0.985) return 'Breezy';
  if (roll < 0.995) return 'Blood Moon';
  return 'Eclipse';
}

export function runWorldPass(_state: GameState, nextWeek: number, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(nextWeek * 13);
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rngService);

  return {
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather,
  };
}
