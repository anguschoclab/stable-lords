/**
 * Warrior Career Update Logic
 * Consolidates career stat updates to eliminate DRY violations across tournament resolvers
 */
import type { Warrior } from '@/types/warrior.types';
import type { WarriorStatus, CareerRecord } from '@/types/warrior.types';

export interface CareerUpdateInput {
  isWinner: boolean;
  isKill: boolean;
  isVictim: boolean;
  fameDelta?: number;
  popularityDelta?: number;
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean;
}

export interface CareerUpdateResult {
  status: WarriorStatus;
  fatigue: number;
  career: CareerRecord;
  fame: number;
  popularity?: number;
  flair?: string[];
}

/**
 * Calculates career updates without modifying the warrior
 * Pure function for testability and predictability
 */
export function calculateCareerUpdate(
  warrior: Warrior,
  input: CareerUpdateInput
): CareerUpdateResult {
  const {
    isWinner,
    isKill,
    isVictim,
    fameDelta = 0,
    popularityDelta = 0,
    skipFatigue = false,
  } = input;
  const didKill = isWinner && isKill;

  // Calculate new career stats
  const career: CareerRecord = {
    wins: (warrior.career?.wins || 0) + (isWinner ? 1 : 0),
    losses: (warrior.career?.losses || 0) + (isWinner ? 0 : 1),
    kills: (warrior.career?.kills || 0) + (didKill ? 1 : 0),
  };

  // Calculate fame gain: +1 for win, +3 for kill
  const fameGain = isWinner ? (didKill ? 3 : 1) : 0;
  const fame = Math.max(0, (warrior.fame || 0) + fameGain + fameDelta);

  // Calculate new status
  const status: WarriorStatus = isVictim ? 'Dead' : 'Active';

  // Calculate fatigue: reset to 0 if dead, otherwise +25 (capped at 100)
  // 🔒 Skip fatigue accrual for tournament participants during tournament week
  const fatigue = isVictim
    ? 0
    : skipFatigue
      ? warrior.fatigue || 0 // Keep current fatigue (no accrual)
      : Math.min(100, (warrior.fatigue || 0) + 25); // Normal +25 fatigue

  const result: CareerUpdateResult = {
    status,
    fatigue,
    career,
    fame,
  };

  // Only include optional fields if they have values
  if (popularityDelta !== 0) {
    result.popularity = Math.max(0, (warrior.popularity || 0) + popularityDelta);
  }

  return result;
}

/**
 * Applies a pre-calculated career update to a warrior
 * Returns a new warrior object (immutable update)
 */
export function applyCareerUpdate(warrior: Warrior, result: CareerUpdateResult): Warrior {
  const update: Partial<Warrior> = {
    status: result.status,
    fatigue: result.fatigue,
    career: result.career,
    fame: result.fame,
  };

  if (result.popularity !== undefined) {
    update.popularity = result.popularity;
  }

  if (result.flair !== undefined) {
    update.flair = result.flair;
  }

  return { ...warrior, ...update };
}

/**
 * Legacy-compatible function for bout record handling
 * Matches the signature of the original updateWarriorAfterBout
 */
export function updateWarriorAfterBout(
  warrior: Warrior,
  fameDelta: number,
  popularityDelta: number,
  isWinner: boolean,
  wasKilled: boolean,
  tags: string[]
): Warrior {
  const input: CareerUpdateInput = {
    isWinner,
    isKill: wasKilled,
    isVictim: wasKilled,
    fameDelta,
    popularityDelta,
  };

  const result = calculateCareerUpdate(warrior, input);

  // Add "Flashy" flair tag if applicable
  if (isWinner && tags.includes('Flashy')) {
    result.flair = Array.from(new Set([...(warrior.flair || []), 'Flashy']));
  }

  return applyCareerUpdate(warrior, result);
}

/**
 * Convenience function for tournament resolution
 * Combines calculation and application in one step
 */
export function updateWarriorFromBoutOutcome(
  warrior: Warrior,
  isAttacker: boolean,
  winnerSide: 'A' | 'D' | null,
  isKill: boolean,
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean
): Warrior {
  const isWinner = (isAttacker && winnerSide === 'A') || (!isAttacker && winnerSide === 'D');
  const isVictim = !isWinner && isKill;

  const input: CareerUpdateInput = {
    isWinner,
    isKill,
    isVictim,
    skipFatigue,
  };

  const result = calculateCareerUpdate(warrior, input);
  return applyCareerUpdate(warrior, result);
}
