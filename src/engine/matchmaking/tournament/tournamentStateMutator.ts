import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { StateImpact } from '@/engine/impacts';

/**
 * Helper functions to modify/find warriors in state for tournament operations.
 */
export function modifyWarrior(
  state: GameState,
  warriorId: string,
  transform: (w: Warrior) => void
): StateImpact {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, any>();

  state.roster.forEach((w) => {
    if (w.id === warriorId) {
      const newW = { ...w };
      transform(newW);
      rosterUpdates.set(warriorId, newW);
    }
  });

  state.rivals.forEach((r) => {
    let modified = false;
    const updatedRoster = r.roster.map((w) => {
      if (w.id === warriorId) {
        modified = true;
        const newW = { ...w };
        transform(newW);
        return newW;
      }
      return w;
    });
    // Two prior bugs: (a) `updatedRoster !== r.roster` was always true since
    // `.map()` returns a new array, so we wrote a no-op rivalsUpdates entry
    // for every rival on every call; (b) the key was r.owner.id, but
    // rivalsUpdates handler indexes by r.id (StableId), so even when the
    // warrior WAS modified the update silently dropped on the floor.
    if (modified) {
      rivalsUpdates.set(r.id, { roster: updatedRoster });
    }
  });

  return {
    rosterUpdates,
    rivalsUpdates,
  };
}

export function findWarriorById(
  state: GameState,
  warriorId: string,
  tournament?: TournamentEntry
): Warrior | undefined {
  // Check tournament first if provided
  if (tournament) {
    const tournamentW = tournament.participants.find((w) => w.id === warriorId);
    if (tournamentW) return tournamentW;
  }
  const playerW = state.roster.find((w) => w.id === warriorId);
  if (playerW) return playerW;
  for (const r of state.rivals) {
    const rw = r.roster.find((w) => w.id === warriorId);
    if (rw) return rw;
  }
  return undefined;
}
