/**
 * Memoized Zustand Selectors for GameState
 * Avoids duplicate .filter()/.reduce() across components.
 */
import type { GameState, Warrior, FightSummary } from "@/types/game";
import { isActive, isDead, isRetired, isFightReady } from "@/engine/warriorStatus";
import { StableStats } from "@/engine/stats/stableStats";

// ─── Roster Selectors ───────────────────────────────────────────────────

export const selectActiveWarriors = (state: GameState): Warrior[] =>
  state.roster.filter(w => isActive(w) && !w.isDead && w.status !== 'Dead');

export const selectDeadWarriors = (state: GameState): Warrior[] =>
  state.graveyard ?? state.roster.filter(w => isDead(w) || w.isDead || w.status === 'Dead');

export const selectRetiredWarriors = (state: GameState): Warrior[] =>
  state.retired ?? state.roster.filter(isRetired);

export const selectFightReadyWarriors = (state: GameState): Warrior[] =>
  state.roster.filter(w => isFightReady(w) && !w.isDead && w.status !== 'Dead');

// ─── Aggregate Stats ────────────────────────────────────────────────────

export const selectStableStats = (state: GameState): Pick<StableStats, 'totalWins' | 'totalLosses' | 'totalKills' | 'winRate'> => {
  let wins = 0;
  let losses = 0;
  let kills = 0;

  const tally = (w: Warrior) => {
    if (w.career) {
      wins += w.career.wins || 0;
      losses += w.career.losses || 0;
      kills += w.career.kills || 0;
    }
  };

  // ⚡ Bolt: Avoids creating a new array from spreading three arrays
  // and eliminates the O(N) object allocations per iteration.
  const { roster, graveyard, retired } = state;
  for (let i = 0; i < roster.length; i++) tally(roster[i]);
  if (graveyard) {
    for (let i = 0; i < graveyard.length; i++) tally(graveyard[i]);
  }
  if (retired) {
    for (let i = 0; i < retired.length; i++) tally(retired[i]);
  }
  
  const total = wins + losses;
  return {
    totalWins: wins,
    totalLosses: losses,
    totalKills: kills,
    winRate: total > 0 ? wins / total : 0,
  };
};

// ─── Fight History ──────────────────────────────────────────────────────

export const selectFightHistory = (state: GameState): FightSummary[] =>
  state.arenaHistory ?? [];

export const selectKillFights = (state: GameState): FightSummary[] =>
  selectFightHistory(state).filter(f => f.by === "Kill");
