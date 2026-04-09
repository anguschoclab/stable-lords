import type { GameState, Season } from "@/types/state.types";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import { SeededRNG } from "@/utils/random";
import { InsightTokenService } from "@/engine/tokens/insightTokenService";

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState, rng: SeededRNG): GameState {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth, results } = trainingImpactToStateImpact(state, trainingImpactRaw, rng);
  
  const impacts: StateImpact[] = [
    trainingImpact, 
    computeAgingImpact(state, rng), 
    computeHealthImpact(state),
  ];

  let nextState = resolveImpacts(state, impacts);
  
  // 🌩️ New System Integration: Insight Token Awards
  // Low chance (5%) to earn an Insight Token during any successful training week
  if (results.some(r => r.type === "success") && rng.roll(0, 100) < 5) {
    const tokenOptions = ["Style", "Weapon", "Rhythm"] as const;
    const type = tokenOptions[rng.roll(0, tokenOptions.length - 1)];
    nextState = InsightTokenService.awardToken(nextState, type, "Exceptional Training", rng);
  }

  // Correctly merge the seasonal growth arrays
  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    nextState.seasonalGrowth = [...(nextState.seasonalGrowth || []), ...seasonalGrowth];
  }
  
  return nextState;
}
