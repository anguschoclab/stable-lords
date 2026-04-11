import type { GameState } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { StateImpact } from "@/engine/impacts";

/**
 * Stable Lords — Unified Tick Handler Interface
 * Provides a consistent interface for all tick-based systems (training, aging, health, etc.)
 * This enables easier addition of new tick systems and better consistency across the codebase.
 */
export interface TickHandler {
  /** Human-readable name for the tick system */
  name: string;

  /** Compute the impact of this tick on the game state */
  computeImpact(state: GameState, rng: SeededRNG): StateImpact;

  /** Determine if this tick should run for the current state (e.g., aging only on year boundary) */
  canTick(state: GameState): boolean;
}
