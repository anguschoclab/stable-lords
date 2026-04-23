/**
 * Warrior Collection Utilities
 * Eliminates DRY violation of "gather all active warriors" pattern across pipeline passes
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

export interface WarriorWithStable {
  warrior: Warrior;
  stableId: string;
  isPlayer: boolean;
}

/**
 * Collects all warriors from player roster and rival stables
 * Optionally filters by a predicate function
 */
export function collectAllWarriors(
  state: GameState,
  filter?: (w: Warrior) => boolean
): WarriorWithStable[] {
  const result: WarriorWithStable[] = [];
  const playerId = state.player?.id;

  // Add player roster warriors
  for (const warrior of state.roster || []) {
    if (!filter || filter(warrior)) {
      result.push({
        warrior,
        stableId: playerId,
        isPlayer: true,
      });
    }
  }

  // Add rival roster warriors
  for (const rival of state.rivals || []) {
    const stableId = rival.owner?.id;
    for (const warrior of rival.roster || []) {
      if (!filter || filter(warrior)) {
        result.push({
          warrior,
          stableId,
          isPlayer: false,
        });
      }
    }
  }

  return result;
}

/**
 * Collects only active warriors (status === "Active")
 * Most common use case - eliminates the repeated filtering pattern
 */
export function collectAllActiveWarriors(state: GameState): WarriorWithStable[] {
  return collectAllWarriors(state, (w) => w.status === 'Active');
}

/**
 * Collects all warriors available for matchmaking
 * (Active and not already booked for upcoming weeks)
 */
export function collectAvailableWarriors(
  state: GameState,
  targetWeek: number
): WarriorWithStable[] {
  // Get all warriors already signed for target week
  const bookedWarriorIds = new Set<string>();

  for (const offer of Object.values(state.boutOffers || {})) {
    if (offer.status === 'Signed' && offer.boutWeek === targetWeek) {
      for (const warriorId of offer.warriorIds || []) {
        bookedWarriorIds.add(warriorId);
      }
    }
  }

  // Return active warriors who aren't booked
  return collectAllWarriors(state, (w) => w.status === 'Active' && !bookedWarriorIds.has(w.id));
}

/**
 * Builds a Map for O(1) warrior lookups by ID
 * Includes stable information for each warrior
 */
export function buildWarriorMap(state: GameState): Map<string, WarriorWithStable> {
  const map = new Map<string, WarriorWithStable>();

  for (const item of collectAllWarriors(state)) {
    map.set(item.warrior.id, item);
  }

  return map;
}

/**
 * Finds a warrior anywhere in the game world (player or rival roster)
 * Returns undefined if not found
 */
export function findWarriorGlobally(
  state: GameState,
  warriorId: string
): WarriorWithStable | undefined {
  // Check player roster first
  const playerWarrior = state.roster?.find((w) => w.id === warriorId);
  if (playerWarrior) {
    return {
      warrior: playerWarrior,
      stableId: state.player?.id,
      isPlayer: true,
    };
  }

  // Check rival rosters
  for (const rival of state.rivals || []) {
    const warrior = rival.roster?.find((w) => w.id === warriorId);
    if (warrior) {
      return {
        warrior,
        stableId: rival.owner?.id,
        isPlayer: false,
      };
    }
  }

  return undefined;
}

/**
 * Gets the count of all active warriors in the world
 * Useful for meta calculations and capacity planning
 */
export function countActiveWarriors(state: GameState): {
  total: number;
  player: number;
  rivals: number;
} {
  const allActive = collectAllActiveWarriors(state);

  return {
    total: allActive.length,
    player: allActive.filter((w) => w.isPlayer).length,
    rivals: allActive.filter((w) => !w.isPlayer).length,
  };
}
