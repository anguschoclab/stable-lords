/**
 * Warrior Potential System
 *
 * Each warrior has per-attribute potential ceilings generated at creation.
 * Potential determines the max an attribute can reach through training/XP.
 * Higher quality tiers get higher potential ranges.
 * Potential is hidden by default and revealed through scouting/fights.
 *
 * See: Docs/Stable_Lords_Warrior_Potential_Spec_v1.0.md
 */
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, type Attributes } from '@/types/shared.types';
import type { AttributePotential } from '@/types/warrior.types';
import { clamp } from '@/utils/math';
import type { RecruitTier } from './recruitment';

// ─── Potential Range by Tier ──────────────────────────────────────────────
// [headroom_min, headroom_max] added ON TOP of the warrior's starting attribute.
// E.g., a Common warrior with ST=10 gets potential ST of 10 + rand(2..5) = 12-15.

const TIER_HEADROOM: Record<RecruitTier, [number, number]> = {
  Common: [1, 4],
  Promising: [3, 6],
  Exceptional: [5, 10],
  Prodigy: [10, 15],
};

// Absolute floor/ceiling for potential values
const POTENTIAL_MIN = 8;
const POTENTIAL_ABSOLUTE_MAX = ATTRIBUTE_MAX; // 25

/**
 * Generate per-attribute potential ceilings for a warrior.
 * Each attribute gets: current + random(headroom_min, headroom_max), clamped to [POTENTIAL_MIN, 25].
 */
export function generatePotential(
  attrs: Attributes,
  tier: RecruitTier,
  rng: () => number
): AttributePotential {
  const [hMin, hMax] = TIER_HEADROOM[tier];
  const potential = {} as AttributePotential;

  for (const key of ATTRIBUTE_KEYS) {
    const headroom = hMin + Math.floor(rng() * (hMax - hMin + 1));
    const raw = attrs[key] + headroom;
    potential[key] = clamp(raw, POTENTIAL_MIN, POTENTIAL_ABSOLUTE_MAX);
  }

  return potential;
}

/**
 * Check if an attribute can still grow (hasn't hit potential ceiling).
 */
export function canGrow(current: number, potential: number | undefined): boolean {
  if (potential === undefined) return current < ATTRIBUTE_MAX;
  return current < potential;
}

/**
 * Compute diminishing returns multiplier as attribute approaches potential.
 * Returns a value 0.0–1.0 that scales the training success chance.
 *
 * - Far from ceiling → 1.0 (full chance)
 * - Within 2 points → 0.5
 * - Within 1 point → 0.25
 * - At ceiling → 0.0
 */
export function diminishingReturnsFactor(current: number, potential: number | undefined): number {
  if (potential === undefined) return 1.0;
  const gap = potential - current;
  if (gap <= 0) return 0;
  if (gap === 1) return 0.25;
  if (gap === 2) return 0.5;
  return 1.0;
}

/**
 * Reveal one attribute's potential after a fight or scouting event.
 * Returns updated reveal map.
 */
export function revealPotential(
  revealed: Partial<Record<keyof Attributes, boolean>> | undefined,
  attr: keyof Attributes
): Partial<Record<keyof Attributes, boolean>> {
  return { ...(revealed ?? {}), [attr]: true };
}

/**
 * Calculate overall potential rating (0-100) for display purposes.
 * Represents what % of max growth the warrior can achieve.
 */
export function potentialRating(potential: AttributePotential): number {
  const maxPossible = ATTRIBUTE_KEYS.length * POTENTIAL_ABSOLUTE_MAX; // 175
  const total = ATTRIBUTE_KEYS.reduce((s, k) => s + potential[k], 0);
  return Math.round((total / maxPossible) * 100);
}

/** Human-readable potential grade */
export function potentialGrade(rating: number): string {
  if (rating >= 85) return 'S';
  if (rating >= 70) return 'A';
  if (rating >= 55) return 'B';
  if (rating >= 40) return 'C';
  return 'D';
}
