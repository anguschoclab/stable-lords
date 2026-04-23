import type { GameState, Season, TournamentEntry } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import { committeeSelection, buildTournament } from './committee';

export const TOURNAMENT_TIERS = [
  { id: 'Gold', name: 'Imperial Gold Cup', minRank: 1, maxRank: 64 },
  { id: 'Silver', name: 'Proconsul Silver Plate', minRank: 65, maxRank: 128 },
  { id: 'Bronze', name: 'Steel Bronze Gauntlet', minRank: 129, maxRank: 192 },
  { id: 'Iron', name: 'Foundry Iron Trials', minRank: 193, maxRank: 256 },
];

export function generateSeasonalTiers(
  state: GameState,
  week: number,
  season: Season,
  seed: number
): TournamentEntry[] {
  const rng = new SeededRNG(seed);
  const tournaments: TournamentEntry[] = [];
  const lockedWarriorIds = new Set<string>();

  TOURNAMENT_TIERS.forEach((tierConfig, idx) => {
    const { warriors, updatedLockedIds } = committeeSelection(
      state,
      tierConfig.id,
      seed + idx,
      lockedWarriorIds
    );

    // Update locked IDs for the next tier
    updatedLockedIds.forEach((id) => lockedWarriorIds.add(id));

    const tournament = buildTournament(tierConfig.id, tierConfig.name, warriors, week, season, rng);
    tournaments.push(tournament);
  });

  return tournaments;
}
