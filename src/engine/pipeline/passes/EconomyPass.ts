import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { computeEconomyImpact } from '@/engine/economy';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — Economy Pipeline Pass
 * Handles weekly income and expenses for the player's stable.
 */
export function runEconomyPass(state: GameState, _rng: IRNGService): StateImpact {
  return computeEconomyImpact(state);
}
