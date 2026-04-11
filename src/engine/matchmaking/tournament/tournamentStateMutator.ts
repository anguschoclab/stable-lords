import type { GameState, Warrior, TournamentEntry } from "@/types/state.types";

/**
 * Helper functions to modify/find warriors in state for tournament operations.
 */
export function modifyWarrior(state: GameState, warriorId: string, transform: (w: Warrior) => void): GameState {
  const updatedState = { ...state };
  let found = false;

  updatedState.roster = updatedState.roster.map(w => {
    if (w.id === warriorId) { found = true; const draft = { ...w }; transform(draft); return draft; }
    return w;
  });

  if (!found) {
    updatedState.rivals = updatedState.rivals.map(r => ({
      ...r,
      roster: r.roster.map(w => {
        if (w.id === warriorId) { const draft = { ...w }; transform(draft); return draft; }
        return w;
      })
    }));
  }

  return updatedState;
}

export function findWarriorById(state: GameState, warriorId: string, tournament?: TournamentEntry): Warrior | undefined {
  const playerW = state.roster.find(w => w.id === warriorId);
  if (playerW) return playerW;
  for (const r of state.rivals) {
    const rw = r.roster.find(w => w.id === warriorId);
    if (rw) return rw;
  }
  return tournament?.participants.find(w => w.id === warriorId);
}
