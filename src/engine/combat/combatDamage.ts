/**
 * Combat Damage — hit location, protection, and damage calculations.
 * Single source of truth for damage mechanics used by simulate.ts.
 */

export type HitLocation = "head" | "chest" | "abdomen" | "right arm" | "left arm" | "right leg" | "left leg";

export const HIT_LOCATIONS = ["head", "chest", "abdomen", "right arm", "left arm", "right leg", "left leg"] as const;

// Target & Protect constants
// Target & Protect constants
const TARGET_HIT_CHANCE = 0.7;
const TARGET_MISS_CHANCE = 0.3;
const PROTECT_DAMAGE_REDUCTION = 0.75;
const PROTECT_DAMAGE_PENALTY = 1.1;

// Damage constants
const DAMAGE_BASE_MIN = 4;
const DAMAGE_VARIANCE_MIN = 0.70;
const DAMAGE_VARIANCE_MAX = 1.30;

const LOCATION_DAMAGE_MULT: Record<HitLocation, number> = {
  head: 1.5,
  chest: 1.2,
  abdomen: 1.1,
  "right arm": 1.0,
  "left arm": 1.0,
  "right leg": 1.0,
  "left leg": 1.0,
};

const LOCATION_KILL_MULT: Record<HitLocation, number> = {
  head: 6.0,
  chest: 3.5,
  abdomen: 3.5,
  "right arm": 0.1,
  "left arm": 0.1,
  "right leg": 0.1,
  "left leg": 0.1,
};

export function protectCovers(protect?: string): string[] {
  if (!protect || protect === "Any" || protect === "none_armor" || protect === "none_helm") return [];
  const p = protect.toLowerCase();
  
  // Specific IDs or categories from tests and equipment data
  if (p.includes("helm") || p.includes("cap") || p === "head") return ["head"];
  if (p.includes("armor") || p.includes("mail") || p === "body") return ["chest", "abdomen"];
  if (p === "arms") return ["right arm", "left arm"];
  if (p === "legs") return ["right leg", "left leg"];
  
  return [];
}

export function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  const covered = protectCovers(protect);

  if (target && target !== "Any") {
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

export function computeHitDamage(rng: () => number, damageClass: number, location: HitLocation): number {
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
  matchupBonus: number = 0
): number {
  // Base threshold (lethal hits are rare but possible)
  // Target: ~10% overall mortality across the league (Unified 1.0 Gold Baseline)
  let threshold = 0.065; 

  // HP factor: higher chance if HP is low (below 30%)
  if (hpRatio < 0.3) threshold += 0.012;
  else if (hpRatio < 0.5) threshold += 0.004;

  // Endurance (Fatigue) factor: higher chance if target is exhausted (below 30%)
  if (enduranceRatio < 0.3) threshold += 0.020; 
  else if (enduranceRatio < 0.5) threshold += 0.008;

  // Location factor: Vital spots are deadlier
  const locMult = LOCATION_KILL_MULT[location] ?? 1.0;
  threshold *= locMult;

  // Strategic Risk (AL/OE): Aggression fuels lethality
  // At OE 10/AL 10, bonus is +0.01. At OE 1/AL 1, penalty is -0.008.
  threshold += (attOE + attAL - 10) * 0.001;

  // Matchup Bias: Dominant styles find more fatal openings
  threshold += matchupBonus * 0.004;

  // Kill Desire: Attacker's aggression
  threshold += (killDesire - 5) * 0.001;

  // Phase escalation: fights get more dangerous as time passes
  threshold += phaseLevel * 0.004;

  // Cap at 15% for the perfect storm (Unified 1.0 Gold Baseline)
  return Math.max(0, Math.min(0.15, threshold));
}
