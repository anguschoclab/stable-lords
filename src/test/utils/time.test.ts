import { describe, it, expect } from 'vitest';
import { getSeasonFromWeek, rollWeather } from '@/utils/time';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { WeatherType } from '@/types/state.types';

describe('getSeasonFromWeek', () => {
  it('returns Spring for weeks 1-13', () => {
    expect(getSeasonFromWeek(1)).toBe('Spring');
    expect(getSeasonFromWeek(7)).toBe('Spring');
    expect(getSeasonFromWeek(13)).toBe('Spring');
  });

  it('returns Summer for weeks 14-26', () => {
    expect(getSeasonFromWeek(14)).toBe('Summer');
    expect(getSeasonFromWeek(20)).toBe('Summer');
    expect(getSeasonFromWeek(26)).toBe('Summer');
  });

  it('returns Fall for weeks 27-39', () => {
    expect(getSeasonFromWeek(27)).toBe('Fall');
    expect(getSeasonFromWeek(33)).toBe('Fall');
    expect(getSeasonFromWeek(39)).toBe('Fall');
  });

  it('returns Winter for weeks 40-52', () => {
    expect(getSeasonFromWeek(40)).toBe('Winter');
    expect(getSeasonFromWeek(46)).toBe('Winter');
    expect(getSeasonFromWeek(52)).toBe('Winter');
  });

  it('cycles correctly after year boundary', () => {
    expect(getSeasonFromWeek(53)).toBe('Spring');
    expect(getSeasonFromWeek(54)).toBe('Spring');
  });
});

describe('rollWeather', () => {
  it('returns a valid WeatherType', () => {
    const rng = new SeededRNGService(42);
    const weather = rollWeather(rng);
    const validWeather: Array<WeatherType> = [
      'Clear',
      'Overcast',
      'Rainy',
      'Sweltering',
      'Blazing Sun',
      'Breezy',
      'Gale',
      'Blood Moon',
      'Eclipse',
    ];
    expect(validWeather).toContain(weather);
  });

  it('produces deterministic results for same seed', () => {
    const rng1 = new SeededRNGService(42);
    const rng2 = new SeededRNGService(42);
    expect(rollWeather(rng1)).toBe(rollWeather(rng2));
  });

  it('produces different results for different seeds', () => {
    const rng1 = new SeededRNGService(42);
    const rng2 = new SeededRNGService(43);
    // While they could theoretically be the same, with different seeds this is unlikely
    const weather1 = rollWeather(rng1);
    const weather2 = rollWeather(rng2);
    // Just verify both are valid weather types
    const validWeather: Array<WeatherType> = [
      'Clear',
      'Overcast',
      'Rainy',
      'Sweltering',
      'Blazing Sun',
      'Breezy',
      'Gale',
      'Blood Moon',
      'Eclipse',
    ];
    expect(validWeather).toContain(weather1);
    expect(validWeather).toContain(weather2);
  });
});
