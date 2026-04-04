import { type GameState, type Warrior, type FightSummary } from "@/types/game";
import { updateEntityInList, truncateArray } from "@/utils/stateUtils";

/**
 * Stable Lords — World Mutations
 * Logic for systemic state transitions.
 */

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

export function clearResolutionPhase(state: GameState): GameState {
  return {
    ...state,
    phase: "planning",
    pendingResolutionData: undefined,
  };
}

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

export function draftInitialRoster(state: GameState, warriors: Warrior[]): GameState {
  return {
    ...state,
    roster: warriors,
    isFTUE: false,
    ftueComplete: true,
  };
}
