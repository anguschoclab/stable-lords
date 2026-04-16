/**
 * Crest System - Main exports
 */

export { StableCrest, SIZE_MAP } from '@/components/crest/StableCrest';
export {
  generateCrest,
  inheritCrest,
  getCrestColor,
  getChargeDescription,
  getCrestDescription,
} from './crestGenerator';

export {
  BEAST_PATHS,
  WEAPON_PATHS,
  SYMBOL_PATHS,
  NATURE_PATHS,
  CELESTIAL_PATHS,
  MYTHICAL_PATHS,
  getChargePathsByType,
  getRandomCharge,
  type ChargePath,
} from './chargePaths';

export type {
  ShieldShape,
  FieldType,
  MetalColor,
  ChargeType,
  BeastPosture,
  CrestCharge,
  CrestData,
  StableCrestConfig,
  CrestInheritanceConfig,
  CrestColorKey,
} from '@/types/crest.types';

export {
  CREST_COLORS,
  CHARGE_DEFINITIONS,
  PHILOSOPHY_CHARGE_PREFERENCES,
  SHIELD_SHAPE_WEIGHTS,
  INHERITANCE_CHANCES,
  DEFAULT_INHERITANCE,
} from '@/types/crest.types';
