import { type GameState, type Warrior, type DeathEvent } from "@/types/game";
import { updateEntityInList } from "@/utils/stateUtils";

/**
 * Stable Lords — Roster Mutations
 * Logic for managing warrior lifecycle transitions.
 */

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
    for (const rival of (nextState.rivals || [])) {
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
