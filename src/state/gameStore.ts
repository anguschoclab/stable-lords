/**
 * Stable Lords — Game State Store (localStorage-backed)
 */
import { FightingStyle, type GameState, type Warrior, type FightSummary, type Season, type DeathEvent } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { generateFavorites } from "@/engine/favorites";
import { pipe } from "@/engine/pipeline";
import { applyTraining } from "@/engine/pipeline/training";
import { applyEconomy } from "@/engine/pipeline/economy";
import { applyAging } from "@/engine/pipeline/aging";
import { applyHealthUpdates } from "@/engine/pipeline/health";
import { applyRivalAI, applyRecruitment } from "@/engine/pipeline/rivals";
import { applyRecruitPoolRefresh } from "@/engine/pipeline/recruitment";
import { applySeasonalUpdates } from "@/engine/pipeline/seasonal";
import { applyNarrative } from "@/engine/pipeline/narrative";
import { truncateState } from "@/engine/storage/truncation";
const SAVE_KEY = "stablelords.save.v2";

function generateId(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function makeWarrior(
  id: string,
  name: string,
  style: FightingStyle,
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number },
  overrides?: Partial<Warrior>
): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  const favorites = generateFavorites(style, Math.random);
  return {
    id,
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 18 + Math.floor(Math.random() * 8),
    favorites,
    ...overrides,
  };
}

export function createFreshState(): GameState {
  return {
    meta: {
      gameName: "Stable Lords",
      version: "2.0.0",
      createdAt: new Date().toISOString(),
    },
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    player: {
      id: "owner_1",
      name: "You",
      stableName: "My Stable",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    gold: 500,
    ledger: [],
    week: 1,
    phase: "planning",
    season: "Spring",
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: "Calm",
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    settings: {
      featureFlags: {
        tournaments: true,
        scouting: true,
      },
    },
  };
}

/** Legacy alias — kept for existing imports */
export const createDemoState = createFreshState;

// Security: Prevent prototype pollution when deserializing localStorage state
export function sanitizeReviver(key: string, value: any) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  return value;
}

export function migrateGameState(parsed: any): GameState {
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
  // Migrate old training assignments (add type field) if needed
  if (Array.isArray(parsed.trainingAssignments)) {
    parsed.trainingAssignments = parsed.trainingAssignments.map((a: unknown) => {
      if (typeof a === 'object' && a !== null) {
        const obj = a as Record<string, unknown>;
        return {
          ...obj,
          type: obj.type ?? "attribute",
        };
      }
      return a;
    });
  }
  if (parsed.gold === undefined) parsed.gold = 500;
  if (!parsed.ledger) parsed.ledger = [];
  if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
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
  if (!parsed.moodHistory) parsed.moodHistory = [];
  if (!parsed.seasonalGrowth) parsed.seasonalGrowth = [];
  if (!parsed.settings) parsed.settings = { featureFlags: { tournaments: true, scouting: true } };
  if (!parsed.phase) parsed.phase = "planning";
  if (parsed.settings && !parsed.settings.featureFlags?.scouting) {
    parsed.settings.featureFlags = { ...parsed.settings.featureFlags, scouting: true };
  }
  // Ensure all warriors have status and favorites
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

  // Ensure owner defaults
  if (parsed.player) {
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


  // Memory Leak Check: Truncate long-running arrays for older, bloated save files
  if (parsed.arenaHistory) {
    parsed.arenaHistory = parsed.arenaHistory.slice(-500).map((f: any, i: number, arr: any[]) => {
      if (arr.length - i > 20 && f.transcript) {
        const { transcript, ...rest } = f;
        return rest;
      }
      return f;
    });
  }
  if (parsed.newsletter) parsed.newsletter = parsed.newsletter.slice(-100);
  if (parsed.ledger) parsed.ledger = parsed.ledger.slice(-500);
  if (parsed.matchHistory) parsed.matchHistory = parsed.matchHistory.slice(-500);
  if (parsed.moodHistory) parsed.moodHistory = parsed.moodHistory.slice(-50);
  if (parsed.graveyard) parsed.graveyard = parsed.graveyard.slice(-200);
  if (parsed.retired) parsed.retired = parsed.retired.slice(-200);
  if (parsed.tournaments) parsed.tournaments = parsed.tournaments.slice(-100);
  if (parsed.scoutReports) parsed.scoutReports = parsed.scoutReports.slice(-100);
  if (parsed.hallOfFame) parsed.hallOfFame = parsed.hallOfFame.slice(-100);
  if (parsed.rivalries) parsed.rivalries = parsed.rivalries.slice(-100);
  if (parsed.ownerGrudges) parsed.ownerGrudges = parsed.ownerGrudges.slice(-100);
  if (parsed.gazettes) parsed.gazettes = parsed.gazettes.slice(-50);
  if (parsed.seasonalGrowth) parsed.seasonalGrowth = parsed.seasonalGrowth.slice(-500);
  if (parsed.insightTokens) parsed.insightTokens = parsed.insightTokens.slice(-500);
  if (parsed.playerChallenges) parsed.playerChallenges = parsed.playerChallenges.slice(-100);
  if (parsed.playerAvoids) parsed.playerAvoids = parsed.playerAvoids.slice(-100);
  if (parsed.trainingAssignments) parsed.trainingAssignments = parsed.trainingAssignments.slice(-200);
  return parsed as GameState;
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw, sanitizeReviver);
      if (parsed && parsed.meta) {
        return migrateGameState(parsed);
      }
    }
  } catch {
    // corrupt save, re-seed
  }
  const fresh = createFreshState();
  saveGameState(fresh);
  return fresh;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // storage full
  }
}

