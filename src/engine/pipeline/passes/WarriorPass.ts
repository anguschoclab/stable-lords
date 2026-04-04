import { GameState } from "@/types/game";
import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState): GameState {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(state, trainingImpactRaw);
  
  const impacts: StateImpact[] = [
    trainingImpact, 
    computeAgingImpact(state), 
    computeHealthImpact(state),
  ];

  let nextState = resolveImpacts(state, impacts);
  nextState.seasonalGrowth = (nextState.seasonalGrowth || 0) + (seasonalGrowth || 0);
  
  return nextState;
}
