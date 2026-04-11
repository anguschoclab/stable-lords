import type { GameState, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

/**
 * BankruptcyService - Handles bankruptcy detection and processing.
 * Manages rival stable bankruptcy and removal.
 */
export class BankruptcyService {
  /**
   * Processes bankruptcy for all rival stables.
   * Removes stables that have gone bankrupt.
   */
  static processBankruptcy(state: GameState, rng: IRNGService): { updatedState: GameState; bankruptStables: string[] } {
    const BANKRUPTCY_THRESHOLD = -500;
    let updatedState = { ...state };
    const bankruptStables: string[] = [];

    updatedState.rivals = updatedState.rivals.filter(rival => {
      if (rival.treasury < BANKRUPTCY_THRESHOLD) {
        bankruptStables.push(rival.owner.stableName);
        return false;
      }
      return true;
    });

    return { updatedState, bankruptStables };
  }
}
