/**
 * Week Pipeline — composable steps extracted from advanceWeek.
 * Each function is a pure transform: GameState → GameState.
 */
import type { GameState, Season, Warrior, RivalStableData } from "@/types/game";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

/**
 * Hall of Fame induction — runs every 52 weeks.
 * Identifies year's best warriors and stables.
 */
export function processHallOfFame(state: GameState, newWeek: number): GameState {
  if (newWeek % 52 !== 0) return state;

  const yearNum = Math.floor(newWeek / 52);
  const hofNews: string[] = [];

  const allWarriors: Warrior[] = [
    ...state.roster,
    ...state.graveyard,
    ...state.retired,
    ...(state.rivals || []).flatMap(r => r.roster),
  ];

  const bestByFame = [...allWarriors].sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))[0];
  if (bestByFame && (bestByFame.fame ?? 0) > 0) {
    hofNews.push(`🏛️ HALL OF FAME: ${bestByFame.name} (${bestByFame.style}) inducted as Year ${yearNum}'s greatest warrior with ${bestByFame.fame} fame!`);
  }

  const bestKiller = [...allWarriors].filter(w => w.career.kills > 0).sort((a, b) => b.career.kills - a.career.kills)[0];
  if (bestKiller && bestKiller.name !== bestByFame?.name) {
    hofNews.push(`💀 DEADLIEST BLADE: ${bestKiller.name} earns the "Deadliest Blade" honor with ${bestKiller.career.kills} kills in Year ${yearNum}.`);
  }

  const bestWins = [...allWarriors].filter(w => w.career.wins > 0).sort((a, b) => b.career.wins - a.career.wins)[0];
  if (bestWins && bestWins.name !== bestByFame?.name && bestWins.name !== bestKiller?.name) {
    hofNews.push(`⚔️ IRON CHAMPION: ${bestWins.name} recorded the most victories (${bestWins.career.wins}) in Year ${yearNum}.`);
  }

  const yearTournaments = state.tournaments.filter(t => t.completed && t.champion && t.week >= newWeek - 52);
  for (const t of yearTournaments) {
    hofNews.push(`🏆 ${t.champion} won the ${t.name} (Week ${t.week}).`);
  }

  const stables = [
    { name: state.player.stableName, fame: state.player.fame ?? 0 },
    ...(state.rivals || []).map(r => ({
      name: r.owner.stableName,
      fame: r.roster.reduce((sum, w) => sum + (w.fame ?? 0), 0),
    })),
  ].sort((a, b) => b.fame - a.fame);
  if (stables[0] && stables[0].fame > 0) {
    hofNews.push(`🏟️ STABLE OF THE YEAR: ${stables[0].name} dominated Year ${yearNum} with ${stables[0].fame} total fame.`);
  }

  if (hofNews.length === 0) return state;

  return {
    ...state,
    newsletter: [...state.newsletter, { week: newWeek, title: `Year ${yearNum} Hall of Fame Inductions`, items: hofNews }],
  };
}

/**
 * Tier Progression — promote/demote rival stables on season change.
 */
export function processTierProgression(state: GameState, newSeason: Season, newWeek: number): GameState {
  if (newSeason === state.season) return state;

  const promotionNews: string[] = [];
  const updatedRivals = (state.rivals || []).map(r => {
    const { totalWins, totalKills, totalFights, activeCount } = r.roster.reduce(
      (acc, w) => {
        acc.totalWins += w.career.wins;
        acc.totalKills += w.career.kills;
        acc.totalFights += w.career.wins + w.career.losses;
        if (w.status === "Active") acc.activeCount++;
        return acc;
      },
      { totalWins: 0, totalKills: 0, totalFights: 0, activeCount: 0 }
    );

    let newTier = r.tier;

    if (r.tier === "Minor" && totalWins >= 15 && totalKills >= 2 && activeCount >= 5) {
      newTier = "Established";
      promotionNews.push(`📈 ${r.owner.stableName} has risen to Established status!`);
    } else if (r.tier === "Established" && totalWins >= 30 && totalKills >= 5 && activeCount >= 7 && totalFights > 0 && (totalWins / totalFights) >= 0.6) {
      newTier = "Major";
      promotionNews.push(`🏆 ${r.owner.stableName} ascends to Major stable status!`);
    } else if (r.tier === "Major" && activeCount < 4) {
      newTier = "Established";
      promotionNews.push(`📉 ${r.owner.stableName} has been downgraded to Established.`);
    } else if (r.tier === "Established" && activeCount < 3) {
      newTier = "Minor";
      promotionNews.push(`📉 ${r.owner.stableName} falls to Minor status.`);
    }

    return newTier !== r.tier ? { ...r, tier: newTier as any } : r;
  });

  const s = { ...state, rivals: updatedRivals, recruitPool: [] as any[] };
  if (promotionNews.length > 0) {
    s.newsletter = [...s.newsletter, { week: newWeek, title: "Stable Rankings Update", items: promotionNews }];
  }

  return s;
}

/**
 * Compute the next season for a given week number.
 */
export function computeNextSeason(newWeek: number): Season {
  const seasonIdx = Math.floor((newWeek - 1) / 13) % 4;
  return SEASONS[seasonIdx];
}
