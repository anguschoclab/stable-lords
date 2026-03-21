/**
 * Combat Damage — hit location, protection, and damage calculations.
 * Single source of truth for damage mechanics used by simulate.ts.
 */

export type HitLocation = "head" | "chest" | "abdomen" | "right arm" | "left arm" | "right leg" | "left leg";

export const HIT_LOCATIONS = ["head", "chest", "abdomen", "right arm", "left arm", "right leg", "left leg"] as const;

// Target & Protect constants
const TARGET_HIT_CHANCE = 0.7;
const TARGET_MISS_CHANCE = 0.3;
const PROTECT_DAMAGE_REDUCTION = 0.5;
const PROTECT_DAMAGE_PENALTY = 1.15;

// Damage constants
const DAMAGE_BASE_MIN = 1;
const DAMAGE_HEAD_MULT = 1.5;
const DAMAGE_CHEST_MULT = 1.2;
const DAMAGE_ABDOMEN_MULT = 1.1;
const DAMAGE_LIMB_MULT = 0.8;
const DAMAGE_VARIANCE_MIN = 0.7;
const DAMAGE_VARIANCE_MAX = 1.3;

export function protectCovers(protect?: string): string[] {
  if (!protect || protect === "Any") return [];
  const p = protect.toLowerCase();
  if (p === "head") return ["head"];
  if (p === "body") return ["chest", "abdomen"];
  if (p === "arms") return ["right arm", "left arm"];
  if (p === "legs") return ["right leg", "left leg"];
  return [];
}

export function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  if (target && target !== "Any") {
    const t = target.toLowerCase() as HitLocation;
    if ((HIT_LOCATIONS as readonly string[]).includes(t)) {
      const covered = protectCovers(protect);
      const hitChance = covered.includes(t) ? TARGET_MISS_CHANCE : TARGET_HIT_CHANCE;
      if (rng() < hitChance) return t;
    }
  }
  return HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
}

export function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  if (!protect || protect === "Any") return damage;
  const covered = protectCovers(protect);
  if (covered.includes(location)) {
    return Math.max(1, Math.round(damage * PROTECT_DAMAGE_REDUCTION));
  } else {
    return Math.round(damage * PROTECT_DAMAGE_PENALTY);
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
  return Math.max(1, Math.round(base * locMult * variance));
}
