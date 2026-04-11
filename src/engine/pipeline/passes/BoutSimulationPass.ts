import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng";
import { processWeekBouts } from "@/engine/bout/services/boutProcessorService";
import { generateId } from "@/utils/idUtils";

/**
 * Stable Lords — Bout Simulation Pass
 * Phase 0: Simulates all scheduled bouts for the week.
 */
export const PASS_METADATA = {
  name: "BoutSimulationPass",
  dependencies: [] // No dependencies - runs first
};

/**
 * Stable Lords — Bout Simulation Pipeline Pass
 * Integrates the legacy bout processor into the standard modular pipeline.
 */
export function runBoutSimulationPass(state: GameState, _rng: IRNGService): GameState {
  // Although processWeekBouts uses its own deterministic seeds via hashStr,
  // we wrap it here to maintain pipeline consistency for the 1.0 release.
  const { state: newState, summary } = processWeekBouts(state);
  
  // Attach the summary to the state for use in later narrative or event passes if needed
  newState.lastSimulationReport = {
    id: _rng!.uuid(),
    week: newState.week,
    treasuryChange: 0,
    trainingGains: [],
    agingEvents: [],
    healthEvents: [],
    ...newState.lastSimulationReport,
    bouts: summary
  } as any;

  return newState;
}
