import type { GameState } from '@/types/state.types';
import { computeTrainingImpact, trainingImpactToStateImpact } from '@/engine/training';
import { computeAgingImpact } from '@/engine/aging';
import { computeHealthImpact } from '@/engine/health';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
/**
 * Stable Lords — Warrior Pipeline Pass
 * Handles weekly training, aging, and recovery using the established impact pattern.
 */
export function runWarriorPass(state: GameState, rng: IRNGService): StateImpact {
  const trainingImpactRaw = computeTrainingImpact(state, rng);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(
    state,
    trainingImpactRaw,
    rng
  );

  const impacts: StateImpact[] = [
    trainingImpact,
    computeAgingImpact(state, rng),
    computeHealthImpact(state),
  ];

  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    impacts.push({ seasonalGrowth: [...seasonalGrowth] });
  }

  return mergeImpacts(impacts);
}
