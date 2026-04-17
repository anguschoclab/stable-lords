import type { FightPlan, PlanCondition, ConditionTriggerType, PsychState } from "@/types/shared.types";
import type { FighterState, ResolutionContext } from "./resolution";

/**
 * Returns the number of exchanges between condition re-evaluations based on WT (Wit) stat.
 * Higher WT = faster adaptation.
 */
function evaluationInterval(wt: number): number {
  if (wt >= 7) return 1;  // Evaluate every exchange
  if (wt >= 4) return 3;  // Every 3 exchanges
  return 5;               // Slow — every 5 exchanges
}

/**
 * Returns true when the given trigger condition is satisfied.
 */
function conditionMet(
  trigger: PlanCondition["trigger"],
  fighter: FighterState,
  opponent: FighterState,
  ctx: ResolutionContext
): boolean {
  const { type, value } = trigger;
  switch (type as ConditionTriggerType) {
    case "HP_BELOW":
      return fighter.hp / fighter.maxHp < Number(value);
    case "HP_ABOVE":
      return fighter.hp / fighter.maxHp > Number(value);
    case "MOMENTUM_LEAD":
      return fighter.momentum >= Number(value);
    case "MOMENTUM_DEFICIT":
      return fighter.momentum <= -Number(value);
    case "PHASE_IS": {
      const phaseMap: Record<string, ResolutionContext["phase"]> = {
        opening: "OPENING", mid: "MID", late: "LATE",
        OPENING: "OPENING", MID: "MID", LATE: "LATE",
      };
      return ctx.phase === (phaseMap[String(value)] ?? value);
    }
    case "ENDURANCE_BELOW":
      return fighter.endurance / fighter.maxEndurance < Number(value);
    default:
      return false;
  }
}

/**
 * Derives a fighter's current psychological state from fight metrics.
 */
export function derivePsychState(fighter: FighterState, opponent: FighterState): PsychState {
  const hpRatio = fighter.hp / fighter.maxHp;
  const endRatio = fighter.endurance / fighter.maxEndurance;

  if (hpRatio < 0.3) return "Desperate";

  if (fighter.momentum >= 2 && hpRatio > 0.7) return "InTheZone";

  // Rattled: opponent landed 3+ consecutive hits while fighter landed none recently
  if (opponent.consecutiveHits >= 3 && fighter.consecutiveHits === 0) return "Rattled";

  // Cruising: clearly ahead on hits and still has stamina
  if (fighter.hitsLanded > fighter.hitsTaken * 1.5 && endRatio > 0.6 && fighter.hitsLanded >= 3) {
    return "Cruising";
  }

  return "Neutral";
}

/**
 * Evaluates the fighter's PlanConditions (WT-gated) and returns the active plan
 * and current psychological state for this exchange.
 */
export function evaluateConditions(
  fighter: FighterState,
  opponent: FighterState,
  ctx: ResolutionContext,
  wt: number
): { newPlan: FightPlan; psychState: PsychState } {
  const psychState = derivePsychState(fighter, opponent);

  // WT gates how frequently conditions are re-evaluated
  if (ctx.exchange % evaluationInterval(wt) !== 0) {
    return { newPlan: fighter.activePlan, psychState };
  }

  const conditions = fighter.plan.conditions;
  if (conditions && conditions.length > 0) {
    for (const cond of conditions) {
      if (conditionMet(cond.trigger, fighter, opponent, ctx)) {
        return { newPlan: { ...fighter.plan, ...cond.override }, psychState };
      }
    }
  }

  // No condition fired — revert to base plan
  return { newPlan: fighter.plan, psychState };
}

/**
 * Psych state modifiers applied to skill rolls in resolveExchange.
 */
export const PSYCH_STATE_MODS: Record<PsychState, { attMod: number; iniMod: number; defMod: number; parMod: number; decMod: number; enduranceCostMult: number }> = {
  Neutral:   { attMod: 0,  iniMod: 0,  defMod: 0,  parMod: 0,  decMod: 0,  enduranceCostMult: 1.0  },
  InTheZone: { attMod: 5,  iniMod: 3,  defMod: 0,  parMod: 0,  decMod: 0,  enduranceCostMult: 1.0  },
  Rattled:   { attMod: 0,  iniMod: 0,  defMod: -5, parMod: -3, decMod: 0,  enduranceCostMult: 1.0  },
  Desperate: { attMod: -3, iniMod: -3, defMod: -3, parMod: -3, decMod: -5, enduranceCostMult: 1.0  },
  Cruising:  { attMod: 0,  iniMod: 0,  defMod: 0,  parMod: 0,  decMod: 0,  enduranceCostMult: 0.9  },
};
