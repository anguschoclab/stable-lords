/**
 * Time Utility Functions
 * Provides common operations for season and weather calculations
 * Eliminates DRY violations of season/weather calculation patterns
 */
import type { Season, WeatherType } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

/**
 * Calculates the season from a week number
 * Eliminates DRY violation of season calculation patterns
 */
export function getSeasonFromWeek(week: number): Season {
  return SEASONS[Math.floor((week - 1) / 13) % 4]!;
}

/**
 * Rolls for weather using RNG with probability thresholds
 * Eliminates DRY violation of weather rolling patterns
 */
export function rollWeather(rng: IRNGService): WeatherType {
  const roll = rng.next();
  if (roll < 0.6) return 'Clear';
  if (roll < 0.75) return 'Overcast';
  if (roll < 0.85) return 'Rainy';
  if (roll < 0.9) return 'Sweltering';
  if (roll < 0.95) return 'Blazing Sun';
  if (roll < 0.98) return 'Breezy';
  if (roll < 0.985) return 'Gale';
  if (roll < 0.995) return 'Blood Moon';
  return 'Eclipse';
}
