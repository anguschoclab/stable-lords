import type { WeatherType } from "@/types/shared.types";

/**
 * WeatherEffect — mechanical modifiers that a weather condition applies to a bout.
 * To add a new weather type: add it to WeatherType in shared.types.ts, then add an
 * entry here. No other files need changing.
 */
export interface WeatherEffect {
  staminaMult: number;    // multiplier for enduranceCost (1.0 = baseline)
  initiativeMod: number;  // flat bonus/penalty on initiative rolls
  riposteMod: number;     // flat bonus/penalty on riposte defense rolls
  damageMult: number;     // multiplier on hit damage
  description: string;    // shown in UI tooltips
}

const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  "Clear":       { staminaMult: 1.0, initiativeMod:  0, riposteMod:  0, damageMult: 1.00, description: "Ideal conditions. No advantage given." },
  "Rainy":       { staminaMult: 1.1, initiativeMod: -3, riposteMod: +5, damageMult: 0.90, description: "Slick sand — footwork suffers, counters come easier." },
  "Sweltering":  { staminaMult: 1.3, initiativeMod:  0, riposteMod:  0, damageMult: 1.00, description: "Oppressive heat drains stamina rapidly." },
  "Breezy":      { staminaMult: 0.9, initiativeMod: +2, riposteMod:  0, damageMult: 1.00, description: "Cool air aids recovery and sharpens reflexes." },
  "Overcast":    { staminaMult: 1.0, initiativeMod:  0, riposteMod:  0, damageMult: 1.00, description: "Flat light, neutral conditions." },
  "Blazing Sun": { staminaMult: 1.4, initiativeMod: -2, riposteMod: -3, damageMult: 1.10, description: "Brutal sun — heavy fighters suffer, attacks hit harder." },
  "Gale":        { staminaMult: 1.2, initiativeMod: -5, riposteMod: +3, damageMult: 0.85, description: "Gale-force winds disrupt attacks and reward counters." },
  "Blood Moon":  { staminaMult: 0.9, initiativeMod: +3, riposteMod:  0, damageMult: 1.20, description: "Crimson moon — crowd frenzy drives fighters harder." },
  "Eclipse":     { staminaMult: 0.8, initiativeMod: +5, riposteMod: +5, damageMult: 1.30, description: "Eerie darkness heightens all combat instincts." },
};

export function getWeatherEffect(weather: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS["Clear"];
}

/**
 * Returns an atmospheric opening line for the fight log.
 * Returns null for neutral weather (Clear/Overcast) — no line is emitted.
 */
export function weatherOpeningLine(weather: WeatherType): string | null {
  switch (weather) {
    case "Clear":       return null;
    case "Overcast":    return null;
    case "Rainy":       return "Rain slicks the sand — footwork will be treacherous today.";
    case "Sweltering":  return "The air hangs thick and hot. Stamina will be the deciding factor.";
    case "Breezy":      return "A cool breeze sweeps through the arena. The fighters look sharp.";
    case "Blazing Sun": return "The sun beats down mercilessly. Heavy fighters will suffer.";
    case "Gale":        return "Gale-force winds tear through the stands. Timing will be everything.";
    case "Blood Moon":  return "A crimson moon hangs overhead. The crowd is already baying for blood.";
    case "Eclipse":     return "Darkness falls mid-day. An eerie calm descends before the violence.";
    default:            return null;
  }
}
