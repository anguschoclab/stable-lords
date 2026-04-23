/**
 * Attribute Utility Functions
 * Provides common operations for warrior attribute calculations
 * Eliminates DRY violations of attribute reduce patterns
 */
import type { Attributes } from '@/types/shared.types';
import { ATTRIBUTE_KEYS } from '@/types/shared.types';

/**
 * Sums all attribute values
 * Eliminates DRY violation of ATTRIBUTE_KEYS.reduce pattern
 */
export function sumAttributes(attrs: Attributes): number {
  return ATTRIBUTE_KEYS.reduce((sum, key) => sum + attrs[key], 0);
}

/**
 * Sums specific attribute values by keys
 * Eliminates DRY violation of selective attribute summing
 */
export function sumAttributesByKey(attrs: Attributes, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (attrs[key as keyof Attributes] || 0), 0);
}
