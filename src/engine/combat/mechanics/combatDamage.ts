/**
 * Combat Damage — hit location, protection, and damage calculations.
 * Single source of truth for damage mechanics used by simulate.ts.
 */

export type HitLocation =
  | 'head'
  | 'chest'
  | 'abdomen'
  | 'right arm'
  | 'left arm'
  | 'right leg'
  | 'left leg';

export const HIT_LOCATIONS = [
  'head',
  'chest',
  'abdomen',
  'right arm',
  'left arm',
  'right leg',
  'left leg',
] as const;

// Target & Protect constants
// Target & Protect constants
const TARGET_HIT_CHANCE = 0.7;
const TARGET_MISS_CHANCE = 0.3;
const PROTECT_DAMAGE_REDUCTION = 0.75;
const PROTECT_DAMAGE_PENALTY = 1.1;

// Damage constants
const DAMAGE_BASE_MIN = 4;
const DAMAGE_VARIANCE_MIN = 0.7;
const DAMAGE_VARIANCE_MAX = 1.3;

const LOCATION_DAMAGE_MULT: Record<HitLocation, number> = {
  head: 1.5,
  chest: 1.2,
  abdomen: 1.1,
  'right arm': 1.0,
  'left arm': 1.0,
  'right leg': 1.0,
  'left leg': 1.0,
};

const LOCATION_KILL_MULT: Record<HitLocation, number> = {
  head: 6.0,
  chest: 3.5,
  abdomen: 3.5,
  'right arm': 0.1,
  'left arm': 0.1,
  'right leg': 0.1,
  'left leg': 0.1,
};

// ─── Weapon/Armor Type Interactions ─────────────────────────────────────────

type DamageType = 'slash' | 'bash' | 'pierce' | 'none';

const WEAPON_DAMAGE_TYPE: Record<string, DamageType> = {
  // Pierce
  dagger: 'pierce',
  epee: 'pierce',
  short_spear: 'pierce',
  long_spear: 'pierce',
  // Slash
  hatchet: 'slash',
  short_sword: 'slash',
  scimitar: 'slash',
  longsword: 'slash',
  battle_axe: 'slash',
  broadsword: 'slash',
  greatsword: 'slash',
  great_axe: 'slash',
  // Bash
  war_hammer: 'bash',
  mace: 'bash',
  morning_star: 'bash',
  war_flail: 'bash',
  maul: 'bash',
  halberd: 'bash',
  quarterstaff: 'bash',
  // Shields deal blunt but negligible — no interaction
  small_shield: 'none',
  medium_shield: 'none',
  large_shield: 'none',
};

// Multiplier on incoming damage: < 1.0 = armor resists, > 1.0 = armor is weak
const ARMOR_TYPE_MULT: Record<string, Partial<Record<DamageType, number>>> = {
  none_armor: {},
  leather: { slash: 0.95 },
  padded_leather: { bash: 0.8, pierce: 1.1 },
  ring_mail: { slash: 0.9, pierce: 0.9, bash: 1.1 },
  scale_mail: { slash: 0.8, pierce: 1.15 },
  chain_mail: { pierce: 0.8, slash: 1.1 },
  plate_mail: { slash: 0.85, bash: 0.85, pierce: 0.85 },
};

export function applyArmorTypeMod(damage: number, weaponId?: string, armorId?: string): number {
  if (!weaponId || !armorId) return damage;
  const dtype = WEAPON_DAMAGE_TYPE[weaponId];
  if (!dtype || dtype === 'none') return damage;
  const mult = ARMOR_TYPE_MULT[armorId]?.[dtype] ?? 1.0;
  return Math.round(damage * mult);
}

export function protectCovers(protect?: string): string[] {
  if (!protect || protect === 'Any' || protect === 'none_armor' || protect === 'none_helm')
    return [];
  const p = protect.toLowerCase();

  // Specific IDs or categories from tests and equipment data
  if (p.includes('helm') || p.includes('cap') || p === 'head') return ['head'];
  if (p.includes('armor') || p.includes('mail') || p === 'body') return ['chest', 'abdomen'];
  if (p === 'arms') return ['right arm', 'left arm'];
  if (p === 'legs') return ['right leg', 'left leg'];

  return [];
}

export function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  const covered = protectCovers(protect);

  if (target && target !== 'Any') {
    const t = target.toLowerCase() as HitLocation;
    if ((HIT_LOCATIONS as readonly string[]).includes(t)) {
      const hitChance = covered.includes(t) ? TARGET_MISS_CHANCE : TARGET_HIT_CHANCE;
      if (rng() < hitChance) return t;
    }
  }

  // If we missed target or didn't have one, prefer exposed locations
  if (rng() < 0.3) {
    const exposed = HIT_LOCATIONS.filter((l) => !covered.includes(l));
    if (exposed.length > 0) {
      return exposed[Math.floor(rng() * exposed.length)];
    }
  }

  // Fallback to completely random
  return HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
}

export function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  const covered = protectCovers(protect);
  if (covered.includes(location)) {
    return Math.floor(damage * PROTECT_DAMAGE_REDUCTION);
  } else {
    // Math.floor(damage * PROTECT_DAMAGE_PENALTY)
    // For negative damage, we want it to become more negative (e.g. -10 -> -11)
    return Math.floor(damage * PROTECT_DAMAGE_PENALTY);
  }
}

