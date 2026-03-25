import { type GameState, type FightSummary } from "@/types/game";

/**
 * Prunes historical data to keep the save file size manageable.
 * - Keeps last 500 arena history entries.
 * - Removes transcripts from older fights (only keeps last 20).
 * - Bounds various history arrays.
 */
export function truncateState(state: GameState): GameState {
  const arenaHistory = state.arenaHistory.slice(-500).map((f, i, arr) => {
    // Keep transcripts only for the last 20 fights to save memory
    if (arr.length - i > 20 && f.transcript) {
      const { transcript, ...rest } = f;
      return rest as FightSummary;
    }
    return f;
  });

  return {
    ...state,
    arenaHistory,
    newsletter: (state.newsletter || []).slice(-100),
    ledger: (state.ledger || []).slice(-500),
    matchHistory: (state.matchHistory || []).slice(-500),
    moodHistory: (state.moodHistory || []).slice(-50),
    graveyard: state.graveyard.slice(-200),
    retired: state.retired.slice(-200),
    tournaments: (state.tournaments || []).slice(-100),
    scoutReports: (state.scoutReports || []).slice(-100),
    hallOfFame: (state.hallOfFame || []).slice(-100),
    rivalries: (state.rivalries || []).slice(-100),
    ownerGrudges: (state.ownerGrudges || []).slice(-100),
    seasonalGrowth: (state.seasonalGrowth || []).slice(-500),
    insightTokens: (state.insightTokens || []).slice(-500),
    playerChallenges: (state.playerChallenges || []).slice(-100),
    playerAvoids: (state.playerAvoids || []).slice(-100),
    trainingAssignments: (state.trainingAssignments || []).slice(-200),
    gazettes: (state.gazettes || []).slice(-50),
    coachDismissed: (state.coachDismissed || []).slice(-100),
    restStates: (state.restStates || []).slice(-500),
    hiringPool: (state.hiringPool || []).slice(-20),
    recruitPool: (state.recruitPool || []).slice(-50),
  };
}
