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

  // Clear expired rest states
  updatedState.restStates = clearExpiredRest(updatedState.restStates || [], updatedState.week);

  // Run AI vs AI background bouts
  if ((updatedState.rivals || []).length > 0) {
    const { updatedRivals, gazetteItems } = runAIvsAIBouts(updatedState);
    updatedState.rivals = updatedRivals;
    if (gazetteItems.length > 0) {
      updatedState.newsletter = [...updatedState.newsletter, { week: updatedState.week, title: "Rival Arena Report", items: gazetteItems }];
    }
  }

  // Partial pool refresh (1-2 warriors cycled weekly)
  const usedNames = new Set<string>();
  for (const w of updatedState.roster) usedNames.add(w.name);
  for (const w of updatedState.graveyard) usedNames.add(w.name);
  for (const r of updatedState.rivals || []) for (const w of r.roster) usedNames.add(w.name);
  updatedState.recruitPool = partialRefreshPool(updatedState.recruitPool || [], updatedState.week, usedNames);

  // AI draft from pool (every 4 weeks)
  if ((updatedState.rivals || []).length > 0 && (updatedState.recruitPool || []).length > 0) {
    const draft = aiDraftFromPool(updatedState.recruitPool, updatedState.rivals, updatedState.week);
    updatedState.recruitPool = draft.updatedPool;
    updatedState.rivals = draft.updatedRivals;
    if (draft.gazetteItems.length > 0) {
      updatedState.newsletter = [...updatedState.newsletter, { week: updatedState.week, title: "Draft Report", items: draft.gazetteItems }];
    }
  }

  // ─── Stable Tier Progression (every 13 weeks / season change) ──────────
  const newWeek = updatedState.week + 1;
  const seasonIdx = Math.floor((newWeek - 1) / 13) % 4;
  const newSeason = SEASONS[seasonIdx];

  if (newSeason !== updatedState.season) {
    const promotionNews: string[] = [];
    updatedState.rivals = (updatedState.rivals || []).map(r => {
      const totalWins = r.roster.reduce((s, w) => s + w.career.wins, 0);
      const totalKills = r.roster.reduce((s, w) => s + w.career.kills, 0);
      const totalFights = r.roster.reduce((s, w) => s + w.career.wins + w.career.losses, 0);
      const activeCount = r.roster.filter(w => w.status === "Active").length;

      let newTier = r.tier;

      // Minor → Established: 15+ total wins, 2+ kills, 5+ active warriors
      if (r.tier === "Minor" && totalWins >= 15 && totalKills >= 2 && activeCount >= 5) {
        newTier = "Established";
        promotionNews.push(`📈 ${r.owner.stableName} has risen to Established status! Their ${totalWins} victories and growing kill count demand respect.`);
      }
      // Established → Major: 30+ wins, 5+ kills, 7+ active, 60%+ win rate
      else if (r.tier === "Established" && totalWins >= 30 && totalKills >= 5 && activeCount >= 7 && totalFights > 0 && (totalWins / totalFights) >= 0.6) {
        newTier = "Major";
        promotionNews.push(`🏆 ${r.owner.stableName} ascends to Major stable status! ${r.owner.name}'s warriors are now a dominant force in the arena.`);
      }
      // Demotion: Major → Established if < 4 active warriors
      else if (r.tier === "Major" && activeCount < 4) {
        newTier = "Established";
        promotionNews.push(`📉 ${r.owner.stableName} has been downgraded to Established — their roster has thinned dangerously.`);
      }
      // Demotion: Established → Minor if < 3 active warriors
      else if (r.tier === "Established" && activeCount < 3) {
        newTier = "Minor";
        promotionNews.push(`📉 ${r.owner.stableName} falls to Minor status. Can ${r.owner.name} rebuild?`);
      }

      if (newTier !== r.tier) {
        return { ...r, tier: newTier as any };
      }
      return r;
    });

    if (promotionNews.length > 0) {
      updatedState.newsletter = [...updatedState.newsletter, {
        week: newWeek,
        title: "Stable Rankings Update",
        items: promotionNews,
      }];
    }

    // Full pool reset on season change
    updatedState.recruitPool = [];
  }

  return {
    ...updatedState,
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
