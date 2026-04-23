import type { RestState, MatchRecord } from '@/types/state.types';

/**
 * Adds a mandatory rest period for a warrior (e.g., after a KO).
 */
export function addRestState(
  restStates: RestState[],
  warriorId: string,
  outcome: string | null,
  week: number
): RestState[] {
  if (outcome === 'KO') {
    return [...restStates, { warriorId, restUntilWeek: week + 1 }];
  }
  return restStates;
}

/**
 * Removes rest states that have reached their expiration week.
 */
export function clearExpiredRest(restStates: RestState[], week: number): RestState[] {
  return restStates.filter((r) => r.restUntilWeek > week);
}

/**
 * Adds a match record to the player's history, pruning old entries.
 */
export function addMatchRecord(
  history: MatchRecord[],
  playerWarriorId: string,
  opponentWarriorId: string,
  opponentStableId: string,
  week: number
): MatchRecord[] {
  const pruned = history.filter((m) => m.week >= week - 8);
  return [...pruned, { week, playerWarriorId, opponentWarriorId, opponentStableId }];
}
