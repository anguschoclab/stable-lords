import type { Warrior } from '@/types/warrior.types';

export interface StableStats {
  activeCount: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
  totalFame: number;
  avgFame: number;
  winRate: number;
  styleCounts: Record<string, number>;
  avgAttributes: Record<string, number>;
  topWarrior: Warrior | null;
}

const ATTRIBUTE_KEYS = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const;

/**
 * Standardized O(N) calculation for a stable's performance metrics.
 * Used across Scouting, Dashboard, and Global Rankings to ensure a single source of truth.
 */
export function calculateStableStats(roster: Warrior[]): StableStats {
  const active: Warrior[] = [];
  let totalWins = 0;
  let totalLosses = 0;
  let totalKills = 0;
  let totalFame = 0;

  const styleCounts: Record<string, number> = {};
  const sumAttrs: Record<string, number> = { ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 };
  let topWarrior: Warrior | null = null;

  for (let i = 0; i < roster.length; i++) {
    const w = roster[i];
    if (w.status !== 'Active') continue;

    active.push(w);
    totalWins += w.career?.wins ?? 0;
    totalLosses += w.career?.losses ?? 0;
    totalKills += w.career?.kills ?? 0;
    totalFame += w.fame ?? 0;

    styleCounts[w.style] = (styleCounts[w.style] ?? 0) + 1;

    for (const key of ATTRIBUTE_KEYS) {
      sumAttrs[key] += w.attributes[key] ?? 0;
    }

    if (!topWarrior || (w.fame ?? 0) > (topWarrior.fame ?? 0)) {
      topWarrior = w;
    }
  }

  const activeCount = active.length;
  const avgFame = activeCount > 0 ? Math.round(totalFame / activeCount) : 0;
  const totalBouts = totalWins + totalLosses;
  const winRate = totalBouts > 0 ? Math.round((totalWins / totalBouts) * 100) : 0;

  const avgAttributes: Record<string, number> = {};
  if (activeCount > 0) {
    for (const key of ATTRIBUTE_KEYS) {
      avgAttributes[key] = Math.round(sumAttrs[key] / activeCount);
    }
  } else {
    for (const key of ATTRIBUTE_KEYS) {
      avgAttributes[key] = 0;
    }
  }

  return {
    activeCount,
    totalWins,
    totalLosses,
    totalKills,
    totalFame,
    avgFame,
    winRate,
    styleCounts,
    avgAttributes,
    topWarrior,
  };
}
