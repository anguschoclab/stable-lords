import { GameState, Promoter } from "@/types/state.types";

/**
 * Stable Lords — Promoter Mutations
 * Logic for promoter lifecycle and history updates.
 */

export function updatePromoterHistory(
  state: GameState,
  promoterId: string,
  purse: number,
  boutId: string
): GameState {
  const promoter = state.promoters[promoterId];
  if (!promoter) return state;

  return {
    ...state,
    promoters: {
      ...state.promoters,
      [promoterId]: {
        ...promoter,
        history: {
          ...promoter.history,
          totalPursePaid: promoter.history.totalPursePaid + purse,
          notableBouts: [...promoter.history.notableBouts.slice(-9), boutId], // Keep last 10
        },
      },
    },
  };
}

export function replacePromoter(
  state: GameState,
  oldId: string,
  newPromoter: Promoter
): GameState {
  const newPromoters = { ...state.promoters };
  delete newPromoters[oldId];
  newPromoters[newPromoter.id] = newPromoter;

  return {
    ...state,
    promoters: newPromoters,
  };
}
