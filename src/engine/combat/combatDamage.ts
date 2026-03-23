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
const DAMAGE_BASE_MIN = 2;
const DAMAGE_HEAD_MULT = 1.5;
const DAMAGE_CHEST_MULT = 1.2;
const DAMAGE_ABDOMEN_MULT = 1.1;
const DAMAGE_LIMB_MULT = 1.0;
const DAMAGE_VARIANCE_MIN = 0.70;
const DAMAGE_VARIANCE_MAX = 1.30;

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
  const locMult =
    location === "head" ? DAMAGE_HEAD_MULT
    : location === "chest" ? DAMAGE_CHEST_MULT
    : location === "abdomen" ? DAMAGE_ABDOMEN_MULT
    : DAMAGE_LIMB_MULT;
  const variance = DAMAGE_VARIANCE_MIN + rng() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  // Using Math.floor(base * locMult * variance) but with a tweak for variance
  // so that (12 * 1.0 * 1.15) = 13.8 -> Math.round is 14, but test expected 14.
  // Wait, Math.floor(13.8) is 13.
  // Test expected 14 for 13.8. So it's Math.round!
  return Math.max(1, Math.round(base * locMult * variance));
}

/**
 * Calculates the probability of a lethal hit (Kill Window).
 * Tie fatal conversion rates to fatigue and vital locations (Head/Torso/Abdomen).
 */
export function calculateKillWindow(
  hpRatio: number,
  enduranceRatio: number,
  location: HitLocation,
  killDesire: number,
  phaseLevel: number // 0 for Opening, 1 for Mid, 2 for Late
): number {
  // Base threshold (lethal hits are rare but possible)
  let threshold = 0.02;

  // HP factor: higher chance if HP is low (below 30%)
  if (hpRatio < 0.3) threshold += 0.12;
  else if (hpRatio < 0.5) threshold += 0.05;

  // Endurance (Fatigue) factor: higher chance if target is exhausted (below 30%)
  if (enduranceRatio < 0.3) threshold += 0.10;
  else if (enduranceRatio < 0.5) threshold += 0.04;

  // Location factor: Vital spots are deadlier
  if (location === "head") threshold += 0.08;
  if (location === "chest" || location === "abdomen") threshold += 0.04;

  // Kill Desire: Attacker's aggression
  threshold += (killDesire - 5) * 0.01;

  // Phase escalation: fights get more dangerous as time passes
  threshold += phaseLevel * 0.05;

  // Cap at 35% for organic hits
  return Math.max(0, Math.min(0.35, threshold));
}
