import type { GameState, Season, RivalStableData } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getRecentFights } from '@/engine/core/historyUtils';
import {
  PHILOSOPHY_DRIFT,
  PHILOSOPHY_EVOLVE_THRESHOLD_WIN,
  PHILOSOPHY_EVOLVE_THRESHOLD_LOSS,
  PHILOSOPHY_MIN_FIGHTS,
} from '@/data/ownerData';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

/**
 * Evolve stable philosophies based on season results.
 * Losing stables adapt; winning stables double down.
 * Runs on season change.
 */
export function evolvePhilosophies(
  state: GameState,
  newSeason: Season,
  rng?: IRNGService
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rngService = rng || new SeededRNGService(state.week * 131 + 42);
  if (newSeason === state.season) return { updatedRivals: state.rivals || [], gazetteItems: [] };

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);

  // 🚀 Performance Optimization (1.0): Pre-calculate stable performance map
  // Complexity reduction from O(Rivals * Fights) to O(Fights + Rivals)
  const performanceMap = new Map<string, { wins: number; total: number }>();
  for (const fight of recentFights) {
    const winnerId = fight.winner === 'A' ? fight.a : fight.d;
    const loserId = fight.winner === 'A' ? fight.d : fight.a;

    // We don't have stable IDs in FightSummary, so we use warrior names as keys.
    // This assumes names are unique within a season (which recruitment.ts enforces).
    [fight.a, fight.d].forEach((name) => {
      const current = performanceMap.get(name) || { wins: 0, total: 0 };
      if (name === winnerId) current.wins++;
      current.total++;
      performanceMap.set(name, current);
    });
  }

  const updatedRivals = (state.rivals || []).map((rival) => {
    const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';

    // Traditionalists NEVER change philosophy
    if (adaptation === 'Traditionalist') return rival;

    // Aggregate performance for the stable's roster
    let wins = 0;
    let totalFights = 0;
    rival.roster.forEach((w) => {
      const stats = performanceMap.get(w.name);
      if (stats) {
        wins += stats.wins;
        totalFights += stats.total;
      }
    });

    if (totalFights < PHILOSOPHY_MIN_FIGHTS) return rival;

    const winRate = wins / totalFights;
    const currentPhilosophy = rival.philosophy ?? 'Balanced';

    // Successful stables double down - no change
    if (winRate >= PHILOSOPHY_EVOLVE_THRESHOLD_WIN) return rival;

    // Failing stables drift to a new philosophy
    if (winRate < PHILOSOPHY_EVOLVE_THRESHOLD_LOSS) {
      const driftOptions = PHILOSOPHY_DRIFT[currentPhilosophy] ?? ['Balanced'];
      const nextPhilosophy = rngService.pick(driftOptions);

      if (nextPhilosophy !== currentPhilosophy) {
        gazetteItems.push(
          `💡 ${rival.owner.name} (${rival.owner.stableName}) shifts strategy from ${currentPhilosophy} to ${nextPhilosophy}.`
        );
        return { ...rival, philosophy: nextPhilosophy } as RivalStableData;
      }
    }

    return rival;
  });

  return { updatedRivals, gazetteItems };
}
