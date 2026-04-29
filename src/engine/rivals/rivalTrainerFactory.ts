/**
 * Rival Trainer Factory - Generates trainers for rival stables
 * Extracted from rivals.ts to follow SRP.
 *
 * **Intentional asymmetry (audited 2026-04-19)**: rivals spawn with trainers
 * instead of hiring from the market. Hiring costs and market inventory don't
 * apply by design. The *bonuses* those trainers confer still flow through the
 * shared math (`computeTrainerBonus` → `computeGainChance` in
 * `trainingGains.ts`) now that `rosterWorker::performAITraining` routes
 * through the player pipeline — so this fork only affects *sourcing*, not
 * *effect*. Don't paper it over with a hiring tax without also modelling the
 * trainer market as a resource rivals compete over.
 */
import type { Trainer, TrainerTier } from '@/types/shared.types';
import { TRAINER_FIRST_NAMES, PHILOSOPHY_TO_FOCUS } from './rivalNamePool';

/**
 * Generates trainers for a stable based on philosophy and tier.
 */
export function generateStableTrainers(
  rng: () => number,
  stableId: string,
  philosophy: string,
  count: number,
  tier: string
): Trainer[] {
  const trainers: Trainer[] = [];
  const focusPool = PHILOSOPHY_TO_FOCUS[philosophy] ?? ['Aggression', 'Defense', 'Mind'];

  for (let i = 0; i < count; i++) {
    const firstName = TRAINER_FIRST_NAMES[Math.floor(rng() * TRAINER_FIRST_NAMES.length)];
    const focusIdx = Math.floor(rng() * focusPool.length);
    const focus = focusPool[focusIdx];
    if (!focus) {
      throw new Error('Focus selection from focusPool failed');
    }
    const trainerTier: TrainerTier =
      tier === 'Legendary'
        ? rng() < 0.3
          ? 'Master'
          : 'Seasoned'
        : rng() < 0.1
          ? 'Master'
          : 'Novice';

    trainers.push({
      id: `trainer_${stableId}_${i}`,
      name: `${firstName}`,
      tier: trainerTier,
      focus,
      fame: trainerTier === 'Master' ? 5 : 1,
      age: 30 + Math.floor(rng() * 35),
      contractWeeksLeft: 52,
    });
  }

  return trainers;
}
