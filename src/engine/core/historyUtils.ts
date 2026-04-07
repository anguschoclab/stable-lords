import type { FightSummary } from "@/types/combat.types";
import type { GameState } from "@/types/state.types";

/**
 * Extracts fights from a specific week using an optimized backward loop.
 * Assumes arenaHistory is chronologically sorted by week.
 * O(K) time complexity where K is number of fights in that week, compared to O(N) for .filter()
 */
export function getFightsForWeek(arenaHistory: FightSummary[], week: number): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (f.week === week) {
      result.push(f);
    } else if (f.week < week) {
      break; // History is chronological, no earlier items will match
    }
  }
  return result.reverse();
}

/**
 * Extracts fights since a minimum week using an optimized backward loop.
 * Assumes arenaHistory is chronologically sorted by week.
 * O(K) time complexity where K is number of recent fights, compared to O(N) for .filter()
 */
export function getRecentFights(arenaHistory: FightSummary[], minWeek: number): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (f.week >= minWeek) {
      result.push(f);
    } else {
      break; // History is chronological, no earlier items will match
    }
  }
  return result.reverse();
}

/**
 * Extracts the most recent fights for a specific warrior.
 * Optimized with a backward loop to break early once the desired count is reached,
 * turning an O(N) full-array scan into an O(K) operation where K is the number of items needed.
 */
export function getRecentFightsForWarrior(arenaHistory: FightSummary[], warriorId: string, limit: number = 10): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (f.warriorIdA === warriorId || f.warriorIdD === warriorId) {
      result.push(f);
      if (result.length >= limit) {
        break;
      }
    }
  }
  return result.reverse();
}

/**
 * Extracts all fights for a specific warrior.
 * Useful when the full timeline or head-to-head records are needed,
 * but extracts via standard for-loop to avoid O(N) functional allocation overhead.
 */
export function getAllFightsForWarrior(arenaHistory: FightSummary[], warriorId: string): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = 0; i < arenaHistory.length; i++) {
    const f = arenaHistory[i];
    if (f.warriorIdA === warriorId || f.warriorIdD === warriorId) {
      result.push(f);
    }
  }
  return result;
}

/**
 * Extracts all fights for a specific tournament.
 * Uses a backward loop because tournaments typically happen in the recent past,
 * stopping if we reach a point where no tournament fights could exist (e.g. before the tournament week, if known).
 * To be safe without knowing the exact tournament week, we just do a standard backward scan.
 */
export function getFightsForTournament(arenaHistory: FightSummary[], tournamentId: string): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (f.tournamentId === tournamentId) {
      result.push(f);
    }
  }
  return result.reverse(); // Reverse to maintain chronological order
}
