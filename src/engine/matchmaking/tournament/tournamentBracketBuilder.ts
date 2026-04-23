import type { Warrior, TournamentEntry, Season } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

export interface TournamentBracketConfig {
  tierId: string;
  tierName: string;
  warriors: Warrior[];
  week: number;
  season: Season;
  rng: IRNGService;
}

export interface BracketMatch {
  round: number;
  matchIndex: number;
  a: string;
  d: string;
  warriorIdA: string;
  warriorIdD: string;
  stableIdA?: string;
  stableIdD?: string;
  stableA?: string;
  stableD?: string;
}

/**
 * Builds a tournament bracket from selected warriors.
 * Creates a 64-warrior single-elimination bracket.
 */
export function buildTournament(config: TournamentBracketConfig): TournamentEntry {
  const { tierId, tierName, warriors, week, season, rng } = config;
  const rngService = rng;
  const id = `t-${tierId.toLowerCase()}-${season.toLowerCase()}-${week}`;
  const shuffled = rngService.shuffle([...warriors]);
  const bracket: BracketMatch[] = [];

  for (let i = 0; i < 64; i += 2) {
    bracket.push({
      round: 1,
      matchIndex: i / 2,
      a: shuffled[i].name,
      d: shuffled[i + 1].name,
      warriorIdA: shuffled[i].id,
      warriorIdD: shuffled[i + 1].id,
      stableIdA: shuffled[i].stableId,
      stableIdD: shuffled[i + 1].stableId,
      stableA: shuffled[i].stableId,
      stableD: shuffled[i + 1].stableId,
    });
  }

  return {
    id,
    season,
    week,
    tierId,
    name: tierName,
    bracket,
    participants: warriors,
    completed: false,
  };
}
