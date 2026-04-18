/**
 * Strategy Validator — returns non-blocking soft warnings about a FightPlan.
 * Kept pure + deterministic so both the UI (PlanBuilder) and the AI planner
 * can consume the same ruleset.
 */
import type { FightPlan, Warrior, PhaseStrategy } from "@/types/shared.types";
import { FightingStyle } from "@/types/shared.types";

export type WarningSeverity = "info" | "warn" | "error";

export interface StrategyWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
}

const HIGH = 8;
const LOW = 3;

export function validateStrategy(plan: FightPlan, warrior?: Warrior): StrategyWarning[] {
  const out: StrategyWarning[] = [];
  const OE = plan.OE ?? 5;
  const AL = plan.AL ?? 5;
  const KD = plan.killDesire ?? 5;

  // Global effort balance
  if (OE >= HIGH && AL >= HIGH) {
    out.push({
      code: "OVER_EXERTION",
      severity: "warn",
      message: "Both OE and AL are very high — warrior will burn endurance fast.",
    });
  }
  if (OE <= LOW && AL <= LOW) {
    out.push({
      code: "PASSIVE_PLAN",
      severity: "warn",
      message: "Both OE and AL are very low — expect a slow, indecisive fight.",
    });
  }
  if (KD >= 9 && AL <= 3) {
    out.push({
      code: "LETHAL_UNDEFENDED",
      severity: "warn",
      message: "High kill desire with low defence — glass-cannon posture.",
    });
  }

  // Style vs. posture sanity
  if ((plan.style === FightingStyle.TotalParry || plan.style === FightingStyle.WallOfSteel) && OE >= HIGH) {
    out.push({
      code: "STYLE_MISMATCH_OE",
      severity: "warn",
      message: `${plan.style} is a defensive style but OE is aggressive.`,
    });
  }
  if (plan.style === FightingStyle.BashingAttack && AL >= HIGH) {
    out.push({
      code: "STYLE_MISMATCH_AL",
      severity: "info",
      message: "Bashing attack rarely leans this heavily on defence.",
    });
  }

  // Attribute fit — endurance-heavy plan vs. low WT warrior
  if (warrior?.attributes) {
    const wt = warrior.attributes.WT ?? 10;
    if (wt < 10 && OE + AL >= 16) {
      out.push({
        code: "WT_TOO_LOW_FOR_EFFORT",
        severity: "warn",
        message: `Low WT (${wt}) may collapse before this effort pays off.`,
      });
    }
  }

  // Per-phase sanity
  const phases = plan.phases ?? {};
  const phaseNames = ["opening", "mid", "late"] as const;
  for (const p of phaseNames) {
    const ps = phases[p] as PhaseStrategy | undefined;
    if (!ps) continue;
    if ((ps.OE ?? 5) >= 10 && (ps.AL ?? 5) >= 10) {
      out.push({
        code: `PHASE_${p.toUpperCase()}_SATURATED`,
        severity: "warn",
        message: `${p} phase is capped on both OE and AL — unsustainable.`,
      });
    }
  }

  return out;
}

/**
 * Per-minute endurance-burn estimate used by the stamina curve preview.
 * Deterministic, decoupled from the full sim: intended as a UI heuristic only.
 */
export function estimateStaminaCurve(plan: FightPlan, warrior?: Warrior, minutes = 20): number[] {
  const wt = warrior?.attributes?.WT ?? 10;
  const max = 50 + wt * 2;
  let cur = max;
  const out: number[] = [cur];
  const phases = plan.phases ?? {};
  for (let m = 1; m <= minutes; m++) {
    const phaseKey = m <= 5 ? "opening" : m <= 14 ? "mid" : "late";
    const ps = (phases as Record<string, PhaseStrategy | undefined>)[phaseKey];
    const OE = ps?.OE ?? plan.OE ?? 5;
    const AL = ps?.AL ?? plan.AL ?? 5;
    // Baseline burn: scales with combined effort, softened by WT.
    const burn = 0.6 + (OE + AL) * 0.18 - Math.max(0, (wt - 10) * 0.04);
    cur = Math.max(0, cur - burn);
    out.push(cur);
  }
  return out;
}
