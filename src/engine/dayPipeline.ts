import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { TickOrchestrator } from "@/engine/tick/TickOrchestrator";

/**
 * Stable Lords — Daily Progression Pipeline
 * Thin wrapper around the Unified Tick Orchestrator.
 */
export function advanceDay(state: GameState, rng?: IRNGService): GameState {
  // Use the unified orchestrator for consistent day/week/tournament logic
  return TickOrchestrator.advanceDay(state);
}
