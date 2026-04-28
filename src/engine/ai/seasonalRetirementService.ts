import type { GameState } from '@/types/state.types';
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

export const SeasonalRetirementService = {
  /**
   * Processes seasonal retirement for all rival stables.
   * Handles legacy founders (retired warriors becoming owners).
   */
  processSeasonalRetirement(
    state: GameState,
    rng: IRNGService
  ): { updatedState: GameState; legacyCandidates: LegacyCandidate[] } {
    const updatedState = { ...state };
    const legacyCandidates: LegacyCandidate[] = [];

    updatedState.rivals = (updatedState.rivals || []).map((rival) => {
      // Roll retirement decisions exactly once per warrior — prevents the
      // double-roll bug where the pre-filter and the roster-map each consumed
      // a separate RNG call, making the probability effectively roll twice.
      const retireDecisions = new Map<string, boolean>();
      for (const w of rival.roster) {
        if (w.status !== 'Active') continue;
        const age = w.age ?? 20;
        const retireChance = age >= 40 ? 1 : age >= 30 ? (age - 30) * 0.05 : 0;
        retireDecisions.set(w.id, rng.next() < retireChance);
      }

      const retiredWarriors = (rival.roster || []).filter(
        (w) => w.status === 'Active' && retireDecisions.get(w.id) === true
      );

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

      return {
        ...rival,
        roster: rival.roster.map((w) => {
          if (retireDecisions.get(w.id)) {
            return { ...w, status: 'Retired', retiredWeek: state.week };
          }
          return w;
        }),
      };
    });

    return { updatedState, legacyCandidates };
  }
} as const;
