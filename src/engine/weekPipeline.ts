/**
 * Week Pipeline — composable steps extracted from advanceWeek.
 * Each function is a pure transform: GameState → GameState.
 */
import type { GameState, Season, Warrior, RivalStableData } from "@/types/game";
import { OPFSArchiveService } from "./storage/opfsArchive";
import type { PoolWarrior } from "./recruitment";
import { aiDraftFromPool } from "./recruitment";
import { processRivalStableWeekly } from "./rivals";
import { seededRng } from "@/utils/mathUtils";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

/**
 * Hall of Fame induction — runs every 52 weeks.
 * Identifies year's best warriors and stables.
 */
export function processHallOfFame(state: GameState, newWeek: number): GameState {
  if (newWeek % 52 !== 0) return state;

  const yearNum = Math.floor(newWeek / 52);
  const hofNews: string[] = [];

  // ⚡ Bolt: Prevent massive O(N log N) sorting and array allocation overhead
  // by doing a single O(N) pass across all rosters to find the Hall of Fame inductees.
  let bestByFame: Warrior | undefined;
  let bestKiller: Warrior | undefined;
  let bestWins: Warrior | undefined;

  const checkWarrior = (w: Warrior) => {
    if (!bestByFame || (w.fame ?? 0) > (bestByFame.fame ?? 0)) {
      bestByFame = w;
    }
    if (w.career.kills > 0 && (!bestKiller || w.career.kills > bestKiller.career.kills)) {
      bestKiller = w;
    }
    if (w.career.wins > 0 && (!bestWins || w.career.wins > bestWins.career.wins)) {
      bestWins = w;
    }
  };

  for (let i = 0; i < state.roster.length; i++) checkWarrior(state.roster[i]);
  for (let i = 0; i < state.graveyard.length; i++) checkWarrior(state.graveyard[i]);
  for (let i = 0; i < state.retired.length; i++) checkWarrior(state.retired[i]);
  if (state.rivals) {
    for (let r = 0; r < state.rivals.length; r++) {
      const roster = state.rivals[r].roster;
      for (let i = 0; i < roster.length; i++) {
        checkWarrior(roster[i]);
      }
    }
  }

  if (bestByFame && (bestByFame.fame ?? 0) > 0) {
    hofNews.push(`🏛️ HALL OF FAME: ${bestByFame.name} (${bestByFame.style}) inducted as Year ${yearNum}'s greatest warrior with ${bestByFame.fame} fame!`);
  }

  if (bestKiller && bestKiller.name !== bestByFame?.name) {
    hofNews.push(`💀 DEADLIEST BLADE: ${bestKiller.name} earns the "Deadliest Blade" honor with ${bestKiller.career.kills} kills in Year ${yearNum}.`);
  }

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
    // ⚡ Bolt: Single pass over roster to compute stats instead of reduce allocating objects
    let totalWins = 0;
    let totalKills = 0;
    let totalFights = 0;
    let activeCount = 0;

    for (let i = 0; i < r.roster.length; i++) {
      const w = r.roster[i];
      totalWins += w.career.wins;
      totalKills += w.career.kills;
      totalFights += w.career.wins + w.career.losses;
      if (w.status === "Active") activeCount++;
    }

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

    return newTier !== r.tier ? { ...r, tier: newTier as RivalStableData["tier"] } : r;
  });

  const s = { ...state, rivals: updatedRivals, recruitPool: [] as PoolWarrior[] };
  if (promotionNews.length > 0) {
    s.newsletter = [...s.newsletter, { week: newWeek, title: "Stable Rankings Update", items: promotionNews }];
  }

  return s;
}

/**
 * Rival AI Actions — recruitment, training, and trainer management.
 */
export function processRivalActions(state: GameState, newWeek: number): GameState {
  const rng = seededRng(newWeek * 7919 + 13);
  let updatedRivals = [...(state.rivals || [])];
  const globalGazetteItems: string[] = [];

  // 1) AI Recruitment (Every 4 weeks)
  const draft = aiDraftFromPool(state.recruitPool, updatedRivals, newWeek);
  updatedRivals = draft.updatedRivals;
  const updatedPool = draft.updatedPool;
  globalGazetteItems.push(...draft.gazetteItems);

  // 2) Training & Management for each stable
  const finalRivals = updatedRivals.map(r => {
    const result = processRivalStableWeekly(r, rng, newWeek);
    // filter out items already in globalGazetteItems if they somehow overlap
    return result.rival;
  });

  const newState = {
    ...state,
    rivals: finalRivals,
    recruitPool: updatedPool,
  };

  if (globalGazetteItems.length > 0) {
    newState.newsletter = [
      ...newState.newsletter,
      { week: newWeek, title: "Intelligence Report", items: globalGazetteItems }
    ];
  }

  return newState;
}

/**
 * Compute the next season for a given week number.
 */
export function computeNextSeason(newWeek: number): Season {
  const seasonIdx = Math.floor((newWeek - 1) / 13) % 4;
  return SEASONS[seasonIdx];
}

export function seasonToNumber(season: Season): number {
  return SEASONS.indexOf(season);
}


/**
 * OPFS Archival Step — Extracts PBP logs and fires background writes.
 * Strips the massive PBP arrays from state to prevent UI freezing and memory bloat.
 */
export function archiveWeekLogs(state: GameState): GameState {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  let stateModified = false;
  const newArenaHistory = state.arenaHistory.map(summary => {
    // If it has a transcript, archive it and strip it
    if (summary.transcript && summary.transcript.length > 0) {
      stateModified = true;
      const seasonNum = seasonToNumber(state.season);
      // Fire and forget archival (async, no await)
      opfs.archiveBoutLog(seasonNum, summary.id, summary.transcript).catch(err => {
        console.error(`Failed to background archive bout ${summary.id}:`, err);
      });

      // Strip transcript from state
      return {
        ...summary,
        transcript: undefined
      };
    }
    return summary;
  });

  if (!stateModified) return state;

  return {
    ...state,
    arenaHistory: newArenaHistory
  };
}
