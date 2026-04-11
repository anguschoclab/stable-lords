import { GameState, Warrior, RankingEntry } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";

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

export function runRankingsPass(state: GameState): GameState {
  // 1. Gather all active warriors from player and rivals
  const allWarriors: { w: Warrior; stableId: string }[] = [];
  
  state.roster.forEach(w => {
    if (w.status === "Active") allWarriors.push({ w, stableId: state.player.id });
  });

  (state.rivals || []).forEach(r => {
    r.roster.forEach(w => {
      if (w.status === "Active") allWarriors.push({ w, stableId: r.owner.id });
    });
  });

  // 2. Calculate Composite Scores
  const scores = allWarriors.map(entry => {
    const { w } = entry;
    const wins = w.career?.wins || 0;
    const losses = w.career?.losses || 0;
    const total = wins + losses;
    const winRate = total > 0 ? wins / total : 0;
    const kills = w.career?.kills || 0;
    const fame = w.fame || 0;

    // Formula: Fame + (Win% * 100) + (Kills * 50)
    const compositeScore = Math.floor(fame + (winRate * 100) + (kills * 50));
    return { id: w.id, score: compositeScore, style: w.style };
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
    ...state,
    realmRankings
  };
}
