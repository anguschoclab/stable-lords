import { useEffect, useRef } from 'react';
import type { WeatherType } from '@/types/shared.types';

interface WeatherAudioProps {
  weather: WeatherType;
  volume: number;
  enabled: boolean;
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
  'Thick Fog': 'ambience-wind-breezy', // Reusing an existing low wind/eerie sound
};

export default function WeatherAudio({ weather, volume, enabled }: WeatherAudioProps) {
  const currentWeatherRef = useRef<WeatherType | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Crossfade between weather states
    if (weather !== currentWeatherRef.current) {
      const oldAmbience = currentWeatherRef.current
        ? WEATHER_AMBIENCE[currentWeatherRef.current]
        : null;
      const newAmbience = WEATHER_AMBIENCE[weather];

      if (oldAmbience !== newAmbience) {
        console.log(
          `[WeatherAudio] Crossfade: ${oldAmbience || 'none'} → ${newAmbience || 'none'} at ${volume * 100}%`
        );
        // In full implementation: fade out old, fade in new
      }

      currentWeatherRef.current = weather;
    }
  }, [weather, volume, enabled]);

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
