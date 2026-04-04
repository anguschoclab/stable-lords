import { type GameState } from "@/types/game";
import { advanceWeek as runPipeline } from "@/engine/weekPipeline";
import { createFreshState, makeWarrior } from "@/engine/factories";

// 📦 Decoupled State Modules
export * from "./persistence";
export * from "./mutations/rosterMutations";
export * from "./mutations/worldMutations";

/**
 * Stable Lords — State Orchestration Hub
 * Delegates persistence and mutations to specialized modules.
 */

export { makeWarrior, createFreshState };

/**
 * Advance the game by one week using the consolidated engine pipeline.
 * Logic is fully encapsulated in the engine layer.
 */
export function advanceWeek(state: GameState): GameState {
  return runPipeline(state);
}
