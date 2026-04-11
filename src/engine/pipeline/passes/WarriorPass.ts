import type { GameState, Season } from "@/types/state.types";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";
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
export function runWarriorPass(state: GameState, rng: IRNGService): GameState {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth, results } = trainingImpactToStateImpact(state, trainingImpactRaw, rng);

  const impacts: StateImpact[] = [
    trainingImpact,
    computeAgingImpact(state, rng),
    computeHealthImpact(state, rng),
  ];

  let nextState = resolveImpacts(state, impacts);
  
  // 🌩️ New System Integration: Insight Token Awards
  // Low chance (5%) to earn an Insight Token during any successful training week
  if (results && results.some(r => r.type === "gain" || r.type === "recovery") && rng.next() < 0.05) {
    const tokenOptions = ["Style", "Weapon", "Rhythm"] as const;
    const type = tokenOptions[Math.floor(rng.next() * tokenOptions.length)];
    nextState = PatronTokenService.awardToken(nextState, type, "Exceptional Training", rng);
  }

  // Correctly merge the seasonal growth arrays
  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    nextState.seasonalGrowth = [...(nextState.seasonalGrowth || []), ...seasonalGrowth];
  }
  
  return nextState;
}
