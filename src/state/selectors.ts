import { GameState } from "@/types/state.types";

/**
 * Selectors for the GameStore to keep widgets clean and reactive.
 */

export const selectActiveWarriors = (state: GameState) => {
  return (state.roster || []).filter(w => w.status === "Active");
};

export const selectGraveyard = (state: GameState) => {
  return state.graveyard || [];
};

export const selectRecentEvents = (state: GameState) => {
  return (state.gazettes || []).slice(-10).reverse();
};
