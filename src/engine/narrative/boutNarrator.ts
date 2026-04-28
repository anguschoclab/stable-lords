import { CombatNarrator } from './combatNarrator';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/game';

/**
 * BoutNarrator - Intro, opener, and conclusion narration.
 * Handles bout-level narrative generation.
 */
export const BoutNarrator = {
  /**
   * Delegates to CombatNarrator for warrior intro.
   */
  generateWarriorIntro(rng: IRNGService, data: Warrior, sz?: number): string[] {
    return CombatNarrator.generateWarriorIntro(rng, data, sz);
  },

  /**
   * Delegates to CombatNarrator for battle opener.
   */
  battleOpener(rng: IRNGService): string {
    return CombatNarrator.battleOpener(rng);
  },

  /**
   * Delegates to CombatNarrator for bout end.
   */
  narrateBoutEnd(
    rng: IRNGService,
    by: string,
    winnerName: string,
    loserName: string,
    weaponId?: string
  ): string[] {
    return CombatNarrator.narrateBoutEnd(rng, by, winnerName, loserName, weaponId);
  }
} as const;
