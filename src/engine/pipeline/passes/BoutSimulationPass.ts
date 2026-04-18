import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { processWeekBouts } from "@/engine/bout/services/boutProcessorService";
import { generateId } from "@/utils/idUtils";
import { StateImpact } from "@/engine/impacts";
import { planWeeklyMatches } from "@/engine/weeklyMatchmaking";
import { getFeatureFlags } from "@/engine/featureFlags";

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
export function runBoutSimulationPass(state: GameState, _rng: IRNGService): StateImpact {
  // Weekly-matchmaker orchestrator — gated behind a feature flag. When off
  // (default), planWeeklyMatches returns an empty plan with reason
  // `feature_flag_off` and processWeekBouts runs exactly as before. When
  // the flag flips on, the plan's reason codes flow into telemetry for
  // dashboards and future scheduler consumers; we still fall through to
  // processWeekBouts so bouts resolve through the canonical path.
  const flags = getFeatureFlags();
  if (flags.weeklyMatchmaker && _rng) {
    const plan = planWeeklyMatches(state, _rng);
    if (plan.reasons.length > 0 && typeof console !== "undefined" && console.debug) {
      console.debug("[weeklyMatchmaker]", { week: state.week, ...plan });
    }
  }

  // Although processWeekBouts uses its own deterministic seeds via hashStr,
  // we wrap it here to maintain pipeline consistency for the 1.0 release.
  const { impact: boutImpact, summary } = processWeekBouts(state);
  
  // Attach the summary to the state for use in later narrative or event passes if needed
  boutImpact.lastSimulationReport = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    id: _rng!.uuid(),
    week: state.week,
    treasuryChange: 0,
    trainingGains: [],
    agingEvents: [],
    healthEvents: [],
    ...state.lastSimulationReport,
    bouts: summary
  } as any;

  return boutImpact;
}
