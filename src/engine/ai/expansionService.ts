import type { GameState, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { generateRivalStables } from '../rivals';
import { inheritCrest } from '../crest/crestGenerator';
import { BACKSTORIES } from '@/data/backstories';
import type { FightingStyle } from '@/types/shared.types';

/**
 * ExpansionService - Handles stable expansion.
 * Manages generation of new rival stables.
 */
export class ExpansionService {
  private constructor() {}
  /**
   * Processes expansion by generating new rival stables.
   * Adds new stables to maintain world population.
   * Supports crest inheritance for legacy stables (retired warriors founding new stables).
   */
  static processExpansion(
    state: GameState,
    rng: IRNGService,
    targetCount: number = 8,
    legacyCandidates?: {
      name: string;
      stableName: string;
      parentStableId?: string;
      warriorId?: string;
      fightingStyle?: FightingStyle;
    }[]
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
        const generatedStables = generateRivalStables(
          1,
          Math.floor(rng.next() * 10001),
          state.week
        );
        const newStable = generatedStables[0];

        if (newStable && legacy) {
          // Set legacy founder details
          newStable.owner.name = legacy.name;
          newStable.owner.stableName = legacy.stableName;
          newStable.owner.backstoryId = 'gladiator'; // Legacy founders are former arena warriors
          newStable.owner.foundedByWarriorId = legacy.warriorId;
          // Derive personality/favoredStyles from the backstory seed + warrior's style
          // rather than hardcoding "Aggressive" for every legacy founder.
          const seedBasis = legacy.warriorId ?? legacy.name;
          const seedRng = new SeededRNGService(
            seedBasis.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
          );
          const gladDef = BACKSTORIES.gladiator;
          const personalityEntries = Object.entries(gladDef.identitySeed.personalityWeights) as [
            NonNullable<typeof newStable.owner.personality>,
            number,
          ][];
          const totalP = personalityEntries.reduce((s, [, w]) => s + w, 0);
          let rollP = seedRng.next() * totalP;
          for (const [key, w] of personalityEntries) {
            rollP -= w;
            if (rollP <= 0) {
              newStable.owner.personality = key;
              break;
            }
          }
          if (legacy.fightingStyle) {
            newStable.owner.favoredStyles = [legacy.fightingStyle];
          }

          // Find parent stable for crest inheritance
          let parentCrest = undefined;
          let parentGeneration = 0;

          if (legacy.parentStableId) {
            const parentStable = state.rivals?.find((r) => r.id === legacy.parentStableId);
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
            newStable.crest = inheritCrest(newStable.crest!, crestSeed);
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
