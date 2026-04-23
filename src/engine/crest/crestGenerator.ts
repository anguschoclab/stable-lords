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
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// Philosophy color preferences
const PHILOSOPHY_COLOR_PREFERENCES: Record<string, CrestColorKey[]> = {
  'Brute Force': ['crimson', 'blood', 'bronze', 'rust', 'maroon'],
  'Speed Kills': ['amber', 'silver', 'steel', 'ochre'],
  'Iron Defense': ['steel', 'navy', 'forest', 'charcoal', 'sable'],
  Cunning: ['royalPurple', 'wine', 'midnight', 'navy'],
  Spectacle: ['gold', 'crimson', 'amber', 'royal'],
  Endurance: ['forest', 'hunter', 'moss', 'emerald'],
  Balanced: ['royal', 'forest', 'gold', 'silver'],
  Specialist: ['midnight', 'wine', 'steel', 'bronze'],
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
  rng: IRNGService,
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
  rng: IRNGService,
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
    Major: [
      'solid',
      'fess',
      'pale',
      'bend',
      'chevron',
      'cross',
      'per-pale',
      'per-fess',
      'gyronny',
      'saltire',
      'pale-environ',
      'quarterly',
    ],
    Legendary: [
      'solid',
      'fess',
      'pale',
      'bend',
      'chevron',
      'cross',
      'saltire',
      'per-pale',
      'per-fess',
      'gyronny',
      'bend-sinister',
      'chevron-inverted',
      'pale-environ',
      'quarterly',
    ],
  };

  const availableTypes = fieldTypesByTier[tier] ?? ['solid', 'fess', 'pale'];

  // Weighted toward solid for lower tiers, more complex for higher
  const weights = availableTypes.map((type) => {
    if (type === 'solid')
      return tier === 'Minor' ? 40 : tier === 'Established' ? 30 : tier === 'Major' ? 20 : 15;
    return 10;
  });

  return rng.pickWeighted(availableTypes, weights);
}

/**
 * Select colors for the crest
 */
function selectColors(
  rng: IRNGService,
  philosophy: string,
  fieldType: FieldType,
  parentPrimaryColor?: string,
  parentSecondaryColor?: string,
  parentMetalColor?: MetalColor,
  generation: number = 0
): { primaryColor: string; secondaryColor?: string; metalColor: MetalColor } {
  const config = getInheritanceConfig(generation);

  // Determine primary color
  let primaryColor: string;
  if (parentPrimaryColor && rng.chance(config.primaryColorChance)) {
    primaryColor = parentPrimaryColor;
  } else {
    // Pick from philosophy preferences or fallback to random
    const preferredColors =
      PHILOSOPHY_COLOR_PREFERENCES[philosophy] || (Object.keys(CREST_COLORS) as CrestColorKey[]);
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
  // If a parent metal exists and the inheritance roll succeeds, preserve it.
  // Otherwise pick fresh, with a slight bias toward gold.
  let metalColor: MetalColor;
  if (parentMetalColor && rng.chance(config.metalColorChance)) {
    metalColor = parentMetalColor;
  } else {
    metalColor = rng.chance(0.6) ? 'gold' : 'silver';
  }

  return { primaryColor, secondaryColor, metalColor };
}

/**
 * Select charges for the crest
 */
function selectCharge(
  rng: IRNGService,
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
    const preferredTypes = PHILOSOPHY_CHARGE_PREFERENCES[philosophy] || [
      'beast',
      'symbol',
      'weapon',
    ];

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
    const postures: CrestCharge['posture'][] = [
      'rampant',
      'passant',
      'sejant',
      'statant',
      'forcene',
    ];
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
  const rng = new SeededRNGService(seed);

  // Determine generation
  const generation = parentCrest ? parentCrest.generation + 1 : 0;

  // Select shield shape
  const shieldShape = selectShieldShape(rng, tier, parentCrest?.shieldShape, generation);

  // Select field type
  const fieldType = selectFieldType(rng, tier, parentCrest?.fieldType, generation);

  // Select colors
  const { primaryColor, secondaryColor, metalColor } = selectColors(
    rng,
    philosophy,
    fieldType,
    parentCrest?.primaryColor,
    parentCrest?.secondaryColor,
    parentCrest?.metalColor,
    generation
  );

  // Select charge
  const charge = selectCharge(rng, philosophy, tier, parentCrest?.charge.type, generation);

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
