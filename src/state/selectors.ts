/**
 * Memoized Zustand Selectors for GameState
 * Avoids duplicate .filter()/.reduce() across components.
 */
import type { GameState, Warrior, FightSummary } from "@/types/game";
import { isActive, isDead, isRetired, isFightReady } from "@/engine/warriorStatus";

// ─── Roster Selectors ───────────────────────────────────────────────────

export const selectActiveWarriors = (state: GameState): Warrior[] =>
  state.roster.filter(isActive);

export const selectDeadWarriors = (state: GameState): Warrior[] =>
  state.graveyard ?? state.roster.filter(isDead);

export const selectRetiredWarriors = (state: GameState): Warrior[] =>
  state.retired ?? state.roster.filter(isRetired);

export const selectFightReadyWarriors = (state: GameState): Warrior[] =>
  state.roster.filter(isFightReady);

// ─── Aggregate Stats ────────────────────────────────────────────────────

export interface StableStats {
  totalWins: number;
  totalLosses: number;
  totalKills: number;
  winRate: number;
}

export const selectStableStats = (state: GameState): StableStats => {
  const { wins, losses, kills } = state.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );
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
  state.arenaHistory?.fights ?? [];

export const selectKillFights = (state: GameState): FightSummary[] =>
  selectFightHistory(state).filter(f => f.by === "Kill");
