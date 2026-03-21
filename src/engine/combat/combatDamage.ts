export type HitLocation = "head" | "chest" | "abdomen" | "right arm" | "left arm" | "right leg" | "left leg";

export const HIT_LOCATIONS = ["head", "chest", "abdomen", "right arm", "left arm", "right leg", "left leg"] as const;

export function protectCovers(protect?: string): string[] {
  if (!protect || protect === "none_armor") return [];
  switch (protect) {
    case "leather_armor":
    case "chainmail":
    case "platemail":
      return ["chest", "abdomen"];
    case "leather_cap":
    case "steel_cap":
    case "helm":
    case "full_helm":
      return ["head"];
    default:
      return [];
  }
}

export function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  const TARGET_HIT_CHANCE = 0.6;
  const TARGET_MISS_CHANCE = 0.4;
  if (target && target !== "any") {
    if (rng() < TARGET_HIT_CHANCE) {
      return target as HitLocation;
    }
  }
  const coveredLocations = protectCovers(protect);
  const exposedLocations = HIT_LOCATIONS.filter(loc => !coveredLocations.includes(loc));

  if (exposedLocations.length > 0 && rng() < 0.3) {
      return exposedLocations[Math.floor(rng() * exposedLocations.length)] as HitLocation;
  }

  return HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
}

export function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  const PROTECT_DAMAGE_REDUCTION = 0.75;
  const PROTECT_DAMAGE_PENALTY = 1.1;

  if (!protect) return Math.floor(damage * PROTECT_DAMAGE_PENALTY);
  const covers = protectCovers(protect);
  if (covers.includes(location)) {
    return Math.floor(damage * PROTECT_DAMAGE_REDUCTION);
  }
  return Math.floor(damage * PROTECT_DAMAGE_PENALTY);
}

export function computeHitDamage(rng: () => number, damageClass: number, location: HitLocation): number {
  const DAMAGE_BASE_MIN = 2;
  const DAMAGE_HEAD_MULT = 1.5;
  const DAMAGE_CHEST_MULT = 1.2;
  const DAMAGE_ABDOMEN_MULT = 1.1;
  const DAMAGE_LIMB_MULT = 1.0;
  const DAMAGE_VARIANCE_MIN = 0.85;
  const DAMAGE_VARIANCE_MAX = 1.15;
  const base = damageClass + DAMAGE_BASE_MIN;
  const locMult = location === "head" ? DAMAGE_HEAD_MULT
    : location === "chest" ? DAMAGE_CHEST_MULT
    : location === "abdomen" ? DAMAGE_ABDOMEN_MULT
    : DAMAGE_LIMB_MULT;
  const variance = DAMAGE_VARIANCE_MIN + rng() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  return Math.max(1, Math.round(base * locMult * variance));
}
