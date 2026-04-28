import { GameState, Warrior } from '@/types/state.types';

interface NameResolutionState {
  player: { id: string; stableName: string; name: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rivals: { id: string; owner: { stableName: string }; roster?: { id: string; name: string }[] }[];
  roster: { id: string; name: string }[];
  graveyard: { id: string; name: string }[];
  retired: { id: string; name: string }[];
}

// Caching structure: WeakMap allows GC to clean up when GameState changes
const cache = new WeakMap<
  NameResolutionState | GameState,
  {
    warriorNames: Map<string, string>;
    stableNames: Map<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warriorsById: Map<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warriorsByName: Map<string, any>;
  }
>();

function buildCache(state: NameResolutionState | GameState) {
  const warriorNames = new Map<string, string>();
  const stableNames = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const warriorsById = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const warriorsByName = new Map<string, any>();

  // Process player and player's roster
  stableNames.set(state.player.id, state.player.stableName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processWarrior = (w: any) => {
    if (w.id && w.name) {
      warriorNames.set(w.id, w.name);
      warriorsById.set(w.id, w);
      warriorsByName.set(w.name, w);
    }
  };

  // Highest precedence items should overwrite lower precedence ones,
  // so we process in reverse order of precedence.

  // 1. Rivals (lowest precedence, rival 0 is highest among rivals)
  if (state.rivals) {
    for (let i = state.rivals.length - 1; i >= 0; i--) {
      const rival = state.rivals[i];
      if (rival.id && rival.owner?.stableName) {
        stableNames.set(rival.id, rival.owner.stableName);
      }
      if (rival.roster) {
        for (let j = rival.roster.length - 1; j >= 0; j--) {
          processWarrior(rival.roster[j]);
        }
      }
    }
  }

  // 2. Retired
  if (state.retired) {
    for (let i = state.retired.length - 1; i >= 0; i--) {
      processWarrior(state.retired[i]);
    }
  }

  // 3. Graveyard
  if (state.graveyard) {
    for (let i = state.graveyard.length - 1; i >= 0; i--) {
      processWarrior(state.graveyard[i]);
    }
  }

  // 4. Active Roster (highest precedence)
  if (state.roster) {
    for (let i = state.roster.length - 1; i >= 0; i--) {
      processWarrior(state.roster[i]);
    }
  }

  // Player stable (highest precedence)
  if (state.player && state.player.id && state.player.stableName) {
    stableNames.set(state.player.id, state.player.stableName);
  }

  const cacheEntry = { warriorNames, stableNames, warriorsById, warriorsByName };
  cache.set(state, cacheEntry);
  return cacheEntry;
}

function getCache(state: NameResolutionState | GameState) {
  let cacheEntry = cache.get(state);
  if (!cacheEntry) {
    cacheEntry = buildCache(state);
  }
  return cacheEntry;
}

/**
 * Resolves a warrior's current display name from their persistent ID.
 * Falls back to the provided legacy name if the ID lookup fails.
 */
export function resolveWarriorName(
  state: NameResolutionState,
  warriorId: string | undefined,
  legacyName: string
): string {
  if (!warriorId) return legacyName;
  const { warriorNames } = getCache(state);
  return warriorNames.get(warriorId) ?? legacyName;
}

/**
 * Resolves a stable's current display name from its persistent ID.
 * Falls back to the provided legacy name if the ID lookup fails.
 */
export function resolveStableName(
  state: NameResolutionState,
  stableId: string | undefined,
  legacyName: string
): string {
  if (!stableId) return legacyName;
  const { stableNames } = getCache(state);
  return stableNames.get(stableId) ?? legacyName;
}

/**
 * Resolves a warrior object by ID or Name.
 */
export function findWarrior(state: GameState, id?: string, name?: string): Warrior | undefined {
  if (!id && !name) return undefined;
  const { warriorsById, warriorsByName } = getCache(state);
  if (id && warriorsById.has(id)) return warriorsById.get(id);
  if (name && warriorsByName.has(name)) return warriorsByName.get(name);
  return undefined;
}
