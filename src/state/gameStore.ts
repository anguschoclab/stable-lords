/**
 * Stable Lords — Game State Store (localStorage-backed)
 */
import { FightingStyle, type GameState, type Warrior, type FightSummary, type Season } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { processTraining } from "@/engine/training";
import { processEconomy } from "@/engine/economy";
import { processAging } from "@/engine/aging";
import { tickInjuries } from "@/engine/injuries";
import { clearExpiredRest, runAIvsAIBouts } from "@/engine/matchmaking";
import { partialRefreshPool, aiDraftFromPool } from "@/engine/recruitment";
import { processHallOfFame, processTierProgression, computeNextSeason } from "@/engine/weekPipeline";

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
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
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
        if (!parsed.recruitPool) parsed.recruitPool = [];
        if (parsed.rosterBonus === undefined) parsed.rosterBonus = 0;
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
  // ── Step 1: Training ──────────────────────────────────────────────────
  const afterTraining = processTraining(state);

  // ── Step 2: Economy ───────────────────────────────────────────────────
  const afterEconomy = processEconomy(afterTraining);

  // ── Step 3: Aging ─────────────────────────────────────────────────────
  const afterAging = processAging(afterEconomy);

  // ── Step 4: Injuries ──────────────────────────────────────────────────
  const injuryNews: string[] = [];
  const rosterWithHealedInjuries = afterAging.roster.map((w) => {
    const injuryObjects = (w.injuries || []).filter((i): i is import("@/types/game").InjuryData => typeof i !== "string");
    if (injuryObjects.length === 0) return w;
    const { active, healed } = tickInjuries(injuryObjects as any);
    if (healed.length > 0) injuryNews.push(`${w.name} recovered from ${healed.join(", ")}.`);
    return { ...w, injuries: active as any };
  });

  let s = { ...afterAging, roster: rosterWithHealedInjuries };
  if (injuryNews.length > 0) {
    s.newsletter = [...s.newsletter, { week: s.week, title: "Medical Report", items: injuryNews }];
  }

  // ── Step 5: Rest States ───────────────────────────────────────────────
  s.restStates = clearExpiredRest(s.restStates || [], s.week);

  // ── Step 6: AI Bouts ──────────────────────────────────────────────────
  if ((s.rivals || []).length > 0) {
    const { updatedRivals, gazetteItems } = runAIvsAIBouts(s);
    s.rivals = updatedRivals;
    if (gazetteItems.length > 0) {
      s.newsletter = [...s.newsletter, { week: s.week, title: "Rival Arena Report", items: gazetteItems }];
    }
  }

  // ── Step 7: Recruitment ───────────────────────────────────────────────
  const usedNames = new Set<string>();
  for (const w of s.roster) usedNames.add(w.name);
  for (const w of s.graveyard) usedNames.add(w.name);
  for (const r of s.rivals || []) for (const w of r.roster) usedNames.add(w.name);
  s.recruitPool = partialRefreshPool(s.recruitPool || [], s.week, usedNames);

  if ((s.rivals || []).length > 0 && (s.recruitPool || []).length > 0) {
    const draft = aiDraftFromPool(s.recruitPool, s.rivals, s.week);
    s.recruitPool = draft.updatedPool;
    s.rivals = draft.updatedRivals;
    if (draft.gazetteItems.length > 0) {
      s.newsletter = [...s.newsletter, { week: s.week, title: "Draft Report", items: draft.gazetteItems }];
    }
  }

  // ── Step 8: Hall of Fame (every 52 weeks) ─────────────────────────────
  const newWeek = s.week + 1;
  const newSeason = computeNextSeason(newWeek);

  s = processHallOfFame(s, newWeek);

  // ── Step 9: Tier Progression (on season change) ───────────────────────
  s = processTierProgression(s, newSeason, newWeek);

  // ── Step 10: Clock Advance ────────────────────────────────────────────
  return {
    ...s,
    week: newWeek,
    season: newSeason,
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
