/**
 * Mathematical utility functions
 * Consolidates common math operations to eliminate DRY violations
 */

/**
 * Clamps a value between min and max (inclusive)
 * Replaces inline Math.max(min, Math.min(max, value)) patterns
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamps a value between 0 and 1 (inclusive)
 * Useful for percentages, probabilities, and interpolation factors
 */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * Linear interpolation between a and b by factor t
 * t should be between 0 and 1 (will be clamped)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

/**
 * Maps a value from one range to another
 * Example: mapRange(5, 0, 10, 0, 100) = 50
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/**
 * Rounds a number to a specified number of decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Adds two numbers together, capping at a maximum value
 * Used for cumulative stat calculations
 */
export function addCapped(base: number, addition: number, max: number): number {
  return Math.min(base + addition, max);
}
