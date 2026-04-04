import { GameState } from "@/types/game";
import { computeEconomyImpact } from "@/engine/economy";
import { resolveImpacts } from "@/engine/impacts";

/**
 * Stable Lords — Economy Pipeline Pass
 * Uses the established impact-resolution pattern for financial simulation.
 */
export function runEconomyPass(state: GameState): GameState {
  const impact = computeEconomyImpact(state);
  return resolveImpacts(state, [impact]);
}
