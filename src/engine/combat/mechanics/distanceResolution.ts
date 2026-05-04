import type { DistanceRange, ArenaZone, ArenaConfig } from '@/types/shared.types';
import type { FighterState } from '../resolution/resolution';
import type { CombatEvent } from '@/types/combat.types';
import { contestCheck } from './combatMath';

// ─── Weapon → Preferred Range ─────────────────────────────────────────────────

// Weapon IDs MUST match those in `src/data/equipment.ts` (e.g. `broadsword`,
// `longsword`, `short_spear`). Prior versions used `broad_sword`/`long_sword`/
// `spear`/`flail` which silently miss the lookup → every warrior using their
// canonical equipment fell through to the Striking default and got 0 range mod.
const WEAPON_PREFERRED_RANGE: Record<string, DistanceRange> = {
  // ── Tight (close, fast weapons) ────────────────────────────────────────────
  dagger: 'Tight',
  short_sword: 'Tight',
  mace: 'Tight',
  hatchet: 'Tight',
  // ── Striking (medium, balanced — most weapons) ────────────────────────────
  broadsword: 'Striking',
  longsword: 'Striking',
  scimitar: 'Striking',
  battle_axe: 'Striking',
  morning_star: 'Striking',
  war_flail: 'Striking',
  epee: 'Striking',
  // ── Extended (long polearms, two-handers) ─────────────────────────────────
  halberd: 'Extended',
  greatsword: 'Extended',
  great_axe: 'Extended',
  short_spear: 'Extended',
  maul: 'Extended',
  quarterstaff: 'Extended',
};

export function getWeaponPreferredRange(weaponId?: string): DistanceRange {
  if (!weaponId) return 'Striking';
  return WEAPON_PREFERRED_RANGE[weaponId] ?? 'Striking';
}

// ─── Weapon Range Modifiers ───────────────────────────────────────────────────
//
// ATT bonus/penalty based on how well a weapon performs at a given range.
// Striking = 0 baseline for all weapons (most weapons are designed for this range).
// Values represent flat modifier to the attack roll target.
//
// Design intent: a dagger user at Grapple gets +4 ATT — they should close range.
//               A pike user at Grapple gets −10 ATT — they should flee to Extended.

// Weapon IDs MUST match those in `src/data/equipment.ts`. See note above on
// the prior id-mismatch bug that silently disabled this entire system.
const WEAPON_RANGE_MODIFIERS: Record<string, Partial<Record<DistanceRange, number>>> = {
  // ── Tight-preferred (close, fast) ────────────────────────────────────────
  dagger: { Grapple: +3, Tight: +4, Striking: 0, Extended: -5 },
  short_sword: { Grapple: +2, Tight: +4, Striking: 0, Extended: -4 },
  mace: { Grapple: -1, Tight: +3, Striking: 0, Extended: -2 },
  hatchet: { Grapple: 0, Tight: +3, Striking: 0, Extended: -3 },

  // ── Striking-preferred (medium swords / axes) ─────────────────────────────
  broadsword: { Grapple: -3, Tight: 0, Striking: 0, Extended: -1 },
  longsword: { Grapple: -4, Tight: -1, Striking: 0, Extended: +2 },
  scimitar: { Grapple: -2, Tight: -1, Striking: 0, Extended: -1 },
  battle_axe: { Grapple: -5, Tight: -2, Striking: 0, Extended: +1 },
  morning_star: { Grapple: -3, Tight: -1, Striking: 0, Extended: +1 },
  war_flail: { Grapple: -2, Tight: 0, Striking: 0, Extended: +2 },
  epee: { Grapple: -2, Tight: 0, Striking: +1, Extended: 0 },

  // ── Extended-preferred (polearms / two-handers) ──────────────────────────
  short_spear: { Grapple: -4, Tight: -2, Striking: 0, Extended: +3 },
  halberd: { Grapple: -7, Tight: -4, Striking: 0, Extended: +4 },
  greatsword: { Grapple: -6, Tight: -3, Striking: 0, Extended: +3 },
  great_axe: { Grapple: -6, Tight: -3, Striking: 0, Extended: +3 },
  maul: { Grapple: -6, Tight: -3, Striking: 0, Extended: +2 },
  quarterstaff: { Grapple: -2, Tight: -1, Striking: +1, Extended: +2 },
};

/**
 * Returns the ATT modifier for a weapon at a given range.
 * Positive = advantage (weapon is well-suited to this range).
 * Negative = disadvantage (fighter should fight to change range).
 */
