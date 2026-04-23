import { GameState } from '@/types/state.types';

/**
 * Updates a promoter's history with a new payout and notable bout.
 * Maintains a history of the last 10 notable bouts.
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
