import type { GameState, Trainer } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { StateImpact } from '@/engine/impacts';
import { computeTrainerAging } from '@/engine/trainerAging';

/**
 * Stable Lords — Trainer Pipeline Pass
 * Handles aging, retirement, and pool management for trainers.
 */
export function runTrainerPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const rng = rootRng || new SeededRNGService(state.week * 1337 + 7);
  const { updatedTrainers, news, updatedHiringPool } = computeTrainerAging(state, rng);

  const impact: StateImpact = {
    trainers: updatedTrainers,
    hiringPool: updatedHiringPool,
  };

  if (news.length > 0) {
    impact.newsletterItems = [
      {
        id: rng.uuid(),
        week: state.week,
        title: 'Trainer Career Updates',
        items: news,
      },
    ];
  }

  return impact;
}
