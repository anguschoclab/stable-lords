import { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { checkWeaponRequirements, DEFAULT_LOADOUT } from "@/data/equipment";

/**
 * Stable Lords — Equipment Pipeline Pass
 * Handles AI equipment optimization for rival stables.
 */
export const PASS_METADATA = {
  name: "EquipmentPass",
  dependencies: ["WarriorPass"] // Depends on warrior roster updates
};

/**
 * Stable Lords — Equipment Pipeline Pass
 * Handles AI equipment optimization for rival stables.
 * AI will prioritize equipping 'discovered' favorite weapons and 
 * rhythms, provided they meet the attribute requirements.
 */
export function runEquipmentPass(state: GameState): GameState {
  const updatedRivals = (state.rivals || []).map((rival) => {
    const updatedRoster = rival.roster.map((warrior) => {
      // 1. Check for discovered favorite weapon
      const fav = warrior.favorites;
      if (!fav || !fav.weaponId || !fav.discovered?.weapon) {
        return warrior;
      }

      const favId = fav.weaponId;
      const currentEquip = warrior.equipment || DEFAULT_LOADOUT;

      // 2. If already equipped, no action needed
      if (currentEquip.weapon === favId) {
        return warrior;
      }

      // 3. "Honest AI" Check: Can they actually wield their favorite?
      const req = checkWeaponRequirements(favId, warrior.attributes);
      
      if (req.attPenalty < -4) {
        return warrior; 
      }

      // 4. Optimal Gear switch: Use the favorite
      return {
        ...warrior,
        equipment: {
          ...currentEquip,
          weapon: favId
        }
      };
    });

    return { ...rival, roster: updatedRoster };
  });

  return { ...state, rivals: updatedRivals };
}
