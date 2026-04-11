import type { GameState, Season, RivalStableData } from "@/types/state.types";
import type { FightSummary } from "@/types/combat.types";
import type { IRNGService } from "@/engine/core/rng";
import { getRecentFights } from "@/engine/core/historyUtils";
import { PHILOSOPHY_DRIFT } from "@/data/ownerData";
import { SeededRNGService } from "@/engine/core/rng";

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

  const updatedRivals = (state.rivals || []).map(rival => {
    const adaptation = rival.owner.metaAdaptation ?? "Opportunist";

    // Traditionalists NEVER change philosophy
    if (adaptation === "Traditionalist") return rival;

    const names = new Set(rival.roster.map(w => w.name));
    const { wins, losses } = calculateRecentPerformance(recentFights, names);

    const totalFights = wins + losses;
    if (totalFights < 4) return rival;

    const winRate = wins / totalFights;
    const currentPhilosophy = rival.philosophy ?? "Balanced";

    // Successful stables (winRate >= 70%) double down - no change
    if (winRate >= 0.7) return rival;

    // Failing stables (winRate < 40%) drift to a new philosophy
    if (winRate < 0.4) {
      const driftOptions = PHILOSOPHY_DRIFT[currentPhilosophy] ?? ["Balanced"];
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

function calculateRecentPerformance(recentFights: FightSummary[], rosterNames: Set<string>) {
  let wins = 0, losses = 0;
  for (const f of recentFights) {
    const isA = rosterNames.has(f.a), isD = rosterNames.has(f.d);
    if (isA || isD) {
      const isWin = (isA && f.winner === "A") || (isD && f.winner === "D");
      if (isWin) wins++; else losses++;
    }
  }
  return { wins, losses };
}
