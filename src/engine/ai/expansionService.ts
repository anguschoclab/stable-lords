import type { GameState, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng";
import { generateRivalStables } from "../rivals";

/**
 * ExpansionService - Handles stable expansion.
 * Manages generation of new rival stables.
 */
export class ExpansionService {
  /**
   * Processes expansion by generating new rival stables.
   * Adds new stables to maintain world population.
   */
  static processExpansion(state: GameState, rng: IRNGService, targetCount: number = 8, legacyCandidates?: { name: string; stableName: string }[]): { updatedState: GameState; newStables: RivalStableData[] } {
    let updatedState = { ...state };
    const currentCount = updatedState.rivals?.length || 0;
    
    if (currentCount >= targetCount) {
      return { updatedState, newStables: [] };
    }

    const neededCount = targetCount - currentCount;
    const newStables: RivalStableData[] = [];

    for (let i = 0; i < neededCount; i++) {
      if (rng.next() < 0.3) {
        const legacy = legacyCandidates?.shift();
        const [newStable] = generateRivalStables(1, Math.floor(rng.next() * 10001), state.week);
        
        if (legacy) {
          newStable.owner.name = legacy.name;
          newStable.owner.stableName = legacy.stableName;
          newStable.owner.personality = "Aggressive"; // Legends are often aggressive
        }

        newStables.push(newStable);
      }
    }

    updatedState.rivals = [...(updatedState.rivals || []), ...newStables];

    return { updatedState, newStables };
  }
}
