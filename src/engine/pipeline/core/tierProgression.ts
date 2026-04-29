import type { GameState, RivalStableData } from '@/types/state.types';
import { type Season } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { generateId } from '@/utils/idUtils';
import { hashStr } from '@/utils/random';
import type { PoolWarrior } from '@/engine/recruitment';
import { StateImpact } from '@/engine/impacts';

interface TierStats {
  totalWins: number;
  totalKills: number;
  totalFights: number;
  activeCount: number;
}

type TierRule = (
  stats: TierStats
) => { newTier: RivalStableData['tier']; newsTemplate: string } | null;

const tierRules: Record<NonNullable<RivalStableData['tier']>, TierRule[]> = {
  Minor: [
    (stats) =>
      stats.totalWins >= 15 && stats.totalKills >= 2 && stats.activeCount >= 5
        ? { newTier: 'Established', newsTemplate: '📈 {name} has risen to Established status!' }
        : null,
  ],
  Established: [
    (stats) =>
      stats.totalWins >= 30 &&
      stats.totalKills >= 5 &&
      stats.activeCount >= 7 &&
      stats.totalFights > 0 &&
      stats.totalWins / stats.totalFights >= 0.6
        ? { newTier: 'Major', newsTemplate: '🏆 {name} ascends to Major stable status!' }
        : null,
    (stats) =>
      stats.activeCount < 3
        ? { newTier: 'Minor', newsTemplate: '📉 {name} falls to Minor status.' }
        : null,
  ],
  Major: [
    (stats) =>
      stats.activeCount < 4
        ? { newTier: 'Established', newsTemplate: '📉 {name} has been downgraded to Established.' }
        : null,
  ],
  Legendary: [],
};

export function processTierProgression(
  state: GameState,
  newSeason: Season,
  newWeek: number,
  rng?: IRNGService
): StateImpact {
  if (newSeason === state.season) return {};

  const createdAt = state.meta?.createdAt || new Date(0).toISOString();
  const rngService = rng || new SeededRNGService(hashStr(createdAt) + state.week);

  const promotionNews: string[] = [];
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();

  (state.rivals || []).forEach((r) => {
    const stats: TierStats = { totalWins: 0, totalKills: 0, totalFights: 0, activeCount: 0 };
    for (let i = 0; i < r.roster.length; i++) {
      const w = r.roster[i];
      stats.totalWins += w.career.wins;
      stats.totalKills += w.career.kills;
      stats.totalFights += w.career.wins + w.career.losses;
      if (w.status === 'Active') stats.activeCount++;
    }

    const rules = tierRules[r.tier || 'Minor'];
    for (const rule of rules) {
      const result = rule(stats);
      if (result) {
        promotionNews.push(result.newsTemplate.replace('{name}', r.owner.stableName));
        // Key by rival.id (StableId), not owner.id — rivalsUpdates handler indexes by r.id.
        rivalsUpdates.set(r.id, { tier: result.newTier });
        break;
      }
    }
  });

  const impact: StateImpact = {
    rivalsUpdates,
    recruitPool: [] as PoolWarrior[],
  };

  if (promotionNews.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: newWeek,
        title: 'Stable Rankings Update',
        items: promotionNews,
      },
    ];
  }

  return impact;
}
