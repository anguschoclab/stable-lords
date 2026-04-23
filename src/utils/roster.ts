/**
 * Roster Utility Functions
 * Provides common operations for managing warrior rosters
 * Eliminates DRY violations of roster filtering/mapping patterns
 */
import type { GameState, Warrior } from '@/types/state.types';

/**
 * Builds a Map<string, Warrior> from the game state
 * Includes both player roster and all rival rosters
 * Eliminates DRY violation of warrior map building pattern
 */
export function buildWarriorMap(state: GameState): Map<string, Warrior> {
  const map = new Map<string, Warrior>();
  state.roster.forEach((w) => map.set(w.id, w));
  (state.rivals || []).forEach((r) => r.roster.forEach((w) => map.set(w.id, w)));
  return map;
}

/**
 * Updates a roster with partial updates from a Map
 * Returns a new roster array with updated warriors
 * Eliminates DRY violation of roster update patterns
 */
export function updateRoster(roster: Warrior[], updates: Map<string, Partial<Warrior>>): Warrior[] {
  return roster.map((w) => {
    const update = updates.get(w.id);
    return update ? { ...w, ...update } : w;
  });
}

/**
 * Removes warriors with given IDs from a roster
 * Returns a new roster array without the specified warriors
 */
export function removeFromRoster(roster: Warrior[], ids: string[]): Warrior[] {
  const idSet = new Set(ids);
  return roster.filter((w) => !idSet.has(w.id));
}

/**
 * Filters roster to only active warriors
 */
export function filterActive(roster: Warrior[]): Warrior[] {
  return roster.filter((w) => w.status === 'Active');
}

/**
 * Filters roster by specific status
 */
export function filterByStatus(roster: Warrior[], status: string): Warrior[] {
  return roster.filter((w) => w.status === status);
}
