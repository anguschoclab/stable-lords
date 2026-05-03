import { useEffect, useRef } from 'react';
import type { WeatherType } from '@/types/shared.types';

import { isIndoorArena } from '@/data/arenas';

interface WeatherAudioProps {
  weather: WeatherType;
  volume: number;
  enabled: boolean;
  arenaId?: string;
}

// Weather to ambient sound mapping
const WEATHER_AMBIENCE: Record<WeatherType, string | null> = {
  Clear: null,
  Overcast: null,
  Rainy: 'ambience-rain',
  Sweltering: null,
  Breezy: 'ambience-wind-breezy',
  'Blazing Sun': null,
  Gale: 'ambience-wind-gale',
  'Blood Moon': 'ambience-blood-moon',
  Eclipse: 'ambience-eclipse',
  Sandstorm: 'ambience-wind-gale',
  Mist: null,
  'Scorching Wind': 'ambience-wind-gale',
  Blizzard: 'ambience-wind-gale',
  'Dense Fog': null,
  Thunderstorm: 'ambience-thunderstorm',
  Ashfall: null,
  'Acid Rain': 'ambience-acid-rain',
  'Mana Surge': 'ambience-mana-surge',
};

export default function WeatherAudio({ weather, volume, enabled, arenaId }: WeatherAudioProps) {
  const currentWeatherRef = useRef<WeatherType | null>(null);
  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : weather;

  useEffect(() => {
    if (!enabled) return;

    // Crossfade between weather states
    if (effectiveWeather !== currentWeatherRef.current) {
      const oldAmbience = currentWeatherRef.current
        ? WEATHER_AMBIENCE[currentWeatherRef.current]
        : null;
      const newAmbience = WEATHER_AMBIENCE[effectiveWeather];

      if (oldAmbience !== newAmbience) {
        console.log(
          `[WeatherAudio] Crossfade: ${oldAmbience || 'none'} → ${newAmbience || 'none'} at ${volume * 100}%`
        );
      }

      currentWeatherRef.current = effectiveWeather;
    }
  }, [effectiveWeather, volume, enabled]);

  // Update volume without changing weather
  useEffect(() => {
    if (!enabled || !currentWeatherRef.current) return;

    const ambience = WEATHER_AMBIENCE[currentWeatherRef.current];
    if (ambience) {
      console.log(`[WeatherAudio] Volume update: ${ambience} at ${volume * 100}%`);
    }
  }, [volume, enabled]);

  return null;
}
