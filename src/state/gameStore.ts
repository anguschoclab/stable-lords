/**
 * Stable Lords — Game State Store (localStorage-backed)
 */
import { FightingStyle, type GameState, type Warrior, type FightSummary, type Season } from "@/types/game";

const SAVE_KEY = "stablelords.save.v2";

function generateId(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function createDemoState(): GameState {
  return {
    meta: {
      gameName: "Stable Lords",
      version: "2.0.0",
      createdAt: new Date().toISOString(),
    },
    player: {
      id: "owner_1",
      name: "You",
      stableName: "The Ivory Tower",
      fame: 3,
      renown: 2,
      titles: 0,
      personality: "Tactician",
    },
    fame: 3,
    popularity: 2,
    week: 1,
    season: "Spring",
    roster: [
      {
        id: "w1",
        name: "TARUL",
        style: FightingStyle.ParryStrike,
        attributes: { ST: 16, CN: 10, SZ: 10, WT: 13, WL: 13, SP: 11, DF: 11 },
        fame: 2,
        popularity: 1,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 1, kills: 0 },
        champion: false,
      },
      {
        id: "w2",
        name: "ORCREST",
        style: FightingStyle.ParryLunge,
        attributes: { ST: 12, CN: 11, SZ: 11, WT: 12, WL: 12, SP: 13, DF: 12 },
        fame: 3,
        popularity: 2,
        titles: ["Spring Open"],
        injuries: ["off-hand numb"],
        flair: ["Flashy"],
        career: { wins: 1, losses: 0, kills: 0 },
        champion: false,
      },
      {
        id: "w3",
        name: "BLOB",
        style: FightingStyle.BashingAttack,
        attributes: { ST: 18, CN: 19, SZ: 7, WT: 4, WL: 20, SP: 12, DF: 5 },
        fame: 1,
        popularity: 0,
        titles: [],
        injuries: ["trick knee"],
        flair: [],
        career: { wins: 0, losses: 1, kills: 0 },
        champion: false,
      },
    ],
    arenaHistory: [],
    newsletter: [
      {
        week: 1,
        title: "Arena Chronicle",
        items: [
          "Welcome to Stable Lords!",
          "Your stable has been registered. Train your warriors and seek glory in the arena.",
        ],
      },
    ],
    hallOfFame: [],
    settings: {
      featureFlags: {
        tournaments: true,
        scouting: false,
      },
    },
  };
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.meta) return parsed as GameState;
    }
  } catch {
    // corrupt save, re-seed
  }
  const demo = createDemoState();
  saveGameState(demo);
  return demo;
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
  const demo = createDemoState();
  saveGameState(demo);
  return demo;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

export function advanceWeek(state: GameState): GameState {
  const newWeek = state.week + 1;
  const seasonIdx = Math.floor((newWeek - 1) / 13) % 4;
  return {
    ...state,
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
