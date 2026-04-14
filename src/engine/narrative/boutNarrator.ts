import { CombatNarrator } from "./combatNarrator";
import { StatusNarrator } from "./statusNarrator";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

/**
 * BoutNarrator - Intro, opener, and conclusion narration.
 * Handles bout-level narrative generation.
 */
export class BoutNarrator {
  /**
   * Delegates to CombatNarrator for warrior intro.
   */
  static generateWarriorIntro(rng: IRNGService, data: any, sz?: number): string[] {
    return CombatNarrator.generateWarriorIntro(rng, data, sz);
  }

  /**
   * Delegates to CombatNarrator for battle opener.
   */
  static battleOpener(rng: IRNGService): string {
    return CombatNarrator.battleOpener(rng);
  }

  /**
   * Delegates to CombatNarrator for bout end.
   */
  static narrateBoutEnd(rng: IRNGService, by: string, winnerName: string, loserName: string, weaponId?: string): string[] {
    return CombatNarrator.narrateBoutEnd(rng, by, winnerName, loserName, weaponId);
  }
}
