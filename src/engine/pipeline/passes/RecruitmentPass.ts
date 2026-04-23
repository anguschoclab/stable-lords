import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { StateImpact } from '@/engine/impacts';
import { partialRefreshPool, generateRecruit } from '@/engine/recruitment';

/**
 * Stable Lords — Recruitment Pipeline Pass
 * Handles the weekly refresh of the recruitment pool.
 */
export function runRecruitmentPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const rng = rootRng || new SeededRNGService(state.week * 701 + 13);

  // 1. Refresh recruitment pool
  const usedNames = new Set<string>(state.roster.map((w) => w.name));

  // Collect legacy candidates (fame > 1000)
  const legacyCandidates = [...(state.graveyard || []), ...(state.retired || [])].filter(
    (w) => w.fame > 1000
  );

  const recruitPool = partialRefreshPool(
    state.recruitPool || [],
    state.week,
    usedNames,
    rng,
    state.cachedMetaDrift,
    legacyCandidates
  );

  // 2. Post-death pool bonus: each arena death this week draws one extra aspirant
  // into the pool (fame of mortal combat attracts more blood). Bounded so a slaughter
  // week doesn't flood the pool.
  const deathsThisWeek = (state.graveyard ?? []).filter((w) => w.deathWeek === state.week).length;
  const bonusCount = Math.min(3, deathsThisWeek);
  if (bonusCount > 0) {
    const poolNames = new Set(recruitPool.map((w) => w.name));
    const allUsed = new Set<string>([...usedNames, ...poolNames]);
    for (let i = 0; i < bonusCount; i++) {
      recruitPool.push(
        generateRecruit(
          rng,
          allUsed,
          state.week,
          undefined,
          state.cachedMetaDrift,
          legacyCandidates
        )
      );
    }
  }

  return { recruitPool };
}
