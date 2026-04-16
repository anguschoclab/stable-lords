/**
 * Crest Types - Procedural heraldic crest system for Stable Lords
 */

export type ShieldShape = 'heater' | 'french' | 'swiss' | 'spanish' | 'lozenge';

export type FieldType = 
  | 'solid' 
  | 'fess' 
  | 'pale' 
  | 'bend' 
  | 'chevron' 
  | 'cross' 
  | 'saltire' 
  | 'per-pale' 
  | 'per-fess' 
  | 'gyronny'
  | 'bend-sinister'
  | 'pale-environ'
  | 'chevron-inverted';

export type MetalColor = 'gold' | 'silver';

export type ChargeType = 'beast' | 'weapon' | 'symbol' | 'nature' | 'celestial' | 'mythical';

export type BeastPosture = 'rampant' | 'passant' | 'sejant' | 'couchant' | 'statant' | 'forcene';

export interface CrestCharge {
  type: ChargeType;
  name: string;
  posture?: BeastPosture;
  count: 1 | 2 | 3;
}

export interface CrestData {
  shieldShape: ShieldShape;
  fieldType: FieldType;
  primaryColor: string;
  secondaryColor?: string;
  metalColor: MetalColor;
  charge: CrestCharge;
  generation: number;
  parentCrest?: CrestData;
}

export interface StableCrestConfig {
  seed: number;
  philosophy: string;
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary';
  parentCrest?: CrestData;
}

export interface CrestInheritanceConfig {
  primaryColorChance: number;
  secondaryColorChance: number;
  shieldShapeChance: number;
  fieldTypeChance: number;
  chargeTypeChance: number;
  metalColorChance: number;
}

// Color palette - traditional heraldic colors adapted for UI
export const CREST_COLORS = {
  // Gules (reds)
  crimson: '#8B2323',
  brick: '#A52A2A',
  maroon: '#800000',
  
  // Azure (blues)
  royal: '#1E3A5F',
  navy: '#2C3E50',
  steel: '#4A5568',
  
  // Vert (greens)
  forest: '#228B22',
  hunter: '#355E3B',
  emerald: '#2E8B57',
  
  // Purpure (purples)
  royalPurple: '#4A0E4E',
  wine: '#722F37',
  
  // Sable (blacks/darks)
  sable: '#1A1A1A',
  charcoal: '#36454F',
  
  // Metals
  gold: '#D4AF37',
  silver: '#C0C0C0',
  
  // Or (yellows/golds)
  ochre: '#CC7722',
  amber: '#FFBF00',
  
  // Argent (whites/silvers)
  pearl: '#E8E8E8',
  platinum: '#E5E4E2',
  
  // Tenné (oranges/browns)
  rust: '#8B4513',
  bronze: '#CD7F32',
  
  // Additional accent colors
  blood: '#8A0303',
  midnight: '#191970',
  moss: '#4A5D23',
} as const;

export type CrestColorKey = keyof typeof CREST_COLORS;

