import type { 
  GameState, 
  Warrior, 
  TournamentEntry, 
  Season
} from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";

// Import extracted modules
import { committeeSelection, TOURNAMENT_TIERS } from "./tournament/tournamentSelectionCommittee";
import { buildTournament } from "./tournament/tournamentBracketBuilder";
import { resolveRound as resolveRoundModule, resolveCompleteTournament as resolveCompleteTournamentModule } from "./tournament/tournamentResolver";
import { awardTournamentPrizes as awardTournamentPrizesModule, awardRunnerUpPrizes } from "./tournament/tournamentPrizeDistributor";
import { findWarriorById as findWarriorByIdModule, modifyWarrior as modifyWarriorModule } from "./tournament/tournamentStateMutator";

// Re-export TOURNAMENT_TIERS for backward compatibility
export { TOURNAMENT_TIERS };

export const TournamentSelectionService = {
  
  /**
   * Generates all 4 seasonal tournaments using the committee selection logic.
   */
  generateSeasonalTiers(state: GameState, week: number, season: Season, seed: number): TournamentEntry[] {
    const rng = new SeededRNGService(seed);
    const tournaments: TournamentEntry[] = [];
    const lockedWarriorIds = new Set<string>();

    TOURNAMENT_TIERS.forEach((tierConfig, idx) => {
      const { warriors, updatedLockedIds } = committeeSelection(state, tierConfig.id, seed + idx, lockedWarriorIds, rng);
      
      // Update locked IDs for the next tier
      updatedLockedIds.forEach(id => lockedWarriorIds.add(id));

      const tournament = buildTournament({
        warriors,
        tierId: tierConfig.id,
        tierName: tierConfig.name,
        week,
        season,
        rng: rng
      });
      tournaments.push(tournament);
    });

    return tournaments;
  },

  /**
   * Resolves a single round of a tournament.
   * Delegates to extracted module.
   */
  resolveRound(state: GameState, tournamentId: string, seed: number): { updatedState: GameState; roundResults: string[] } {
    return resolveRoundModule(state, tournamentId, seed);
  },

  /**
   * Resolves an entire tournament deterministically.
   * Delegates to extracted module.
   */
  resolveCompleteTournament(state: GameState, tournamentId: string, seed: number): GameState {
    return resolveCompleteTournamentModule(state, tournamentId, seed);
  },

  /**
   * Distributes prizes for tournament results.
   * Delegates to extracted module.
   */
  awardTournamentPrizes(state: GameState, tournamentId: string, seed: number): { updatedState: GameState; prizeNews: string[] } {
    return awardTournamentPrizesModule(state, tournamentId, seed);
  },

  /**
   * Awards runner-up prizes.
   * Delegates to extracted module.
   */
  awardRunnerUpPrizes(state: GameState, tournamentId: string, seed: number): { updatedState: GameState; prizeNews: string[] } {
    return awardRunnerUpPrizes(state, tournamentId, seed);
  },

  /**
   * Finds a warrior by ID across rosters and tournaments.
   * Delegates to extracted module.
   */
  findWarriorById(state: GameState, warriorId: string, tournament?: TournamentEntry): Warrior | undefined {
    return findWarriorByIdModule(state, warriorId, tournament);
  },

  /**
   * Modifies a warrior by applying a transform function.
   * Delegates to extracted module.
   */
  modifyWarrior(state: GameState, warriorId: string, transform: (w: Warrior) => void): GameState {
    return modifyWarriorModule(state, warriorId, transform);
  }
};