export function getWeaponRangeMod(weaponId: string | undefined, range: DistanceRange): number {
  if (!weaponId) return 0;
  const mods = WEAPON_RANGE_MODIFIERS[weaponId];
  if (!mods) return 0;
  return mods[range] ?? 0;
}

// ─── Reach Score ──────────────────────────────────────────────────────────────

/**
 * reachScore = INI + (OE−5)×2 + motivationBonus − (recoveryDebt×2)
 */
export function computeReachScore(
  ini: number,
  OE: number,
  motivationBonus: number,
  recoveryDebt: number
): number {
  return ini + (OE - 5) * 2 + motivationBonus - recoveryDebt * 2;
}

// ─── Distance Contest ─────────────────────────────────────────────────────────

export interface DistanceContestResult {
  distanceWinner: 'A' | 'D' | null;
  rangeModA: number;
  rangeModD: number;
  newRange: DistanceRange;
  events: CombatEvent[];
}

/**
 * Contests range control for the current exchange.
 * Winner gains +1 initiative advantage (rangeModA/D = ±1).
 * More importantly, both fighters immediately feel the effect of the current
 * range via getWeaponRangeMod() applied to their attack checks.
 * Range shifts one step toward the winner's preferred weapon range.
 */
export function contestDistance(
  rng: () => number,
  fA: FighterState,
  fD: FighterState,
  OE_A: number,
  OE_D: number,
  currentRange: DistanceRange
): DistanceContestResult {
  const events: CombatEvent[] = [];

  const prefA = fA.activePlan.rangePreference ?? getWeaponPreferredRange(fA.weaponId);
  const prefD = fD.activePlan.rangePreference ?? getWeaponPreferredRange(fD.weaponId);

  // Motivation bonus: +2 when fighting to shift toward your preferred range
  const motA = prefA !== currentRange ? 2 : 0;
  const motD = prefD !== currentRange ? 2 : 0;

  const reachA = computeReachScore(fA.skills.INI, OE_A, motA, fA.recoveryDebt);
  const reachD = computeReachScore(fD.skills.INI, OE_D, motD, fD.recoveryDebt);

  const aWins = contestCheck(rng, reachA, reachD);
  const winner: 'A' | 'D' = aWins ? 'A' : 'D';
  const winnerPref = aWins ? prefA : prefD;

  // Shift range one step toward winner's preferred range
  const newRange = shiftRangeToward(currentRange, winnerPref);

  if (newRange !== currentRange) {
    events.push({ type: 'RANGE_SHIFT', actor: winner, result: newRange });
  }

  return {
    distanceWinner: winner,
    rangeModA: aWins ? 1 : -1,
    rangeModD: aWins ? -1 : 1,
    newRange,
    events,
  };
}

// ─── Range Shift Helper ───────────────────────────────────────────────────────

const RANGE_ORDER: DistanceRange[] = ['Grapple', 'Tight', 'Striking', 'Extended'];

function shiftRangeToward(current: DistanceRange, target: DistanceRange): DistanceRange {
  const ci = RANGE_ORDER.indexOf(current);
  const ti = RANGE_ORDER.indexOf(target);
  if (ci === ti) return current;
  return RANGE_ORDER[ci + (ti > ci ? 1 : -1)];
}

// ─── Zone Penalties ───────────────────────────────────────────────────────────

/**
 * Returns the DEF modifier for a fighter in the given zone.
 * Negative values = penalty. Center is always 0.
 */
export function getZonePenalty(zone: ArenaZone, arenaConfig: Pick<ArenaConfig, 'zoneDef'>): number {
  if (zone === 'Center') return 0;
  return arenaConfig.zoneDef[zone] ?? 0;
}

// ─── Zone Transitions ─────────────────────────────────────────────────────────

/** Returns the next zone when a fighter is pushed back. */
export function transitionZone(current: ArenaZone): ArenaZone {
  switch (current) {
    case 'Center':
      return 'Edge';
    case 'Edge':
      return 'Corner';
    case 'Corner':
      return 'Corner';
    case 'Obstacle':
      return 'Obstacle';
  }
}

/** Resets zone toward Center (called when pushed fighter lands a hit). */
export function resetZone(current: ArenaZone): ArenaZone {
  switch (current) {
    case 'Corner':
      return 'Edge';
    case 'Edge':
      return 'Center';
    default:
      return current;
  }
}
