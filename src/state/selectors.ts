import { GameState } from '@/types/state.types';

/**
 * Selectors for the GameStore to keep widgets clean and reactive.
 */

export const selectActiveWarriors = (state: GameState) => {
  return (state.roster || []).filter((w) => w.status === 'Active');
};
