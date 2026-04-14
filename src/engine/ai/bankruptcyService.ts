import type { GameState, Warrior, NewsletterItem } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import type { StateImpact } from "@/engine/impacts";

/**
 * BankruptcyService - Handles bankruptcy detection and processing.
 * Manages rival stable bankruptcy and removal, and player bankruptcy consequences.
 */
export class BankruptcyService {
  /**
   * Processes bankruptcy for all rival stables.
   * Removes stables that have gone bankrupt.
   */
  static processBankruptcy(state: GameState, _rng: IRNGService): { updatedState: GameState; bankruptStables: string[] } {
    const BANKRUPTCY_THRESHOLD = -500;
    const updatedState = { ...state };
    const bankruptStables: string[] = [];

    updatedState.rivals = updatedState.rivals.filter(rival => {
      if (rival.treasury < BANKRUPTCY_THRESHOLD) {
        bankruptStables.push(rival.owner.stableName);
        return false;
      }
      return true;
    });

    return { updatedState, bankruptStables };
  }

  /**
   * Processes player bankruptcy consequences.
   * If treasury < -500, force sell highest-fame warrior, reduce reputation, generate newsletter.
   * Returns StateImpact for integration with the pipeline.
   */
  static processPlayerBankruptcy(state: GameState, rng: IRNGService): { bankrupt: boolean; impact: StateImpact; soldWarrior?: Warrior } {
    const BANKRUPTCY_THRESHOLD = -500;

    if (state.treasury >= BANKRUPTCY_THRESHOLD) {
      return { bankrupt: false, impact: {} };
    }

    const impact: StateImpact = {};

    // Find highest-fame warrior to sell
    const highestFameWarrior = state.roster.reduce((highest: Warrior | null, warrior: Warrior) => {
      if (!highest || (warrior.fame || 0) > (highest.fame || 0)) {
        return warrior;
      }
      return highest;
    }, null);

    if (highestFameWarrior) {
      // Remove warrior from roster
      impact.rosterRemovals = [highestFameWarrior.id];

      // Add to treasury (sell value = fame * 10)
      const sellValue = (highestFameWarrior.fame || 0) * 10;

      // Reduce reputation by 50
      const popularityDelta = -50;

      // Generate newsletter item
      const newsletterItem: NewsletterItem = {
        id: rng.uuid("newsletter"),
        week: state.week,
        title: "Bankruptcy Crisis",
        items: [
          `Your stable has gone bankrupt with treasury at ${state.treasury}g.`,
          `${highestFameWarrior.name} has been sold for ${sellValue}g to cover debts.`,
          `Your reputation has suffered (-50 popularity).`
        ]
      };

      impact.treasuryDelta = sellValue;
      impact.popularityDelta = popularityDelta;
      impact.newsletterItems = [newsletterItem];

      return { bankrupt: true, impact, soldWarrior: highestFameWarrior };
    }

    // No warriors to sell - just reduce reputation
    const newsletterItem: NewsletterItem = {
      id: rng.uuid("newsletter"),
      week: state.week,
      title: "Bankruptcy Crisis",
      items: [
        `Your stable has gone bankrupt with treasury at ${state.treasury}g.`,
        `With no warriors to sell, your reputation has suffered (-50 popularity).`,
        `Consider taking a loan to avoid future bankruptcy.`
      ]
    };

    impact.popularityDelta = -50;
    impact.newsletterItems = [newsletterItem];

    return { bankrupt: true, impact };
  }
}