// Charge definitions with display names
export const CHARGE_DEFINITIONS: Record<ChargeType, { names: string[]; descriptions: Record<string, string> }> = {
  beast: {
    names: ['lion', 'eagle', 'wolf', 'bear', 'boar', 'bull', 'stag', 'horse', 'falcon', 'serpent', 'fox', 'ram', 'griffin', 'dragon'],
    descriptions: {
      lion: 'Courage and nobility',
      eagle: 'Vision and supremacy',
      wolf: 'Pack loyalty and ferocity',
      bear: 'Raw strength and endurance',
      boar: 'Ferocity and combativeness',
      bull: 'Determination and power',
      stag: 'Speed and regeneration',
      horse: 'Swiftness and nobility',
      falcon: 'Precision and speed',
      serpent: 'Wisdom and cunning',
      fox: 'Cleverness and adaptability',
      ram: 'Forceful determination',
      griffin: 'Guardianship and valor',
      dragon: 'Power and ancient wisdom',
    },
  },
  weapon: {
    names: ['sword', 'dagger', 'axe', 'spear', 'hammer', 'mace', 'crossed-swords', 'shield', 'arrow', 'trident', 'halberd', 'flail', 'scourge'],
    descriptions: {
      sword: 'Honor and justice',
      dagger: 'Stealth and precision',
      axe: 'Execution and power',
      spear: 'Reach and focus',
      hammer: 'Craft and blunt force',
      mace: 'Crushing authority',
      'crossed-swords': 'Combat readiness',
      shield: 'Protection and defense',
      arrow: 'Speed and direction',
      trident: 'Command of the sea/power',
      halberd: 'Versatile warfare',
      flail: 'Unpredictable force',
      scourge: 'Punishment and suffering',
    },
  },
  symbol: {
    names: ['crown', 'key', 'hand', 'eye', 'skull', 'heart', 'star', 'sun', 'moon', 'cross', 'anchor', 'chain', 'ring', 'tower'],
    descriptions: {
      crown: 'Authority and victory',
      key: 'Knowledge and access',
      hand: 'Faith and loyalty',
      eye: 'Vigilance and insight',
      skull: 'Mortality and danger',
      heart: 'Passion and courage',
      star: 'Aspiration and guidance',
      sun: 'Glory and illumination',
      moon: 'Mystery and cycles',
      cross: 'Faith and sacrifice',
      anchor: 'Stability and hope',
      chain: 'Bondage or strength in unity',
      ring: 'Eternity and commitment',
      tower: 'Fortitude and watchfulness',
    },
  },
  nature: {
    names: ['oak', 'pine', 'rose', 'thistle', 'wheat', 'vine', 'mountain', 'wave', 'flame', 'fleur-de-lis', 'acorn', 'laurel', 'ivy', 'mushroom'],
    descriptions: {
      oak: 'Strength and endurance',
      pine: 'Resilience and longevity',
      rose: 'Beauty and secrecy',
      thistle: 'Defense and pain',
      wheat: 'Prosperity and nourishment',
      vine: 'Growth and binding',
      mountain: 'Grandeur and permanence',
      wave: 'Flow and power',
      flame: 'Passion and destruction',
      'fleur-de-lis': 'Purity and light',
      acorn: 'Potential and growth',
      laurel: 'Victory and honor',
      ivy: 'Endurance and connection',
      mushroom: 'Resilience and toxicity',
    },
  },
  celestial: {
    names: ['sun', 'moon', 'star', 'comet', 'lightning', 'cloud', 'rainbow', 'eclipse', 'planet', 'constellation'],
    descriptions: {
      sun: 'Radiance and supreme power',
      moon: 'Mystery and cycles',
      star: 'Destiny and aspiration',
      comet: 'Rare and cataclysmic events',
      lightning: 'Sudden power and speed',
      cloud: 'Obscurity and ephemerality',
      rainbow: 'Hope and covenant',
      eclipse: 'Darkness overcoming light',
      planet: 'Cosmic influence',
      constellation: 'Legend written in stars',
    },
  },
  mythical: {
    names: ['phoenix', 'kraken', 'unicorn', 'wyvern', 'hydra', 'chimera', 'basilisk', 'golem', 'titan', 'behemoth', 'leviathan', 'pegasus'],
    descriptions: {
      phoenix: 'Rebirth and immortality',
      kraken: 'Overwhelming oceanic power',
      unicorn: 'Purity and untamable grace',
      wyvern: 'Ferocious aerial dominance',
      hydra: 'Regeneration and multiplying threats',
      chimera: 'Composite terror',
      basilisk: 'Death and petrification',
      golem: 'Artificial endurance',
      titan: 'Primordial might',
      behemoth: 'Earth-shaking strength',
      leviathan: 'Abyssal supremacy',
      pegasus: 'Inspiration and aerial grace',
    },
  },
};

// Philosophy to charge type preferences
export const PHILOSOPHY_CHARGE_PREFERENCES: Record<string, ChargeType[]> = {
  'Brute Force': ['beast', 'weapon', 'mythical'],
  'Speed Kills': ['beast', 'celestial', 'weapon'],
  'Iron Defense': ['symbol', 'nature', 'beast'],
  'Cunning': ['beast', 'symbol', 'weapon'],
  'Spectacle': ['mythical', 'beast', 'celestial'],
  'Endurance': ['nature', 'beast', 'symbol'],
  'Balanced': ['symbol', 'nature', 'celestial'],
  'Specialist': ['weapon', 'symbol', 'mythical'],
};

// Shield shape weights by tier (higher = more likely)
export const SHIELD_SHAPE_WEIGHTS: Record<'Minor' | 'Established' | 'Major' | 'Legendary', Record<ShieldShape, number>> = {
  Minor: { heater: 50, french: 20, swiss: 15, spanish: 10, lozenge: 5 },
  Established: { heater: 40, french: 25, swiss: 15, spanish: 15, lozenge: 5 },
  Major: { heater: 35, french: 20, swiss: 25, spanish: 15, lozenge: 5 },
  Legendary: { heater: 30, french: 15, swiss: 20, spanish: 20, lozenge: 15 },
};

// Inheritance probability by generation (diminishing returns)
export const INHERITANCE_CHANCES: Record<number, CrestInheritanceConfig> = {
  0: {
    primaryColorChance: 1.0,
    secondaryColorChance: 1.0,
    shieldShapeChance: 1.0,
    fieldTypeChance: 1.0,
    chargeTypeChance: 1.0,
    metalColorChance: 1.0,
  },
  1: {
    primaryColorChance: 0.8,
    secondaryColorChance: 0.7,
    shieldShapeChance: 0.6,
    fieldTypeChance: 0.5,
    chargeTypeChance: 0.4,
    metalColorChance: 0.3,
  },
  2: {
    primaryColorChance: 0.6,
    secondaryColorChance: 0.5,
    shieldShapeChance: 0.4,
    fieldTypeChance: 0.3,
    chargeTypeChance: 0.25,
    metalColorChance: 0.2,
  },
  3: {
    primaryColorChance: 0.4,
    secondaryColorChance: 0.3,
    shieldShapeChance: 0.25,
    fieldTypeChance: 0.2,
    chargeTypeChance: 0.15,
    metalColorChance: 0.1,
  },
};

// Default for generations beyond defined
export const DEFAULT_INHERITANCE: CrestInheritanceConfig = {
  primaryColorChance: 0.2,
  secondaryColorChance: 0.15,
  shieldShapeChance: 0.15,
  fieldTypeChance: 0.1,
  chargeTypeChance: 0.1,
  metalColorChance: 0.05,
};