export function resetGameState(): GameState {
  localStorage.removeItem(SAVE_KEY);
  const fresh = createFreshState();
  saveGameState(fresh);
  return fresh;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Advance the game by one week using a strict, immutable reducer-style pipeline.
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │  WEEKLY ADVANCE PIPELINE — Guaranteed Execution Order         │
 * │                                                               │
 * │  Step 1: Training        — Apply attribute gains from drills  │
 * │  Step 2: Economy         — Process income, expenses, ledger   │
 * │  Step 3: Aging           — Tick warrior ages, apply decline   │
 * │  Step 4: Injuries        — Heal active injuries, tick timers  │
 * │  Step 5: Rest States     — Clear expired mandatory rest       │
 * │  Step 6: AI Bouts        — Rival-vs-rival background fights  │
 * │  Step 7: Recruitment     — Refresh orphan pool, AI drafting   │
 * │  Step 8: Hall of Fame    — Yearly induction (every 52 weeks)  │
 * │  Step 9: Tier Progression— Promote/demote rival stables       │
 * │  Step 10: Clock Advance  — Increment week counter & season    │
 * │                                                               │
 * │  Each step receives the output of the previous step.          │
 * │  No step mutates the original state reference.                │
 * └────────────────────────────────────────────────────────────────┘
 *
 * @param state - Current immutable game state
 * @returns New game state after all pipeline steps
 */
export function advanceWeek(state: GameState): GameState {
  return pipe(
    state,
    applyTraining,
    applyEconomy,
    applyAging,
    applyHealthUpdates,
    applyRivalAI,
    applyRecruitPoolRefresh,
    applyRecruitment,
    applySeasonalUpdates,
    applyNarrative,
    truncateState
  );
}

export function appendFightToHistory(
  state: GameState,
  summary: FightSummary
): GameState {
  const newHistory = [...state.arenaHistory, summary].slice(-500).map((f, i, arr) => {
    // Keep transcripts only for the last 20 fights to save memory
    if (arr.length - i > 20 && f.transcript) {
      const { transcript, ...rest } = f;
      return rest as FightSummary;
    }
    return f;
  });

  return {
    ...state,
    arenaHistory: newHistory,
  };
}

export function updateWarriorAfterFight(
  state: GameState,
  warriorId: string,
  won: boolean,
  killed: boolean,
  fameDelta: number,
  popDelta: number
): GameState {
  return {
    ...state,
    roster: state.roster.map((w) =>
      w.id === warriorId
        ? {
            ...w,
            fame: Math.max(0, w.fame + fameDelta),
            popularity: Math.max(0, w.popularity + popDelta),
            career: {
              ...w.career,
              wins: w.career.wins + (won ? 1 : 0),
              losses: w.career.losses + (won ? 0 : 1),
              kills: w.career.kills + (killed ? 1 : 0),
            },
          }
        : w
    ),
  };
}

/** Create a new warrior and add to roster */
export function addWarriorToRoster(state: GameState, warrior: Warrior): GameState {
  return { ...state, roster: [...state.roster, warrior] };
}

/** Kill a warrior — move to graveyard */
export function killWarrior(
  state: GameState,
  warriorId: string,
  killedBy: string,
  cause: string,
  deathEvent?: DeathEvent
): GameState {
  const warrior = state.roster.find((w) => w.id === warriorId);
  if (!warrior) return state;
  const dead: Warrior = {
    ...warrior,
    status: "Dead",
    deathWeek: state.week,
    deathCause: cause,
    killedBy,
    deathEvent,
  };
  return {
    ...state,
    roster: state.roster.filter((w) => w.id !== warriorId),
    graveyard: [...state.graveyard, dead],
  };
}

/** Retire a warrior */
export function retireWarrior(state: GameState, warriorId: string): GameState {
  const warrior = state.roster.find((w) => w.id === warriorId);
  if (!warrior) return state;
  const ret: Warrior = {
    ...warrior,
    status: "Retired",
    retiredWeek: state.week,
  };
  return {
    ...state,
    roster: state.roster.filter((w) => w.id !== warriorId),
    retired: [...state.retired, ret],
  };
}

export { makeWarrior };

export function clearResolutionPhase(state: GameState): GameState {
  return {
    ...state,
    phase: "planning",
    pendingResolutionData: undefined,
  };
}
