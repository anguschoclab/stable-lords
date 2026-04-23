import type { Warrior } from '@/types/warrior.types';

/**
 * Update a warrior's state after a bout
 * Consolidates fame, popularity, career stats, flair updates, and fatigue
 */
export function updateWarriorAfterBout(
  warrior: Warrior,
  fameDelta: number,
  popularityDelta: number,
  isWinner: boolean,
  wasKilled: boolean,
  tags: string[],
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean
): Warrior {
  // Calculate fatigue: reset to 0 if killed, otherwise +25 (capped at 100)
  // 🔒 Skip fatigue accrual for tournament participants during tournament week
  const fatigue = wasKilled
    ? 0
    : skipFatigue
      ? warrior.fatigue || 0 // Keep current fatigue (no accrual)
      : Math.min(100, (warrior.fatigue || 0) + 25); // Normal +25 fatigue

  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + fameDelta),
    popularity: Math.max(0, (warrior.popularity || 0) + popularityDelta),
    career: {
      ...warrior.career,
      wins: (warrior.career.wins || 0) + (isWinner ? 1 : 0),
      losses: (warrior.career.losses || 0) + (!isWinner ? 1 : 0),
      kills: (warrior.career.kills || 0) + (wasKilled ? 1 : 0),
    },
    flair:
      isWinner && tags.includes('Flashy')
        ? Array.from(new Set([...(warrior.flair || []), 'Flashy']))
        : warrior.flair,
    fatigue,
  };
}

/**
 * Apply a fame delta to a warrior with bounds checking
 */
export function applyFameDelta(warrior: Warrior, delta: number): Warrior {
  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + delta),
  };
}

/**
 * Apply career stat updates based on bout result
 */
export function applyCareerStats(
  warrior: Warrior,
  result: { win: boolean; kill: boolean }
): Warrior {
  return {
    ...warrior,
    career: {
      ...warrior.career,
      wins: (warrior.career.wins || 0) + (result.win ? 1 : 0),
      losses: (warrior.career.losses || 0) + (!result.win ? 1 : 0),
      kills: (warrior.career.kills || 0) + (result.kill ? 1 : 0),
    },
  };
}
