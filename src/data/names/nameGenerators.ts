/**
 * Name generation utilities for Stable Lords.
 * Provides functions to generate random names for warriors, owners, and stables.
 */

import { WARRIOR_NAMES } from './warriorNames';
import { OWNER_FIRST, OWNER_LAST } from './ownerNames';
import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './stableNames';
import { randomPick } from '@/utils/random';

/**
 * Generates a random warrior name from the WARRIOR_NAMES array.
 *
 * @param rng - Optional random number generator function
 * @returns A random warrior name
 */
export function randomWarriorName(rng?: () => number): string {
  return randomPick(rng || Math.random, WARRIOR_NAMES);
}

/**
 * Generates a random owner name by combining first and last names.
 *
 * @param rng - Optional random number generator function
 * @returns A random owner name in "First Last" format
 */
export function randomOwnerName(rng?: () => number): string {
  const firstName = randomPick(rng || Math.random, OWNER_FIRST);
  const lastName = randomPick(rng || Math.random, OWNER_LAST);
  return `${firstName} ${lastName}`;
}

/**
 * Generates a random stable name using either prefixed format or alternative names.
 *
 * @param rng - Optional random number generator function
 * @returns A random stable name
 */
export function randomStableName(rng?: () => number): string {
  // 50% chance for prefixed name, 50% chance for alternative name
  const usePrefixed = (rng || Math.random)() < 0.5;
  return usePrefixed ? randomPrefixedStableName(rng) : randomAltStableName(rng);
}

/**
 * Generates a random prefixed stable name (e.g., "Red Dragon", "Iron Wolf").
 *
 * @param rng - Optional random number generator function
 * @returns A random prefixed stable name
 */
export function randomPrefixedStableName(rng?: () => number): string {
  const prefix = randomPick(rng || Math.random, STABLE_PREFIXES);
  const suffix = randomPick(rng || Math.random, STABLE_SUFFIXES);
  return `${prefix} ${suffix}`;
}

/**
 * Generates a random alternative stable name from the STABLE_ALT array.
 *
 * @param rng - Optional random number generator function
 * @returns A random alternative stable name
 */
export function randomAltStableName(rng?: () => number): string {
  return randomPick(rng || Math.random, STABLE_ALT);
}
