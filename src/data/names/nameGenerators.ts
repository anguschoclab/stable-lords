/**
 * Name generation utilities for Stable Lords.
 * Provides functions to generate random names for warriors, owners, and stables.
 */

import { WARRIOR_NAMES } from './warriorNames';
import { OWNER_FIRST, OWNER_LAST } from './ownerNames';
import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './stableNames';

/**
 * Picks a random element from an array using the provided RNG or Math.random.
 */
function pick<T>(arr: T[], rng?: () => number): T {
  const safeRng = rng || Math.random;
  return arr[Math.floor(safeRng() * arr.length)];
}

/**
 * Generates a random warrior name from the WARRIOR_NAMES array.
 * 
 * @param rng - Optional random number generator function
 * @returns A random warrior name
 */
export function randomWarriorName(rng?: () => number): string {
  return pick(WARRIOR_NAMES, rng);
}

/**
 * Generates a random owner name by combining first and last names.
 * 
 * @param rng - Optional random number generator function
 * @returns A random owner name in "First Last" format
 */
export function randomOwnerName(rng?: () => number): string {
  return `${pick(OWNER_FIRST, rng)} ${pick(OWNER_LAST, rng)}`;
}

/**
 * Generates a random stable name.
 * 40% chance of using an alternative style name, 60% chance of prefix+suffix combination.
 * 
 * @param rng - Optional random number generator function
 * @returns A random stable name
 */
export function randomStableName(rng?: () => number): string {
  const safeRng = rng || Math.random;
  // 40% chance of alt-style name, 60% prefix+suffix
  if (safeRng() < 0.4) {
    return pick(STABLE_ALT, rng);
  }
  return `${pick(STABLE_PREFIXES, rng)} ${pick(STABLE_SUFFIXES, rng)}`;
}

/**
 * Generates a random stable name using only prefix+suffix format.
 * 
 * @param rng - Optional random number generator function
 * @returns A random stable name in "Prefix Suffix" format
 */
export function randomPrefixedStableName(rng?: () => number): string {
  return `${pick(STABLE_PREFIXES, rng)} ${pick(STABLE_SUFFIXES, rng)}`;
}

/**
 * Generates a random stable name using only alternative format.
 * 
 * @param rng - Optional random number generator function
 * @returns A random alternative-style stable name
 */
export function randomAltStableName(rng?: () => number): string {
  return pick(STABLE_ALT, rng);
}
