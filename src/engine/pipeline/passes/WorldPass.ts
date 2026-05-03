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

export function rollWeather(rng: IRNGService, season: Season): WeatherType {
  const roll = rng.next();

  // Summer: Hot, dry, and storm-prone
  if (season === 'Summer') {
    if (roll < 0.3) return 'Clear';
    if (roll < 0.4) return 'Blazing Sun';
    if (roll < 0.5) return 'Scorching Wind';
    if (roll < 0.6) return 'Sweltering';
    if (roll < 0.7) return 'Overcast';
    if (roll < 0.8) return 'Thunderstorm';
    if (roll < 0.88) return 'Sandstorm';
    if (roll < 0.94) return 'Ashfall';
    if (roll < 0.97) return 'Gale';
    if (roll < 0.995) return 'Blood Moon'; // Includes 0.99
    if (roll < 0.998) return 'Eclipse';
    return 'Mana Surge';
  }

  // Winter: Cold, dark, and frozen
  if (season === 'Winter') {
    if (roll < 0.25) return 'Clear';
    if (roll < 0.5) return 'Overcast';
    if (roll < 0.65) return 'Blizzard';
    if (roll < 0.75) return 'Rainy';
    if (roll < 0.85) return 'Dense Fog';
    if (roll < 0.92) return 'Gale';
    if (roll < 0.96) return 'Breezy';
    if (roll < 0.995) return 'Blood Moon'; // Includes 0.99
    if (roll < 0.998) return 'Eclipse';
    return 'Mana Surge';
  }

  // Spring/Fall: Wet, windy, and unpredictable
  if (roll < 0.35) return 'Clear';
  if (roll < 0.5) return 'Overcast';
  if (roll < 0.6) return 'Rainy';
  if (roll < 0.65) return 'Mist';
  if (roll < 0.75) return 'Breezy';
  if (roll < 0.8) return 'Dense Fog';
  if (roll < 0.85) return 'Thunderstorm';
  if (roll < 0.9) return 'Acid Rain';
  if (roll < 0.94) return 'Gale';
  if (roll < 0.995) return 'Blood Moon'; // Includes 0.99
  if (roll < 0.998) return 'Eclipse';
  return 'Mana Surge';
}

export function runWorldPass(_state: GameState, nextWeek: number, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(nextWeek * 13);
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rngService, nextSeason);

  return {
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather,
  };
}
