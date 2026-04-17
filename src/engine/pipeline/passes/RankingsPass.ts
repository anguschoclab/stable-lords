import { GameState, RankingEntry } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";
import { StateImpact } from "@/engine/impacts";
import { collectAllActiveWarriors } from "@/engine/core/warriorCollection";

/**
 * Stable Lords — Rankings Pass
 * Phase 1: Calculates the global and class-specific power rankings.
 * This cache is used by Promoters for matchmaking and Tournaments for seeding.
 */
export const PASS_METADATA = {
  name: "RankingsPass",
  dependencies: ["WorldPass"] // Depends on world transitions
};

/**
 * Stable Lords — Rankings Pass
 * Phase 1: Calculates the global and class-specific power rankings.
 * This cache is used by Promoters for matchmaking and Tournaments for seeding.
 */

export function runRankingsPass(state: GameState): StateImpact {
  // 1. Gather all active warriors from player and rivals using utility
  const allWarriors = collectAllActiveWarriors(state);

  // 2. Calculate Composite Scores
  const scores = allWarriors.map(entry => {
    const { warrior } = entry;
    const wins = warrior.career?.wins || 0;
    const losses = warrior.career?.losses || 0;
    const total = wins + losses;
    const winRate = total > 0 ? wins / total : 0;
    const kills = warrior.career?.kills || 0;
    const fame = warrior.fame || 0;

    // Formula: Fame + (Win% * 100) + (Kills * 50)
    const compositeScore = Math.floor(fame + (winRate * 100) + (kills * 50));
    return { id: warrior.id, score: compositeScore, style: warrior.style };
  });

  // 3. Sort Globally
  const globalSorted = [...scores].sort((a, b) => b.score - a.score);
  
  // 4. Sort by Class
  const styleSorted: Record<FightingStyle, string[]> = {} as Record<FightingStyle, string[]>;
  Object.values(FightingStyle).forEach(s => {
    styleSorted[s] = globalSorted
      .filter(entry => entry.style === s)
      .map(entry => entry.id);
  });

  // 5. Build RankingEntry Map
  const realmRankings: Record<string, RankingEntry> = {};
  
  globalSorted.forEach((entry, index) => {
    const classRank = styleSorted[entry.style].indexOf(entry.id) + 1;
    realmRankings[entry.id] = {
      overallRank: index + 1,
      classRank,
      compositeScore: entry.score
    };
  });

  return {
    realmRankings
  };
}
