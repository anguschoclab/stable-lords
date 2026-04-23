import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { updateEntityInList } from '@/utils/stateUtils';
import { StateImpact } from '@/engine/impacts';

export interface EntityUpdateMaps {
  rosterUpdates: Map<string, Partial<Warrior>>;
  rivalsUpdates: Map<string, Partial<RivalStableData>>;
}

/**
 * Create update maps for roster and rivals
 */
export function createUpdateMaps(): EntityUpdateMaps {
  return {
    rosterUpdates: new Map<string, Partial<Warrior>>(),
    rivalsUpdates: new Map<string, Partial<RivalStableData>>(),
  };
}

/**
 * Update a warrior entity, routing to the correct map (roster or rival)
 */
export function updateEntity(
  warriorId: string,
  update: Partial<Warrior>,
  state: GameState,
  maps: EntityUpdateMaps,
  rivalStableId?: string
): void {
  const isPlayer = state.roster.some((w) => w.id === warriorId);

  if (isPlayer) {
    const existing = maps.rosterUpdates.get(warriorId) || {};
    maps.rosterUpdates.set(warriorId, { ...existing, ...update });
  } else if (rivalStableId) {
    const rival = (state.rivals || []).find((r) => r.owner.id === rivalStableId);
    if (rival) {
      const existingRivalUpdate = maps.rivalsUpdates.get(rivalStableId) || {};
      const updatedRoster = updateEntityInList(rival.roster, warriorId, (w) => ({
        ...w,
        ...update,
      }));
      maps.rivalsUpdates.set(rivalStableId, { ...existingRivalUpdate, roster: updatedRoster });
    }
  }
}

/**
 * Apply entity updates to state and return StateImpact
 */
export function applyEntityUpdates(maps: EntityUpdateMaps): StateImpact {
  return {
    rosterUpdates: maps.rosterUpdates,
    rivalsUpdates: maps.rivalsUpdates,
  };
}
