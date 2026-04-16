import type { GameState, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { generateRivalStables } from "../rivals";
import { inheritCrest } from "../crest/crestGenerator";

/**
 * ExpansionService - Handles stable expansion.
 * Manages generation of new rival stables.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ExpansionService {
  /**
   * Processes expansion by generating new rival stables.
   * Adds new stables to maintain world population.
   * Supports crest inheritance for legacy stables (retired warriors founding new stables).
   */
  static processExpansion(
    state: GameState,
    rng: IRNGService,
    targetCount: number = 8,
    legacyCandidates?: { name: string; stableName: string; parentStableId?: string }[]
  ): { updatedState: GameState; newStables: RivalStableData[] } {
    const updatedState = { ...state };
    const currentCount = updatedState.rivals?.length || 0;
    
    if (currentCount >= targetCount) {
      return { updatedState, newStables: [] };
    }

    const neededCount = targetCount - currentCount;
    const newStables: RivalStableData[] = [];

    for (let i = 0; i < neededCount; i++) {
      if (rng.next() < 0.3) {
        const legacy = legacyCandidates?.shift();
        const generatedStables = generateRivalStables(1, Math.floor(rng.next() * 10001), state.week);
        const newStable = generatedStables[0];
        
        if (newStable && legacy) {
          // Set legacy founder details
          newStable.owner.name = legacy.name;
          newStable.owner.stableName = legacy.stableName;
          newStable.owner.personality = "Aggressive"; // Legends are often aggressive
          
          // Find parent stable for crest inheritance
          let parentCrest = undefined;
          let parentGeneration = 0;
          
          if (legacy.parentStableId) {
            const parentStable = state.rivals?.find(r => r.id === legacy.parentStableId);
            if (parentStable?.crest) {
              parentCrest = parentStable.crest;
              parentGeneration = parentStable.owner?.generation ?? 0;
            }
          }
          
          // Inherit or generate crest
          if (parentCrest) {
            const crestSeed = Math.floor(rng.next() * 100000);
            newStable.crest = inheritCrest(parentCrest, crestSeed);
            newStable.owner.generation = parentGeneration + 1;
          } else {
            // Generate new crest for legacy founder without parent
            const crestSeed = Math.floor(rng.next() * 100000);
            newStable.crest = inheritCrest(
              newStable.crest!,
              crestSeed
            );
            newStable.owner.generation = 1;
          }
        }

        if (newStable) {
          newStables.push(newStable);
        }
      }
    }

    updatedState.rivals = [...(updatedState.rivals || []), ...newStables];

    return { updatedState, newStables };
  }
}
