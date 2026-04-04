import { type GameState, type Warrior, type FightSummary, type DeathEvent } from "@/types/game";
import { advanceWeek as runPipeline } from "@/engine/weekPipeline";
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
 * Advance the game by one week using the consolidated engine pipeline.
 * All logic has been migrated to the engine layer to improve testability.
 */
export function advanceWeek(state: GameState): GameState {
  return runPipeline(state);
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
  popDelta: number,
  rivalStableId?: string
): GameState {
  if (rivalStableId) {
    return {
      ...state,
      rivals: (state.rivals || []).map(r => r.owner.id === rivalStableId
        ? {
            ...r,
            roster: updateEntityInList(r.roster, warriorId, (w) => ({
              ...w,
              fame: Math.max(0, (w.fame || 0) + fameDelta),
              popularity: Math.max(0, (w.popularity || 0) + popDelta),
              career: {
                ...w.career,
                wins: (w.career?.wins || 0) + (won ? 1 : 0),
                losses: (w.career?.losses || 0) + (won ? 0 : 1),
                kills: (w.career?.kills || 0) + (killed ? 1 : 0),
              },
            }))
          }
        : r)
    };
  }

  return {
    ...state,
    roster: updateEntityInList(state.roster, warriorId, (w) => ({
      ...w,
      fame: Math.max(0, (w.fame || 0) + fameDelta),
      popularity: Math.max(0, (w.popularity || 0) + popDelta),
      career: {
        ...w.career,
        wins: (w.career?.wins || 0) + (won ? 1 : 0),
        losses: (w.career?.losses || 0) + (won ? 0 : 1),
        kills: (w.career?.kills || 0) + (killed ? 1 : 0),
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
  let victim: Warrior | undefined = state.roster.find((w) => w.id === warriorId);
  const nextState = { ...state };

  if (victim) {
    nextState.roster = state.roster.filter((w) => w.id !== warriorId);
  } else {
    // Check Rivals
    for (const rival of (state.rivals || [])) {
      victim = rival.roster.find(w => w.id === warriorId);
      if (victim) {
        nextState.rivals = (nextState.rivals || []).map(r => r.owner.id === rival.owner.id 
          ? { ...r, roster: r.roster.filter(w => w.id !== warriorId) }
          : r);
        break;
      }
    }
  }

  if (!victim) return state;

  const dead: Warrior = {
    ...victim,
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
    ...nextState,
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
  },
  rivalStableId?: string
): GameState {
  if (rivalStableId) {
    return {
      ...state,
      rivals: (state.rivals || []).map(r => r.owner.id === rivalStableId
        ? { ...r, roster: updateEntityInList(r.roster, warriorId, (w) => ({ ...w, equipment })) }
        : r)
    };
  }
  return {
    ...state,
    roster: updateEntityInList(state.roster, warriorId, (w) => ({ ...w, equipment })),
  };
}
