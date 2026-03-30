import { type GameState, type Warrior, type FightSummary, type DeathEvent } from "@/types/game";
import { pipe } from "@/engine/pipeline";
import { applyTraining } from "@/engine/pipeline/training";
import { applyEconomy } from "@/engine/pipeline/economy";
import { applyAging } from "@/engine/pipeline/aging";
import { applyHealthUpdates } from "@/engine/pipeline/health";
import { applyRivalAI, applyRecruitment } from "@/engine/pipeline/rivals";
import { applyRecruitPoolRefresh } from "@/engine/pipeline/recruitment";
import { applySeasonalUpdates } from "@/engine/pipeline/seasonal";
import { applyNarrative } from "@/engine/pipeline/narrative";
import { archiveWeekLogs } from '@/engine/weekPipeline';
import { truncateState } from "@/engine/storage/truncation";
import { migrateGameState, sanitizeReviver } from "./migrations";
import { createFreshState, makeWarrior } from "@/engine/factories";
import { updateEntityInList, truncateArray } from "@/utils/stateUtils";
import { generateId } from "@/utils/idUtils";

const SAVE_KEY = "stablelords.save.v2";

export { makeWarrior, createFreshState };

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
 * │  Step 10: OPFS Archival  — Save & strip PBP logs              │
 * │  Step 11: Clock Advance  — Increment week counter & season    │
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
    archiveWeekLogs,
    truncateState
  );
}

export function appendFightToHistory(
  state: GameState,
  summary: FightSummary
): GameState {
  const newHistory = truncateArray([...state.arenaHistory, summary], 500).map((f, i, arr) => {
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
    roster: updateEntityInList(state.roster, warriorId, (w) => ({
      ...w,
      fame: Math.max(0, w.fame + fameDelta),
      popularity: Math.max(0, w.popularity + popDelta),
      career: {
        ...w.career,
        wins: w.career.wins + (won ? 1 : 0),
        losses: w.career.losses + (won ? 0 : 1),
        kills: w.career.kills + (killed ? 1 : 0),
      },
    })),
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
    isDead: true,
    dateOfDeath: `Week ${state.week}, ${state.season}`,
    causeOfDeath: cause,
  };
  return {
    ...state,
    roster: state.roster.filter((w) => w.id !== warriorId),
    graveyard: [...state.graveyard, dead],
    unacknowledgedDeaths: [...(state.unacknowledgedDeaths || []), warriorId],
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


export function clearResolutionPhase(state: GameState): GameState {
  return {
    ...state,
    phase: "planning",
    pendingResolutionData: undefined,
  };
}

/**
 * Initialize the player's stable name and starting gold.
 * Used at the very start of the FTUE.
 */
export function initializeStable(state: GameState, name: string, stableName: string): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      name,
      stableName,
    },
    gold: 500, // Starting gold
  };
}

/**
 * Draft the initial roster from the orphanage.
 * Moves selected warriors to the roster and completes the FTUE.
 */
export function draftInitialRoster(state: GameState, warriors: Warrior[]): GameState {
  return {
    ...state,
    roster: warriors,
    isFTUE: false,
    ftueComplete: true,
  };
}

/** Update a warrior's equipment loadout */
export function updateWarriorEquipment(
  state: GameState,
  warriorId: string,
  equipment: {
    weapon: string;
    armor: string;
    shield: string;
    helm: string;
  }
): GameState {
  return {
    ...state,
    roster: updateEntityInList(state.roster, warriorId, (w) => ({ ...w, equipment })),
  };
}
