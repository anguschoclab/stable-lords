import type { GameState } from "@/types/state.types";
import { computeEconomyImpact } from "@/engine/economy";
import { resolveImpacts } from "@/engine/impacts";
import { SeededRNG } from "@/utils/random";

/**
 * Stable Lords — Economy Pipeline Pass
 * Handles weekly income and expenses for the player's stable.
 */
export const PASS_METADATA = {
  name: "EconomyPass",
  dependencies: ["WarriorPass"] // Depends on warrior updates for income calculation
};

/**
 * Stable Lords — Economy Pipeline Pass
 * Uses the established impact-resolution pattern for financial simulation.
 */
export function runEconomyPass(state: GameState, _rng: SeededRNG): GameState {
  const impact = computeEconomyImpact(state);
  return resolveImpacts(state, [impact]);
}
