/**
 * Stable Lords — Game State Store (localStorage-backed)
 */
import { FightingStyle, type GameState, type Warrior, type FightSummary, type Season } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { processTraining } from "@/engine/training";
import { processEconomy } from "@/engine/economy";
import { processAging } from "@/engine/aging";
import { tickInjuries } from "@/engine/injuries";
import { clearExpiredRest } from "@/engine/matchmaking";
import { runAIvsAIBouts } from "@/engine/matchmaking";

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
    season: "Spring",
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    hallOfFame: [],
    crowdMood: "Calm",
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
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

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.meta) {
        // Migrate old saves
        if (!parsed.graveyard) parsed.graveyard = [];
        if (!parsed.retired) parsed.retired = [];
        if (!parsed.crowdMood) parsed.crowdMood = "Calm";
        if (!parsed.tournaments) parsed.tournaments = [];
        if (!parsed.trainers) parsed.trainers = [];
        if (!parsed.hiringPool) parsed.hiringPool = [];
        if (!parsed.trainingAssignments) parsed.trainingAssignments = [];
        if (parsed.gold === undefined) parsed.gold = 500;
        if (!parsed.ledger) parsed.ledger = [];
        if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
        if (!parsed.coachDismissed) parsed.coachDismissed = [];
        if (!parsed.rivals) parsed.rivals = [];
        if (!parsed.scoutReports) parsed.scoutReports = [];
        if (!parsed.restStates) parsed.restStates = [];
        if (!parsed.rivalries) parsed.rivalries = [];
        if (!parsed.matchHistory) parsed.matchHistory = [];
        // Ensure all warriors have status
        parsed.roster = (parsed.roster || []).map((w: any) => ({
          ...w,
          status: w.status || "Active",
        }));
        return parsed as GameState;
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

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

export function advanceWeek(state: GameState): GameState {
  const trained = processTraining(state);
  const economized = processEconomy(trained);
  const aged = processAging(economized);
  
  // Tick injuries
  const injuryNews: string[] = [];
  const rosterWithHealedInjuries = aged.roster.map((w) => {
    const injuryObjects = (w.injuries || []).filter((i): i is import("@/types/game").InjuryData => typeof i !== "string");
    if (injuryObjects.length === 0) return w;
    const { active, healed } = tickInjuries(injuryObjects as any);
    if (healed.length > 0) injuryNews.push(`${w.name} recovered from ${healed.join(", ")}.`);
    return { ...w, injuries: active as any };
  });
  
  let updatedState = { ...aged, roster: rosterWithHealedInjuries };
  if (injuryNews.length > 0) {
    updatedState.newsletter = [...updatedState.newsletter, { week: updatedState.week, title: "Medical Report", items: injuryNews }];
  }
  
  const newWeek = updatedState.week + 1;
  const seasonIdx = Math.floor((newWeek - 1) / 13) % 4;
  return {
    ...updatedState,
    week: newWeek,
    season: SEASONS[seasonIdx],
  };
}

export function appendFightToHistory(
  state: GameState,
  summary: FightSummary
): GameState {
  return {
    ...state,
    arenaHistory: [...state.arenaHistory, summary],
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
  cause: string
): GameState {
  const warrior = state.roster.find((w) => w.id === warriorId);
  if (!warrior) return state;
  const dead: Warrior = {
    ...warrior,
    status: "Dead",
    deathWeek: state.week,
    deathCause: cause,
    killedBy,
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
