import type { GameState, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * SeasonalRetirementService - Handles retirement and legacy founder system.
 * Manages seasonal retirement for all rivals and legacy founders.
 */

interface LegacyCandidate {
  name: string;
  stableName: string;
  parentStableId?: string; // 🛡️ Track parent stable for crest inheritance
  warriorId?: string; // Lineage breadcrumb — mirrors Trainer.retiredFromWarrior
  fightingStyle?: import('@/types/shared.types').FightingStyle;
}

export class SeasonalRetirementService {
  private constructor() {}
  /**
   * Processes seasonal retirement for all rival stables.
   * Handles legacy founders (retired warriors becoming owners).
   */
  static processSeasonalRetirement(
    state: GameState,
    rng: IRNGService
  ): { updatedState: GameState; legacyCandidates: LegacyCandidate[] } {
    const updatedState = { ...state };
    const legacyCandidates: LegacyCandidate[] = [];

    updatedState.rivals = (updatedState.rivals || []).map((rival) => {
      // Retirement logic for warriors
      const retiredWarriors = (rival.roster || []).filter((w) => {
        if (w.status !== 'Active') return false;

        const age = w.age ?? 20;
        const retireChance = age >= 40 ? 1 : age >= 30 ? (age - 30) * 0.05 : 0;

        if (rng.next() < retireChance) {
          return true; // Mark for retirement
        }
        return false;
      });

      if (retiredWarriors.length > 0) {
        retiredWarriors.forEach((w) => {
          // Check if warrior could become a legacy founder
          if (w.fame >= 90 && (w.career?.wins || 0) >= 50 && rng.next() < 0.25) {
            const newStableName = `${w.name}'s Academy`;
            legacyCandidates.push({
              name: w.name,
              stableName: newStableName,
              parentStableId: rival.id, // 🛡️ Track parent for crest inheritance
              warriorId: w.id,
              fightingStyle: w.style,
            });
          }
        });
      }

      return {
        ...rival,
        roster: rival.roster.map((w) => {
          if (w.status !== 'Active') return w;

          const age = w.age ?? 20;
          const retireChance = age >= 40 ? 1 : age >= 30 ? (age - 30) * 0.05 : 0;

          if (rng.next() < retireChance) {
            return { ...w, status: 'Retired', retiredWeek: state.week };
          }
          return w;
        }),
      };
    });

    return { updatedState, legacyCandidates };
  }
}
