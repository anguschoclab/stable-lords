import type { GameState } from "@/types/state.types";
import { processWeekBouts } from "@/engine/bout/services/boutProcessorService";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

/**
 * Stable Lords — Bout Simulation Pipeline Pass
 * Integrates the legacy bout processor into the standard modular pipeline.
 */
export function runBoutSimulationPass(state: GameState, _rng: SeededRNG): GameState {
  // Although processWeekBouts uses its own deterministic seeds via hashStr,
  // we wrap it here to maintain pipeline consistency for the 1.0 release.
  const { state: newState, summary } = processWeekBouts(state);
  
  // Attach the summary to the state for use in later narrative or event passes if needed
  newState.lastSimulationReport = {
    id: generateId(_rng, "report"),
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
