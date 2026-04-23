import type { GameState, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { IRNGContext } from '@/engine/core/rng/IRNGContext';

// Import extracted modules
import { SeasonalRetirementService } from './seasonalRetirementService';
import { BankruptcyService } from './bankruptcyService';
import { ExpansionService } from './expansionService';

/**
 * WorldManagementService - Orchestrates stable bankruptcy, world-wide retirement,
 * and the 'Legacy Founder' (retired warrior to owner) system.
 * Facade that delegates to extracted modules.
 */
export const WorldManagementService = {
  // Store candidates between ticks if needed, or just process immediately
  legacyCandidates: [] as { name: string; stableName: string }[],

  /**
   * Processes the seasonal 'Churn' (Bankruptcy and Expansion).
   * Typically runs on Week 13/26/39/52.
   */
  processSeasonalChurn(
    state: GameState,
    rngContext: IRNGContext
  ): { updatedRivals: RivalStableData[]; news: string[] } {
    let updatedState = { ...state };
    const news: string[] = [];

    // Retirement
    const rng = rngContext.getRNG();
    const { updatedState: retirementState, legacyCandidates } =
      SeasonalRetirementService.processSeasonalRetirement(updatedState, rng);
    updatedState = retirementState;

    // Handle legacy founders news
    legacyCandidates.forEach((lc) => {
      news.push(`🏆 LEGENDARY FOUNDER: ${lc.name} has founded ${lc.stableName}!`);
      this.legacyCandidates.push({ name: lc.name, stableName: lc.stableName });
    });

    // Bankruptcy
    const { updatedState: bankruptcyState, bankruptStables } = BankruptcyService.processBankruptcy(
      updatedState,
      rng
    );
    updatedState = bankruptcyState;

    bankruptStables.forEach((stableName) => {
      news.push(`📉 COLLAPSE: ${stableName} has shuttered its doors due to financial insolvency.`);
    });

    // 3. Process Expansion
    const expansionRng = rngContext.createChild(100).getRNG();
    const { updatedState: expansionState, newStables } = ExpansionService.processExpansion(
      updatedState,
      expansionRng,
      45,
      this.legacyCandidates
    );
    updatedState = expansionState;

    newStables.forEach((ns) => {
      const isLegacy = this.legacyCandidates.some((lc) => lc.name === ns.owner.name);
      if (!isLegacy) {
        news.push(
          `🆕 RECRUITMENT: ${ns.owner.stableName} has been granted an arena license as a new Minor rival!`
        );
      }
    });

    return { updatedRivals: updatedState.rivals || [], news };
  },
};
