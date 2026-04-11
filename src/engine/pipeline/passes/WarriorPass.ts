import type { GameState, Season } from "@/types/state.types";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { PatronTokenService } from "@/engine/tokens/patronTokenService";

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export const PASS_METADATA = {
  name: "WarriorPass",
  dependencies: ["BoutSimulationPass"] // Depends on bout simulation completing
};

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
import { resolveImpacts, StateImpact, mergeImpacts } from "@/engine/impacts";

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState, rng: IRNGService): StateImpact {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth, results } = trainingImpactToStateImpact(state, trainingImpactRaw, rng);

  const impacts: StateImpact[] = [
    trainingImpact,
    computeAgingImpact(state, rng),
    computeHealthImpact(state, rng),
  ];

  const mergedImpact = mergeImpacts(impacts);
  
  // Attach seasonal growth to the merged impact
  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    mergedImpact.seasonalGrowth = seasonalGrowth;
  }

  return mergedImpact;
}
