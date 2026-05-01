import type { WeatherType } from '@/types/shared.types';

/**
 * WeatherEffect — mechanical modifiers that a weather condition applies to a bout.
 * To add a new weather type: add it to WeatherType in shared.types.ts, then add an
 * entry here. No other files need changing.
 */
export interface WeatherEffect {
  staminaMult: number; // multiplier for enduranceCost (1.0 = baseline)
  initiativeMod: number; // flat bonus/penalty on initiative rolls
  riposteMod: number; // flat bonus/penalty on riposte defense rolls
  damageMult: number; // multiplier on hit damage
  description: string; // shown in UI tooltips
}

const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  Clear: {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Ideal conditions. No advantage given.',
  },
  Rainy: {
    staminaMult: 1.1,
    initiativeMod: -3,
    riposteMod: +5,
    damageMult: 0.9,
    description: 'Slick sand — footwork suffers, counters come easier.',
  },
  Sweltering: {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Oppressive heat drains stamina rapidly.',
  },
  Breezy: {
    staminaMult: 0.9,
    initiativeMod: +2,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Cool air aids recovery and sharpens reflexes.',
  },
  Overcast: {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Flat light, neutral conditions.',
  },
  'Blazing Sun': {
    staminaMult: 1.4,
    initiativeMod: -2,
    riposteMod: -3,
    damageMult: 1.1,
    description: 'Brutal sun — heavy fighters suffer, attacks hit harder.',
  },
  Gale: {
    staminaMult: 1.2,
    initiativeMod: -5,
    riposteMod: +3,
    damageMult: 0.85,
    description: 'Gale-force winds disrupt attacks and reward counters.',
  },
  'Blood Moon': {
    staminaMult: 0.9,
    initiativeMod: +3,
    riposteMod: 0,
    damageMult: 1.2,
    description: 'Crimson moon — crowd frenzy drives fighters harder.',
  },
  Eclipse: {
    staminaMult: 0.8,
    initiativeMod: +5,
    riposteMod: +5,
    damageMult: 1.3,
    description: 'Eerie darkness heightens all combat instincts.',
  },
  Sandstorm: {
    staminaMult: 1.2,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.9,
    description: 'Choking dust drains stamina and blinds fighters.',
  },
  Blizzard: {
    staminaMult: 1.5,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.8,
    description: 'Freezing winds drain stamina rapidly and numb the limbs.',
  },
  'Dense Fog': {
    staminaMult: 1.0,
    initiativeMod: -8,
    riposteMod: +12,
    damageMult: 1.1,
    description: 'Zero visibility — ambush tactics and counters reign supreme.',
  },
  Thunderstorm: {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.25,
    description: 'The roar of thunder and flash of lightning drives up the stakes.',
  },
  Ashfall: {
    staminaMult: 1.4,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 0.9,
    description: 'Falling ash chokes the air and exhausts the lungs.',
  },
  'Acid Rain': {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: -6,
    damageMult: 1.2,
    description: 'Burning rain erodes armor and creates a desperate struggle.',
  },
  'Mana Surge': {
    staminaMult: 0.7,
    initiativeMod: +10,
    riposteMod: +10,
    damageMult: 1.5,
    description: 'Raw magical energy empowers every strike and movement.',
  },
};

/**
 * Resolves the final mechanical weather condition based on arena type.
 * Indoor arenas negate all weather effects (return 'Clear').
 */
export function resolveEffectiveWeather(weather: WeatherType, arenaTags: string[]): WeatherType {
  const isIndoor = arenaTags.includes('indoor');
  return isIndoor ? 'Clear' : weather;
}

export function getWeatherEffect(weather: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS['Clear'];
}

/**
 * Returns an atmospheric opening line for the fight log.
 * Returns null for neutral weather (Clear/Overcast) — no line is emitted.
 */
export function weatherOpeningLine(weather: WeatherType): string | null {
  switch (weather) {
    case 'Clear':
      return null;
    case 'Overcast':
      return null;
    case 'Rainy':
      return 'Rain slicks the sand — footwork will be treacherous today.';
    case 'Sweltering':
      return 'The air hangs thick and hot. Stamina will be the deciding factor.';
    case 'Breezy':
      return 'A cool breeze sweeps through the arena. The fighters look sharp.';
    case 'Blazing Sun':
      return 'The sun beats down mercilessly. Heavy fighters will suffer.';
    case 'Gale':
      return 'Gale-force winds tear through the stands. Timing will be everything.';
    case 'Blood Moon':
      return 'A crimson moon hangs overhead. The crowd is already baying for blood.';
    case 'Eclipse':
      return 'Darkness falls mid-day. An eerie calm descends before the violence.';
    case 'Sandstorm':
      return 'A howling sandstorm blinds the arena. Every breath is a battle.';
    case 'Blizzard':
      return 'A brutal blizzard freezes the arena. Survival is the only goal.';
    case 'Dense Fog':
      return 'A thick mist swallows the fighters. Every shadow is a threat.';
    case 'Thunderstorm':
      return 'Thunder shakes the ground while lightning splits the sky.';
    case 'Ashfall':
      return 'Gray ash falls like snow. The air itself tastes of death.';
    case 'Acid Rain':
      return 'Hissing rain burns the skin. This fight will be short and brutal.';
    case 'Mana Surge':
      return 'The air crackles with power. The fighters move with impossible speed.';
    default:
      return null;
  }
}
