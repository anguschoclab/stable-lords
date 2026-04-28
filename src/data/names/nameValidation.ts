/**
 * Name validation utilities for Stable Lords.
 * Provides validation functions for warrior, owner, and stable names.
 */

import { WARRIOR_NAMES } from './warriorNames';
import { OWNER_FIRST, OWNER_LAST } from './ownerNames';
import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './stableNames';

/**
 * Validates if a name is a valid warrior name.
 * 
 * @param name - The name to validate
 * @returns True if the name is in the WARRIOR_NAMES array
 */
export function isValidWarriorName(name: string): boolean {
  return WARRIOR_NAMES.includes(name.toUpperCase());
}

/**
 * Validates if a name is a valid owner first name.
 * 
 * @param name - The name to validate
 * @returns True if the name is in the OWNER_FIRST array
 */
export function isValidOwnerFirstName(name: string): boolean {
  return OWNER_FIRST.includes(name);
}

/**
 * Validates if a name is a valid owner last name.
 * 
 * @param name - The name to validate
 * @returns True if the name is in the OWNER_LAST array
 */
export function isValidOwnerLastName(name: string): boolean {
  return OWNER_LAST.includes(name);
}

/**
 * Validates if a full owner name is valid (both first and last names).
 * 
 * @param fullName - The full name to validate (e.g., "John Smith")
 * @returns True if both first and last names are valid
 */
export function isValidOwnerName(fullName: string): boolean {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length !== 2) return false;
  
  const [firstName, lastName] = parts;
  return isValidOwnerFirstName(firstName) && isValidOwnerLastName(lastName);
}

/**
 * Validates if a name is a valid stable prefix.
 * 
 * @param prefix - The prefix to validate
 * @returns True if the prefix is in the STABLE_PREFIXES array
 */
export function isValidStablePrefix(prefix: string): boolean {
  return STABLE_PREFIXES.includes(prefix);
}

/**
 * Validates if a name is a valid stable suffix.
 * 
 * @param suffix - The suffix to validate
 * @returns True if the suffix is in the STABLE_SUFFIXES array
 */
export function isValidStableSuffix(suffix: string): boolean {
  return STABLE_SUFFIXES.includes(suffix);
}

/**
 * Validates if a name is a valid alternative stable name.
 * 
 * @param altName - The alternative name to validate
 * @returns True if the name is in the STABLE_ALT array
 */
export function isValidAltStableName(altName: string): boolean {
  return STABLE_ALT.includes(altName);
}

/**
 * Validates if a stable name is valid (either alt format or prefix+suffix).
 * 
 * @param stableName - The stable name to validate
 * @returns True if the stable name is valid in any format
 */
export function isValidStableName(stableName: string): boolean {
  // Check if it's an alt name
  if (isValidAltStableName(stableName)) {
    return true;
  }
  
  // Check if it's prefix+suffix format
  const parts = stableName.trim().split(/\s+/);
  if (parts.length === 2) {
    const [prefix, suffix] = parts;
    return isValidStablePrefix(prefix) && isValidStableSuffix(suffix);
  }
  
  return false;
}

/**
 * Gets the format type of a stable name.
 * 
 * @param stableName - The stable name to analyze
 * @returns The format type: 'alt', 'prefixed', or 'invalid'
 */
export function getStableNameFormat(stableName: string): 'alt' | 'prefixed' | 'invalid' {
  if (isValidAltStableName(stableName)) {
    return 'alt';
  }
  
  const parts = stableName.trim().split(/\s+/);
  if (parts.length === 2) {
    const [prefix, suffix] = parts;
    if (isValidStablePrefix(prefix) && isValidStableSuffix(suffix)) {
      return 'prefixed';
    }
  }
  
  return 'invalid';
}

/**
 * Filters a list of warrior names to only include valid names.
 * 
 * @param names - Array of names to filter
 * @returns Array of valid warrior names
 */
export function filterValidWarriorNames(names: string[]): string[] {
  return names.filter(name => isValidWarriorName(name));
}

/**
 * Filters a list of owner names to only include valid names.
 * 
 * @param names - Array of full names to filter
 * @returns Array of valid owner names
 */
export function filterValidOwnerNames(names: string[]): string[] {
  return names.filter(name => isValidOwnerName(name));
}

/**
 * Filters a list of stable names to only include valid names.
 * 
 * @param names - Array of stable names to filter
 * @returns Array of valid stable names
 */
export function filterValidStableNames(names: string[]): string[] {
  return names.filter(name => isValidStableName(name));
}
