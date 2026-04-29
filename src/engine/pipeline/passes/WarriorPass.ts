import type { GameState } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { computeTrainingImpact, trainingImpactToStateImpact } from '@/engine/training';
import { computeAgingImpact } from '@/engine/aging';
import { computeHealthImpact } from '@/engine/health';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { convertRetiredToTrainer } from '@/engine/trainers';

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

  const agingImpact = computeAgingImpact(state, rng);

  // 🧬 Legacy System: Retired warriors with fame > 500 can become trainers
  const newTrainersInPool: Trainer[] = [];
  if (agingImpact.retired && agingImpact.retired.length > 0) {
    agingImpact.retired.forEach((w) => {
      if (w.fame > 500) {
        // 10% chance to become a trainer immediately available in the hiring pool
        if (rng.next() < 0.1) {
          newTrainersInPool.push(convertRetiredToTrainer(w));
        }
      }
    });
  }

  const impacts: StateImpact[] = [trainingImpact, agingImpact, computeHealthImpact(state)];

  if (newTrainersInPool.length > 0) {
    impacts.push({ hiringPool: [...(state.hiringPool || []), ...newTrainersInPool] });
  }

  if (Array.isArray(seasonalGrowth) && seasonalGrowth.length > 0) {
    impacts.push({ seasonalGrowth: [...seasonalGrowth] });
  }

  return mergeImpacts(impacts);
}
