import { type GameState, type Warrior } from "@/types/game";
import { truncateArray } from "@/utils/stateUtils";

/**
 * Ensures a loaded state has all the necessary properties for the current version.
 * Handles backward compatibility and memory management (truncation).
 */
export function migrateGameState(parsed: any): GameState {
  // 1. Basic property defaults
  if (!parsed.graveyard) parsed.graveyard = [];
  if (!parsed.arenaHistory) parsed.arenaHistory = [];
  if (!parsed.newsletter) parsed.newsletter = [];
  if (!parsed.gazettes) parsed.gazettes = [];
  if (!parsed.hallOfFame) parsed.hallOfFame = [];
  if (parsed.fame === undefined) parsed.fame = 0;
  if (parsed.popularity === undefined) parsed.popularity = 0;
  if (!parsed.moodHistory) parsed.moodHistory = [];
  if (!parsed.retired) parsed.retired = [];
  if (!parsed.crowdMood) parsed.crowdMood = "Calm";
  if (!parsed.tournaments) parsed.tournaments = [];
  if (!parsed.trainers) parsed.trainers = [];
  if (!parsed.hiringPool) parsed.hiringPool = [];
  if (!parsed.trainingAssignments) parsed.trainingAssignments = [];
  
  // Migrate old training assignments (ensure type field exists)
  if (Array.isArray(parsed.trainingAssignments)) {
    parsed.trainingAssignments = parsed.trainingAssignments.map((a: any) => {
      if (typeof a === 'object' && a !== null) {
        return { ...a, type: a.type ?? "attribute" };
      }
      return a;
    });
  }
  
  if (parsed.gold === undefined) parsed.gold = 500;
  if (!parsed.ledger) parsed.ledger = [];
  if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
  if (parsed.ftueStep === undefined) parsed.ftueStep = 0;
  if (parsed.isFTUE === undefined) parsed.isFTUE = !parsed.ftueComplete;
  if (!parsed.coachDismissed) parsed.coachDismissed = [];
  if (!parsed.rivals) parsed.rivals = [];
  if (!parsed.scoutReports) parsed.scoutReports = [];
  if (!parsed.restStates) parsed.restStates = [];
  if (!parsed.rivalries) parsed.rivalries = [];
  if (!parsed.matchHistory) parsed.matchHistory = [];
  if (!parsed.playerChallenges) parsed.playerChallenges = [];
  if (!parsed.playerAvoids) parsed.playerAvoids = [];
  if (!parsed.recruitPool) parsed.recruitPool = [];
  if (parsed.rosterBonus === undefined) parsed.rosterBonus = 0;
  if (!parsed.ownerGrudges) parsed.ownerGrudges = [];
  if (!parsed.insightTokens) parsed.insightTokens = [];
  if (!parsed.seasonalGrowth) parsed.seasonalGrowth = [];
  if (parsed.week === undefined) parsed.week = 1;
  if (!parsed.season) parsed.season = "Spring";
  if (!parsed.settings) parsed.settings = { featureFlags: { tournaments: true, scouting: true } };
  if (!parsed.phase) parsed.phase = "planning";
  if (parsed.unacknowledgedDeaths === undefined) parsed.unacknowledgedDeaths = [];
  
  if (parsed.settings && !parsed.settings.featureFlags?.scouting) {
    parsed.settings.featureFlags = { ...parsed.settings.featureFlags, scouting: true };
  }

  // 2. Warrior and Owner Defaults
  const ensureWarriorDefaults = (w: Partial<Warrior>) => ({
    ...w,
    status: w.status || "Active",
    favorites: w.favorites || {
      weaponId: "",
      rhythm: { oe: 0, al: 0 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    },
  });

  parsed.roster = (parsed.roster || []).map(ensureWarriorDefaults);
  parsed.graveyard = (parsed.graveyard || []).map(ensureWarriorDefaults);
  parsed.retired = (parsed.retired || []).map(ensureWarriorDefaults);

  if (!parsed.player) {
    parsed.player = {
      id: "owner_1",
      name: "You",
      stableName: "My Stable",
      fame: 0,
      renown: 0,
      titles: 0,
      metaAdaptation: "Opportunist",
      favoredStyles: [],
    };
  } else {
    parsed.player.metaAdaptation = parsed.player.metaAdaptation || "Opportunist";
    parsed.player.favoredStyles = parsed.player.favoredStyles || [];
  }
  
  if (parsed.rivals) {
    parsed.rivals.forEach((r: any) => {
      if (r.owner) {
        r.owner.metaAdaptation = r.owner.metaAdaptation || "Opportunist";
        r.owner.favoredStyles = r.owner.favoredStyles || [];
      }
    });
  }

  // 3. Truncation for performance (using truncateArray utility)
  // Memory Leak Prevention: Keep only the most recent data
  parsed.arenaHistory = truncateArray(parsed.arenaHistory || [], 500).map((f: any, i: number, arr: any[]) => {
    // Keep transcripts only for the 20 most recent fights
    if (arr.length - i > 20 && f.transcript) {
        const { transcript, ...rest } = f;
        return rest;
    }
    return f;
  });

  parsed.newsletter = truncateArray(parsed.newsletter || [], 100);
  parsed.ledger = truncateArray(parsed.ledger || [], 500);
  parsed.matchHistory = truncateArray(parsed.matchHistory || [], 500);
  parsed.moodHistory = truncateArray(parsed.moodHistory || [], 50);
  parsed.graveyard = truncateArray(parsed.graveyard || [], 200);
  parsed.retired = truncateArray(parsed.retired || [], 200);
  parsed.tournaments = truncateArray(parsed.tournaments || [], 100);
  parsed.scoutReports = truncateArray(parsed.scoutReports || [], 100);
  parsed.hallOfFame = truncateArray(parsed.hallOfFame || [], 100);
  parsed.rivalries = truncateArray(parsed.rivalries || [], 100);
  parsed.ownerGrudges = truncateArray(parsed.ownerGrudges || [], 100);
  parsed.gazettes = truncateArray(parsed.gazettes || [], 50);
  parsed.seasonalGrowth = truncateArray(parsed.seasonalGrowth || [], 500);
  parsed.insightTokens = truncateArray(parsed.insightTokens || [], 500);
  parsed.playerChallenges = truncateArray(parsed.playerChallenges || [], 100);
  parsed.playerAvoids = truncateArray(parsed.playerAvoids || [], 100);
  parsed.trainingAssignments = truncateArray(parsed.trainingAssignments || [], 200);
  parsed.coachDismissed = truncateArray(parsed.coachDismissed || [], 100);
  parsed.restStates = truncateArray(parsed.restStates || [], 500);
  parsed.hiringPool = truncateArray(parsed.hiringPool || [], 20);
  parsed.recruitPool = truncateArray(parsed.recruitPool || [], 50);
  parsed.trainers = truncateArray(parsed.trainers || [], 50);
  parsed.rivals = truncateArray(parsed.rivals || [], 50);
  parsed.unacknowledgedDeaths = truncateArray(parsed.unacknowledgedDeaths || [], 100);

  return parsed as GameState;
}

/** Legacy logic to avoid prototype pollution when parsing localStorage */
export function sanitizeReviver(key: string, value: any) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  return value;
}
