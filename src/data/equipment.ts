/**
 * Stable Lords — Canonical Equipment Database
 * Weapons, armor, shields, helms with codes, weights, style restrictions.
 * Based on canonical Duelmasters equipment tables.
 * 
 * This file now serves as a compatibility layer for the modular equipment system.
 * For new code, prefer importing from '@/data/equipment' directly.
 */

// Re-export all functionality from the modular equipment system
export * from './equipment';

// Re-export types for backward compatibility
export type { 
  EquipmentItem, 
  EquipmentSlot, 
  EquipmentLoadout, 
  WeaponReqResult, 
  WeaponReqCheck,
  LoadoutIssue
} from './equipment/equipment.types';

// Re-export specific equipment arrays for backward compatibility with tests
export { WEAPONS } from './equipment/weapons';
export { ARMORS } from './equipment/armor';
export { HELMS } from './equipment/helms';
export { SHIELDS } from './equipment/shields';

// Re-export utility functions that tests might be importing
export {
  getAvailableItems,
  getItemById,
  getItemByCode,
  isPreferredWeapon,
  getStyleDefaultLoadout,
  checkWeaponRequirements,
  validateLoadout,
  getLoadoutWeight,
  isOverEncumbered,
  ALL_EQUIPMENT,
  DEFAULT_LOADOUT,
  getClassicWeaponBonus,
} from './equipment/equipment.utils';

// Re-export shield constants from weapons module
export { SHIELD_ITEM_IDS, SHIELD_COVERAGE } from './equipment/weapons';
