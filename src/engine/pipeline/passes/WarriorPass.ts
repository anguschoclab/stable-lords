import type { GameState, Season } from "@/types/state.types";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import { SeededRNG } from "@/utils/random";

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState, rng: SeededRNG): GameState {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(state, trainingImpactRaw, rng);
  
  const impacts: StateImpact[] = [
    trainingImpact, 
    computeAgingImpact(state, rng), 
    computeHealthImpact(state),
  ];

  const nextState = resolveImpacts(state, impacts);
  
  // Correctly merge the seasonal growth arrays
  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    nextState.seasonalGrowth = [...(nextState.seasonalGrowth || []), ...seasonalGrowth];
  }
  
  return nextState;
}