// ─── Shield zone mitigation ────────────────────────────────────────────────
// Shields cover specific location bands. Hits inside a shield's coverage take
// additional mitigation on top of armor. Kept small so the ~10% mortality
// baseline holds even when a Large Shield + High-zone hit stack.
const SHIELD_ZONE_LOCATIONS: Record<'LOW' | 'MEDIUM' | 'HIGH', HitLocation[]> = {
  LOW: ['right leg', 'left leg'],
  MEDIUM: ['chest', 'abdomen', 'right arm', 'left arm'],
  HIGH: ['head', 'chest', 'right arm', 'left arm'],
};
const SHIELD_ZONE_MITIGATION: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
  LOW: 0.92, // 8% reduction
  MEDIUM: 0.88, // 12% reduction
  HIGH: 0.85, // 15% reduction
};

export function applyShieldZoneMod(
  damage: number,
  location: HitLocation,
  coverage?: 'LOW' | 'MEDIUM' | 'HIGH'
): number {
  if (!coverage) return damage;
  const zones = SHIELD_ZONE_LOCATIONS[coverage];
  if (!zones.includes(location)) return damage;
  return Math.floor(damage * SHIELD_ZONE_MITIGATION[coverage]);
}

export function computeHitDamage(
  rng: () => number,
  damageClass: number,
  location: HitLocation
): number {
  const base = damageClass + DAMAGE_BASE_MIN;
  const locMult = LOCATION_DAMAGE_MULT[location] ?? 1.0;
  const variance = DAMAGE_VARIANCE_MIN + rng() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  // Using Math.max(1, Math.round(base * locMult * variance)) to preserve test expectations
  return Math.max(1, Math.round(base * locMult * variance));
}

/**
 * Calculates the probability of a lethal hit (Kill Window).
 * Tie fatal conversion rates to fatigue, vital locations, and strategic risk (OE/AL).
 */
export function calculateKillWindow(
  hpRatio: number,
  enduranceRatio: number,
  location: HitLocation,
  killDesire: number,
  phaseLevel: number, // 0 for Opening, 1 for Mid, 2 for Late
  attOE: number = 5,
  attAL: number = 5,
  matchupBonus: number = 0,
  decSkill: number = 10, // Canonical: DEC skill drives kill/decisiveness ability (1-20)
  momentum: number = 0, // Attacker momentum (-3 to +3). < 1 blocks kill attempts.
  specialtyBonus: number = 0, // Extra kill window from trainer specialties (e.g. KillerInstinct)
  crowdKillBonus: number = 0 // Crowd-mood modulation; kept small to preserve ~5% per-bout mortality baseline (Bloodthirsty +, Solemn -)
): number {
  // Momentum gate: must have neutral or positive momentum to attempt a kill
  // Softened from < 1 to < 0 to allow kills at neutral momentum (not just after consecutive hits)
  if (momentum < 0) return 0;

  // Base threshold (lethal hits are rare but possible).
  // Tuned 2026-04: prior 0.01 base + 0.08 cap produced ~14% per-bout kill rate
  // and ~0.4yr warrior lifespan, blocking retirements entirely (warriors died
  // before reaching age 30). Halving the per-hit kill chance brings per-bout
  // mortality toward the documented ~5% target and lets warriors live long
  // enough to age out, retire, and create generational turnover.
  // Re-tuned 2026-04 pass 2: 0.005 base + 2.5% cap produced ~3.6% per-bout kill
  // rate, below the 6% floor. Raising to 0.012 base + 4% cap targets ~6-10%.
  let threshold = 0.012;

  // HP factor: higher chance if HP is low (below 30%)
  if (hpRatio < 0.3) threshold += 0.004;
  else if (hpRatio < 0.5) threshold += 0.001;

  // Endurance (Fatigue) factor: exhaustion opens kill windows
  if (enduranceRatio < 0.2) threshold += 0.006;
  else if (enduranceRatio < 0.4) threshold += 0.003;
  else if (enduranceRatio < 0.6) threshold += 0.001;

  // Location factor: Vital spots are deadlier
  const locMult = LOCATION_KILL_MULT[location] ?? 1.0;
  threshold *= locMult;

  // Strategic Risk (AL/OE): Aggression fuels lethality
  threshold += (attOE + attAL - 10) * 0.00025;

  // Matchup Bias: Dominant styles find more fatal openings
  threshold += matchupBonus * 0.001;

  // Kill Desire: primary lever for intentional execution — scales aggressively
  threshold += (killDesire - 5) * 0.002;

  // DEC skill bonus
  threshold += (decSkill - 10) * 0.0003;

  // Phase escalation: fights get more dangerous as time passes
  threshold += phaseLevel * 0.0015;

  // Momentum bonus: momentum 2 = +0.004, momentum 3 = +0.0075
  if (momentum >= 3) threshold += 0.0075;
  else if (momentum >= 2) threshold += 0.004;

  // Trainer specialty bonus (e.g. KillerInstinct)
  threshold += specialtyBonus;

  // Crowd-mood modulation: small additive so the 4% cap preserves the ~5% mortality target.
  // Magnitudes intentionally tiny — the cap absorbs Bloodthirsty surges rather than blowing past baseline.
  threshold += crowdKillBonus;

  // Cap at 4% for the perfect storm. Was 8% → 4% → 2.5% → 4% (2026-04 pass 2).
  // 2.5% cap produced ~3.6% per-bout kill rate, below the 6% test floor.
  // Restoring 4% cap with higher base threshold targets ~6-10% per-bout kill rate.
  return Math.max(0, Math.min(0.04, threshold));
}
