import type { GameState, RivalStableData } from "@/types/state.types";
import { type Season } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";
import { generateId, hashStr } from "@/utils/idUtils";
import type { PoolWarrior } from "@/engine/recruitment";

interface TierStats { totalWins: number; totalKills: number; totalFights: number; activeCount: number; }

type TierRule = (stats: TierStats) => { newTier: RivalStableData["tier"]; newsTemplate: string } | null;

const tierRules: Record<NonNullable<RivalStableData["tier"]>, TierRule[]> = {
  Minor: [
    (stats) => stats.totalWins >= 15 && stats.totalKills >= 2 && stats.activeCount >= 5
      ? { newTier: "Established", newsTemplate: "📈 {name} has risen to Established status!" } : null
  ],
  Established: [
    (stats) => stats.totalWins >= 30 && stats.totalKills >= 5 && stats.activeCount >= 7 && stats.totalFights > 0 && (stats.totalWins / stats.totalFights) >= 0.6
      ? { newTier: "Major", newsTemplate: "🏆 {name} ascends to Major stable status!" } : null,
    (stats) => stats.activeCount < 3
      ? { newTier: "Minor", newsTemplate: "📉 {name} falls to Minor status." } : null
  ],
  Major: [
    (stats) => stats.activeCount < 4
      ? { newTier: "Established", newsTemplate: "📉 {name} has been downgraded to Established." } : null
  ],
  Legendary: []
};

export function processTierProgression(state: GameState, newSeason: Season, newWeek: number): GameState {
  if (newSeason === state.season) return state;

  const promotionNews: string[] = [];
  const updatedRivals = (state.rivals || []).map(r => {
    const stats: TierStats = { totalWins: 0, totalKills: 0, totalFights: 0, activeCount: 0 };
    for (let i = 0; i < r.roster.length; i++) {
      const w = r.roster[i];
      stats.totalWins += w.career.wins;
      stats.totalKills += w.career.kills;
      stats.totalFights += w.career.wins + w.career.losses;
      if (w.status === "Active") stats.activeCount++;
    }

    const rules = tierRules[r.tier || "Minor"];
    for (const rule of rules) {
      const result = rule(stats);
      if (result) {
        promotionNews.push(result.newsTemplate.replace("{name}", r.owner.stableName));
        return { ...r, tier: result.newTier };
      }
    }
    return r;
  });

  const createdAt = state.meta?.createdAt || new Date(0).toISOString();
  const rng = new SeededRNG(hashStr(createdAt) + state.week);
  const s = { ...state, rivals: updatedRivals, recruitPool: [] as PoolWarrior[] };
  if (promotionNews.length > 0) {
    s.newsletter = [
      ...s.newsletter, 
      { 
        id: generateId(rng, "newsletter"),
        week: newWeek, 
        title: "Stable Rankings Update", 
        items: promotionNews 
      }
    ];
  }
  return s;
}
