import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import { checkWeaponRequirements, DEFAULT_LOADOUT } from '@/data/equipment';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — Equipment Pipeline Pass
 * Handles AI equipment optimization for rival stables.
 */
export function runEquipmentPass(state: GameState): StateImpact {
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();

  (state.rivals || []).forEach((rival) => {
    let changed = false;
    const updatedRoster = rival.roster.map((warrior) => {
      const fav = warrior.favorites;
      if (!fav || !fav.weaponId || !fav.discovered?.weapon) return warrior;

      const favId = fav.weaponId;
      const currentEquip = warrior.equipment || DEFAULT_LOADOUT;
      if (currentEquip.weapon === favId) return warrior;

      const req = checkWeaponRequirements(favId, warrior.attributes);
      if (req.attPenalty < -4) return warrior;

      changed = true;
      return { ...warrior, equipment: { ...currentEquip, weapon: favId } };
    });

    if (changed) {
      // Key by rival.id (StableId) — rivalsUpdates handler in impacts.ts indexes by r.id.
      rivalsUpdates.set(rival.id as StableId, { roster: updatedRoster });
    }
  });

  return { rivalsUpdates };
}
