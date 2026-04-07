import type { FightOutcome } from "@/types/combat.types";
import { type FighterState, DECISION_HIT_MARGIN } from "../combat/resolution";

/**
 * Handles decision points at the end of a fight when the time limit is reached.
 */
export function resolveDecision(
  fA: FighterState, 
  fD: FighterState, 
  nameA: string, 
  nameD: string
): { winner: "A" | "D" | null, by: FightOutcome["by"], narrative: string } {
    if (fA.hitsLanded > fD.hitsLanded + DECISION_HIT_MARGIN) {
      return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} is awarded the decision on points.` };
    } 
    if (fD.hitsLanded > fA.hitsLanded + DECISION_HIT_MARGIN) {
      return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} is awarded the decision on points.` };
    } 
    if (fA.hp > fD.hp) {
      return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} wins a close decision.` };
    } 
    if (fD.hp > fA.hp) {
      return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} wins a close decision.` };
    }
    return { winner: null, by: "Draw", narrative: `Time! The Arenamaster declares a draw.` };
}
