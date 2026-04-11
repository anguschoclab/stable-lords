import narrativeContent from "@/data/narrativeContent.json";
import { pick } from "./narrativeUtils";
import type { IRNGService } from "@/engine/core/rng";

export interface CombatContext {
  attacker?: string;
  defender?: string;
  name?: string;
  weapon?: string;
  bodyPart?: string;
  hits?: string | number;
  winner?: string;
  loser?: string;
}

/**
 * NarrativeTemplateEngine - Template interpolation and archive access.
 * Handles all narrative content retrieval and token replacement.
 */
export class NarrativeTemplateEngine {
  /**
   * Replaces canonical tokens (%A, %D, %W, %BP, %H) with contextual values.
   */
  static interpolateTemplate(template: string, ctx: CombatContext): string {
    if (!template) return "No description available.";
    return template
      .replace(/%A/g, ctx.attacker || ctx.name || "The warrior")
      .replace(/%D/g, ctx.defender || "the opponent")
      .replace(/%W/g, ctx.weapon || "weapon")
      .replace(/%BP/g, ctx.bodyPart || "body")
      .replace(/%H/g, String(ctx.hits || ""))
      .replace(/%WINNER/g, ctx.winner || "the winner")
      .replace(/%LOSER/g, ctx.loser || "the loser");
  }

  /**
   * Safely picks a template from the JSON archive or returns a generic fallback.
   */
  static getFromArchive(rng: IRNGService, path: string[]): string {
    try {
      let current: any = narrativeContent;
      for (const key of path) {
        current = current[key];
      }
      if (Array.isArray(current) && current.length > 0) {
        return rng.pick(current);
      }
    } catch (e) {
      console.error(`Narrative Archive Error: Missing path ${path.join(".")}`);
    }
    return "A fierce exchange occurs."; // Ultimate fallback
  }
}
