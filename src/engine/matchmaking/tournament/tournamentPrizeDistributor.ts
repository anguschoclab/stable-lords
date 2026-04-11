import type { GameState, TournamentEntry, Warrior } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";

export interface PrizeDistributionResult {
  updatedState: GameState;
  prizeNews: string[];
}

/**
 * Distributes prizes for tournament results.
 */
export function awardTournamentPrizes(
  state: GameState, 
  tournamentId: string, 
  seed: number
): PrizeDistributionResult {
  const rng = new SeededRNG(seed);
  const tournament = (state.tournaments || []).find(t => t.id === tournamentId);
  if (!tournament || !tournament.completed) return { updatedState: state, prizeNews: [] };

  const champion = tournament.champion;
  const championWarrior = tournament.participants.find(w => w.name === champion);
  const championStableId = championWarrior?.stableId;
  
  let updatedState = { ...state };
  const prizeNews: string[] = [];

  // Prize Purses by Tier
  const prizeTable: Record<string, number> = {
    Gold: 5000,
    Silver: 3000,
    Bronze: 1500,
    Iron: 500
  };

  const prize = prizeTable[tournament.tierId] || 500;

  // Check if champion is player's warrior by comparing warrior's stableId with player's id
  const isPlayerChampion = championStableId === updatedState.player?.id;

  if (isPlayerChampion) {
    updatedState.treasury = (updatedState.treasury || 0) + prize;
    prizeNews.push(`💰 Your stable won ${prize}g as tournament champion!`);
  } else {
    updatedState.rivals = updatedState.rivals.map(r => 
      r.owner.id === championStableId 
        ? { ...r, treasury: (r.treasury || 0) + prize }
        : r
    );
    prizeNews.push(`💰 ${champion}'s stable won ${prize}g as tournament champion.`);
  }

  // Update tournament with prize info
  updatedState.tournaments = (updatedState.tournaments || []).map(t => 
    t.id === tournamentId 
      ? { ...t, prizeAwarded: true, prizeAmount: prize }
      : t
  );

  return { updatedState, prizeNews };
}

/**
 * Awards runner-up prizes (optional enhancement).
 */
export function awardRunnerUpPrizes(
  state: GameState,
  tournamentId: string,
  seed: number
): PrizeDistributionResult {
  const tournament = (state.tournaments || []).find(t => t.id === tournamentId);
  if (!tournament || !tournament.completed) return { updatedState: state, prizeNews: [] };

  const prizeTable: Record<string, number> = {
    Gold: 2500,
    Silver: 1500,
    Bronze: 750,
    Iron: 250
  };

  const prize = prizeTable[tournament.tierId] || 250;
  const runnerUp = tournament.bracket.find(b => b.round === 6 && b.matchIndex === 0 && b.winner === undefined);

  if (runnerUp) {
    const runnerUpWarrior = tournament.participants.find(w => w.name === (runnerUp.winner === "A" ? runnerUp.d : runnerUp.a));
    const runnerUpStableId = runnerUpWarrior?.stableId;
    
    let updatedState = { ...state };
    const prizeNews: string[] = [];

    if (runnerUpStableId === updatedState.player?.id) {
      updatedState.treasury = (updatedState.treasury || 0) + prize;
      prizeNews.push(`💰 Your stable won ${prize}g as tournament runner-up!`);
    } else {
      updatedState.rivals = updatedState.rivals.map(r => 
        r.owner.id === runnerUpStableId 
          ? { ...r, treasury: (r.treasury || 0) + prize }
          : r
      );
      prizeNews.push(`💰 ${runnerUpWarrior?.name}'s stable won ${prize}g as tournament runner-up.`);
    }

    return { updatedState, prizeNews };
  }

  return { updatedState: state, prizeNews: [] };
}
