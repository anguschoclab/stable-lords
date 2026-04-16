/**
 * Crest Generator Service
 * Procedurally generates heraldic crests for stables with inheritance support
 */

import type {
  CrestData,
  CrestCharge,
  StableCrestConfig,
  ShieldShape,
  FieldType,
  MetalColor,
  ChargeType,
  CrestInheritanceConfig,
  CrestColorKey,
} from '@/types/crest.types';
import {
  CREST_COLORS,
  CHARGE_DEFINITIONS,
  PHILOSOPHY_CHARGE_PREFERENCES,
  SHIELD_SHAPE_WEIGHTS,
  INHERITANCE_CHANCES,
  DEFAULT_INHERITANCE,
} from '@/types/crest.types';
import { getChargePathsByType } from './chargePaths';

// Seeded random number generator for deterministic crests
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Pick a random element from an array
  pick<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Cannot pick from empty array');
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  // Weighted random selection
  pickWeighted<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length');
    }
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]!;
      if (random <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }

  // Random integer in range [min, max]
  roll(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Roll with chance of success
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// Color palette groups for thematic selection (available for future use)
// const COLOR_GROUPS = {
//   warm: ['crimson', 'brick', 'maroon', 'rust', 'bronze', 'ochre', 'amber'] as CrestColorKey[],
//   cool: ['royal', 'navy', 'steel', 'forest', 'hunter', 'emerald', 'moss'] as CrestColorKey[],
//   dark: ['sable', 'charcoal', 'blood', 'midnight', 'wine'] as CrestColorKey[],
//   light: ['pearl', 'platinum', 'silver', 'gold'] as CrestColorKey[],
// };

// Philosophy color preferences
const PHILOSOPHY_COLOR_PREFERENCES: Record<string, CrestColorKey[]> = {
  'Brute Force': ['crimson', 'blood', 'bronze', 'rust', 'maroon'],
  'Speed Kills': ['amber', 'silver', 'steel', 'ochre'],
  'Iron Defense': ['steel', 'navy', 'forest', 'charcoal', 'sable'],
  'Cunning': ['royalPurple', 'wine', 'midnight', 'navy'],
  'Spectacle': ['gold', 'crimson', 'amber', 'royal'],
  'Endurance': ['forest', 'hunter', 'moss', 'emerald'],
  'Balanced': ['royal', 'forest', 'gold', 'silver'],
  'Specialist': ['midnight', 'wine', 'steel', 'bronze'],
};

/**
 * Get the inheritance configuration for a given generation
 */
function getInheritanceConfig(generation: number): CrestInheritanceConfig {
  if (generation <= 0) {
    return INHERITANCE_CHANCES[0]!;
  }
  return INHERITANCE_CHANCES[generation] ?? DEFAULT_INHERITANCE;
}

/**
 * Select a shield shape based on tier and RNG
 */
function selectShieldShape(
  rng: SeededRNG,
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary',
  parentShape?: ShieldShape,
  generation: number = 0
): ShieldShape {
  const config = getInheritanceConfig(generation);

  // Try to inherit from parent
  if (parentShape && rng.chance(config.shieldShapeChance)) {
    return parentShape;
  }

  // Otherwise, pick based on tier weights
  const weights = SHIELD_SHAPE_WEIGHTS[tier];
  const shapes = Object.keys(weights) as ShieldShape[];
  const shapeWeights = shapes.map((s) => weights[s]);
  return rng.pickWeighted(shapes, shapeWeights);
}

/**
 * Select field pattern type
 */
function selectFieldType(
  rng: SeededRNG,
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary',
  parentFieldType?: FieldType,
  generation: number = 0
): FieldType {
  const config = getInheritanceConfig(generation);

  if (parentFieldType && rng.chance(config.fieldTypeChance)) {
    return parentFieldType;
  }

  // Define available field types by tier complexity
  const fieldTypesByTier: Record<string, FieldType[]> = {
    Minor: ['solid', 'fess', 'pale', 'bend'],
    Established: ['solid', 'fess', 'pale', 'bend', 'chevron', 'per-pale', 'per-fess'],
    Major: ['solid', 'fess', 'pale', 'bend', 'chevron', 'cross', 'per-pale', 'per-fess', 'gyronny', 'saltire'],
    Legendary: ['solid', 'fess', 'pale', 'bend', 'chevron', 'cross', 'saltire', 'per-pale', 'per-fess', 'gyronny', 'bend-sinister', 'chevron-inverted'],
  };

  const availableTypes = fieldTypesByTier[tier] ?? ['solid', 'fess', 'pale'];

  // Weighted toward solid for lower tiers, more complex for higher
  const weights = availableTypes.map((type) => {
    if (type === 'solid') return tier === 'Minor' ? 40 : tier === 'Established' ? 30 : tier === 'Major' ? 20 : 15;
    return 10;
  });

  return rng.pickWeighted(availableTypes, weights);
}

/**
 * Select colors for the crest
 */
function selectColors(
  rng: SeededRNG,
  philosophy: string,
  fieldType: FieldType,
  parentPrimaryColor?: string,
  parentSecondaryColor?: string,
  generation: number = 0
): { primaryColor: string; secondaryColor?: string; metalColor: MetalColor } {
  const config = getInheritanceConfig(generation);

  // Determine primary color
  let primaryColor: string;
  if (parentPrimaryColor && rng.chance(config.primaryColorChance)) {
    primaryColor = parentPrimaryColor;
  } else {
    // Pick from philosophy preferences or fallback to random
    const preferredColors = PHILOSOPHY_COLOR_PREFERENCES[philosophy] || Object.keys(CREST_COLORS) as CrestColorKey[];
    const colorKey = rng.pick(preferredColors);
    primaryColor = CREST_COLORS[colorKey as CrestColorKey];
  }

  // Determine secondary color (only for non-solid fields)
  let secondaryColor: string | undefined;
  if (fieldType !== 'solid') {
    if (parentSecondaryColor && rng.chance(config.secondaryColorChance)) {
      secondaryColor = parentSecondaryColor;
    } else {
      // Pick a contrasting color group
      const allColorKeys = Object.keys(CREST_COLORS) as CrestColorKey[];
      const availableColors = allColorKeys.filter((k) => CREST_COLORS[k] !== primaryColor);
      const pickedColor = rng.pick(availableColors);
      secondaryColor = CREST_COLORS[pickedColor];
    }
  }

  // Determine metal color (gold or silver)
  let metalColor: MetalColor;
  if (rng.chance(config.metalColorChance)) {
    // If inheriting, we don't have the parent's metal color stored separately
    // so just pick randomly
    metalColor = rng.chance(0.5) ? 'gold' : 'silver';
  } else {
    metalColor = rng.chance(0.6) ? 'gold' : 'silver';
  }

  return { primaryColor, secondaryColor, metalColor };
}

/**
 * Select charge based on philosophy and tier
 */
function selectCharge(
  rng: SeededRNG,
  philosophy: string,
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary',
  parentChargeType?: ChargeType,
  generation: number = 0
): CrestCharge {
  const config = getInheritanceConfig(generation);

  // Determine charge type
  let chargeType: ChargeType;
  if (parentChargeType && rng.chance(config.chargeTypeChance)) {
    chargeType = parentChargeType;
  } else {
    const preferredTypes = PHILOSOPHY_CHARGE_PREFERENCES[philosophy] || ['beast', 'symbol', 'weapon'];

    // Higher tiers get access to mythical charges
    if (tier === 'Legendary' || tier === 'Major') {
      if (rng.chance(0.3)) {
        preferredTypes.push('mythical');
      }
    }

    chargeType = rng.pick(preferredTypes);
  }

  // Select specific charge from the type
  const chargePaths = getChargePathsByType(chargeType);
  const availableCharges = Object.keys(chargePaths);
  const chargeName = rng.pick(availableCharges);

  // Determine count based on tier (higher = more charges)
  let count: 1 | 2 | 3 = 1;
  if (tier === 'Minor') {
    count = 1;
  } else if (tier === 'Established') {
    count = rng.chance(0.7) ? 1 : 2;
  } else if (tier === 'Major') {
    count = rng.chance(0.5) ? 1 : rng.chance(0.7) ? 2 : 3;
  } else {
    count = rng.chance(0.3) ? 1 : rng.chance(0.6) ? 2 : 3;
  }

  // Posture for beasts
  let posture: CrestCharge['posture'];
  if (chargeType === 'beast') {
    const postures: CrestCharge['posture'][] = ['rampant', 'passant', 'sejant', 'statant', 'forcene'];
    posture = rng.pick(postures);
  }

  return {
    type: chargeType,
    name: chargeName,
    count,
    posture,
  };
}

/**
 * Generate a new crest for a stable
 */
export function generateCrest(config: StableCrestConfig): CrestData {
  const { seed, philosophy, tier, parentCrest } = config;
  const rng = new SeededRNG(seed);

  // Determine generation
  const generation = parentCrest ? parentCrest.generation + 1 : 0;

  // Select shield shape
  const shieldShape = selectShieldShape(
    rng,
    tier,
    parentCrest?.shieldShape,
    generation
  );

  // Select field type
  const fieldType = selectFieldType(
    rng,
    tier,
    parentCrest?.fieldType,
    generation
  );

  // Select colors
  const { primaryColor, secondaryColor, metalColor } = selectColors(
    rng,
    philosophy,
    fieldType,
    parentCrest?.primaryColor,
    parentCrest?.secondaryColor,
    generation
  );

  // Select charge
  const charge = selectCharge(
    rng,
    philosophy,
    tier,
    parentCrest?.charge.type,
    generation
  );

  return {
    shieldShape,
    fieldType,
    primaryColor,
    secondaryColor,
    metalColor,
    charge,
    generation,
    parentCrest: parentCrest,
  };
}

/**
 * Inherit a crest from a parent (convenience wrapper around generateCrest)
 */
export function inheritCrest(parentCrest: CrestData, seed: number): CrestData {
  return generateCrest({
    seed,
    philosophy: 'Balanced', // Will be overridden by inheritance logic
    tier: 'Established', // Will use parent's tier context
    parentCrest,
  });
}

/**
 * Get the color hex value from a color key
 */
export function getCrestColor(colorKey: CrestColorKey): string {
  return CREST_COLORS[colorKey];
}

/**
 * Get charge description for display
 */
export function getChargeDescription(charge: CrestCharge): string {
  const def = CHARGE_DEFINITIONS[charge.type];
  return def?.descriptions[charge.name] || charge.name;
}

/**
 * Get a descriptive name for the crest
 */
export function getCrestDescription(crest: CrestData): string {
  const metalName = crest.metalColor === 'gold' ? 'Or' : 'Argent';
  const fieldDesc = crest.fieldType === 'solid' ? '' : ` ${crest.fieldType}`;
  const chargeDesc = getChargeDescription(crest.charge);
  const countDesc = crest.charge.count > 1 ? `${crest.charge.count} ` : '';

  return `${metalName}${fieldDesc} with ${countDesc}${chargeDesc}`;
}
