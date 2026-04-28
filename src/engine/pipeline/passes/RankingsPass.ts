import { GameState, RankingEntry } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { StateImpact } from '@/engine/impacts';
import { collectAllActiveWarriors } from '@/engine/core/warriorCollection';

/**
 * Stable Lords — Rankings Pass
 * Phase 1: Calculates the global and class-specific power rankings.
 * This cache is used by Promoters for matchmaking and Tournaments for seeding.
 */

interface WarriorScore {
  id: string;
  score: number;
  style: FightingStyle;
  classRank: number;
  overallRank: number;
}

// Pre-allocated arrays for style buckets to avoid repeated allocations
const STYLE_BUCKETS: FightingStyle[] = Object.values(FightingStyle);

export function runRankingsPass(state: GameState): StateImpact {
  // 1. Gather all active warriors from player and rivals using utility
  const allWarriors = collectAllActiveWarriors(state);

  // 2. Calculate Composite Scores in a single pass
  // Pre-size the array for better memory allocation
  const scores: WarriorScore[] = new Array(allWarriors.length);
  for (let i = 0; i < allWarriors.length; i++) {
    const warriorEntry = allWarriors[i];
    if (!warriorEntry) continue;
    const warrior = warriorEntry.warrior;
    const wins = warrior.career?.wins ?? 0;
    const losses = warrior.career?.losses ?? 0;
    const total = wins + losses;
    const winRate = total > 0 ? wins / total : 0;
    const kills = warrior.career?.kills ?? 0;
    const fame = warrior.fame ?? 0;

    // Formula: Fame + (Win% * 100) + (Kills * 50)
    scores[i] = {
      id: warrior.id,
      score: Math.floor(fame + winRate * 100 + kills * 50),
      style: warrior.style,
      classRank: 0, // Will be filled later
      overallRank: 0, // Will be filled later
    };
  }

  // 3. Sort globally by score (descending)
  // Use in-place sort to avoid creating a new array
  scores.sort((a, b) => b.score - a.score);

  // 4. Build style buckets and assign class ranks in a single pass
  // Use Maps for O(1) style lookup instead of filtering
  const styleRankCounters: Record<FightingStyle, number> = {} as Record<FightingStyle, number>;
  for (const style of STYLE_BUCKETS) {
    styleRankCounters[style] = 0;
  }

  // 5. Build RankingEntry Map with all ranks computed
  const realmRankings: Record<string, RankingEntry> = {};

  for (let i = 0; i < scores.length; i++) {
    const entry = scores[i];
    if (!entry) continue;
    entry.overallRank = i + 1;

    // Increment class rank counter for this style
    styleRankCounters[entry.style]++;
    entry.classRank = styleRankCounters[entry.style];

    realmRankings[entry.id] = {
      overallRank: entry.overallRank,
      classRank: entry.classRank,
      compositeScore: entry.score,
    };
  }

  return {
    realmRankings,
  };
}
