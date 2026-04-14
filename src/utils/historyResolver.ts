import { GameState, Warrior } from "@/types/state.types";

interface NameResolutionState {
  player: { id: string; stableName: string; name: string };
  rivals: { id: string; owner: { stableName: string }; roster?: { id: string; name: string }[] }[];
  roster: { id: string; name: string }[];
  graveyard: { id: string; name: string }[];
  retired: { id: string; name: string }[];
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

  // Search active roster
  const w = state.roster.find(w => w.id === warriorId);
  if (w) return w.name;

  // Search graveyard
  const dead = state.graveyard.find(w => w.id === warriorId);
  if (dead) return dead.name;

  // Search retired
  const retired = state.retired.find((w: { id: string; name: string }) => w.id === warriorId);
  if (retired) return retired.name;

  // Search rival rosters
  for (const rival of state.rivals) {
    const rw = rival.roster?.find((w: { id: string; name: string }) => w.id === warriorId);
    if (rw) return rw.name;
  }

  return legacyName;
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

  // Check player stable
  if (state.player.id === stableId) return state.player.stableName;

  // Check rival stables
  const rival = state.rivals.find((r: { id: string; owner: { stableName: string }; roster?: { id: string; name: string }[] }) => r.id === stableId);
  if (rival) return rival.owner.stableName;

  return legacyName;
}

/**
 * Resolves a warrior object by ID or Name.
 */
export function findWarrior(
  state: GameState,
  id?: string,
  name?: string
): Warrior | undefined {
  if (id) {
    const w = state.roster.find(w => w.id === id) || 
              state.graveyard.find(w => w.id === id) ||
              state.retired.find(w => w.id === id);
    if (w) return w;

    for (const rival of state.rivals) {
      const rw = rival.roster.find(w => w.id === id);
      if (rw) return rw;
    }
  }

  if (name) {
    const w = state.roster.find(w => w.name === name) || 
              state.graveyard.find(w => w.name === name) ||
              state.retired.find(w => w.name === name);
    if (w) return w;

    for (const rival of state.rivals) {
      const rw = rival.roster.find(w => w.name === name);
      if (rw) return rw;
    }
  }

  return undefined;
}
