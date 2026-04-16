import type { CommitLevel } from "@/types/shared.types";
import type { CombatEvent } from "@/types/combat.types";
import type { FighterState, ResolutionContext } from "./resolution";
import { contestDistance, transitionZone, resetZone } from "./distanceResolution";

// ─── ExchangeState Accumulator ────────────────────────────────────────────────

export interface ExchangeState {
  rangeModA: number;
  rangeModD: number;
  distanceWinner: "A" | "D" | null;
  feintBonus: number;
  feintFailed: boolean;
  commitLevelA: CommitLevel;
  commitLevelD: CommitLevel;
  recoveryDebtToWriteA: number;
  recoveryDebtToWriteD: number;
  events: CombatEvent[];
}

export function makeExchangeState(): ExchangeState {
  return {
    rangeModA: 0, rangeModD: 0, distanceWinner: null,
    feintBonus: 0, feintFailed: false,
    commitLevelA: "Standard", commitLevelD: "Standard",
    recoveryDebtToWriteA: 0, recoveryDebtToWriteD: 0,
    events: [],
  };
}

// ─── Approach Sub-Phase ───────────────────────────────────────────────────────

export function runApproach(
  rng: () => number,
  fA: FighterState,
  fD: FighterState,
  OE_A: number,
  OE_D: number,
  ctx: ResolutionContext & { range: import("@/types/shared.types").DistanceRange },
  es: ExchangeState
): void {
  const result = contestDistance(rng, fA, fD, OE_A, OE_D, ctx.range);
  // rangeModA/D are intentionally 0: the contest winner shifts the range (which
  // matters for weapon range mods), but does NOT grant a flat ATT bonus. A flat
  // bonus is correlated with OE and double-stacks with commit level, breaking balance.
  es.rangeModA = 0;
  es.rangeModD = 0;
  es.distanceWinner = result.distanceWinner;
  es.events.push(...result.events);
  ctx.range = result.newRange;
}

// ─── Feint Sub-Phase ──────────────────────────────────────────────────────────

export interface FeintResult {
  triggered: boolean;
  succeeded?: boolean;
  feintBonus: number;
  feintFailed: boolean;
  events: CombatEvent[];
}

/**
 * Attacker may feint if: WT ≥ 15, feintTendency > 0, OE ≥ 4.
 * roll = WT + feintTendency − AL_def − WT_def × 0.5
 * threshold = clamp(roll / 20, 0.05, 0.95)
 * Success → +4 ATT bonus. Failure → defender gets +2 DEF this exchange.
 */
export function runFeint(
  rng: () => number,
  att: FighterState,
  def: FighterState
): FeintResult {
  const plan = att.activePlan;
  const wt = att.attributes.WT;
  const feintTendency = plan.feintTendency ?? 0;
  const OE = plan.OE;

  if (feintTendency === 0 || wt < 15 || OE < 4) {
    return { triggered: false, feintBonus: 0, feintFailed: false, events: [] };
  }

  const defAL = def.activePlan.AL;
  const defWT = def.attributes.WT;
  const roll = wt + feintTendency - defAL - defWT * 0.5;
  const threshold = Math.max(0.05, Math.min(0.95, roll / 20));
  const succeeded = rng() < threshold;

  const events: CombatEvent[] = [{
    type: succeeded ? "FEINT_SUCCESS" : "FEINT_FAIL",
    actor: att.label,
    target: def.label,
  }];

  return {
    triggered: true,
    succeeded,
    feintBonus: succeeded ? 4 : 0,
    feintFailed: !succeeded,
    events,
  };
}

// ─── Commit Sub-Phase ─────────────────────────────────────────────────────────

export interface CommitResult {
  level: CommitLevel;
  attBonus: number;
  defPenalty: number;
  debtToWrite: number;
}

/**
 * Determines CommitLevel for one fighter.
 * - Cautious (OE≤3 or HP<30%): 0 ATT, +1 DEF penalty, 0 debt
 * - Standard (default):          0 ATT,  0 DEF,          0 debt
 * - Full (OE≥7 or momentum≥2): +2 ATT, −1 DEF penalty,  1 debt
 *   Note: the `committed` flag separately adds +10 ATT / +15 defender bonus
 *   when HP<35% and killDesire≥7 (the all-or-nothing desperate commit).
 */
export function runCommit(fighter: FighterState, OE: number): CommitResult {
  const hpRatio = fighter.hp / fighter.maxHp;
  if (hpRatio < 0.30 || OE <= 3) {
    return { level: "Cautious", attBonus: 0, defPenalty: 1, debtToWrite: 0 };
  }
  if (OE >= 7 || fighter.momentum >= 2) {
    return { level: "Full", attBonus: 1, defPenalty: -1, debtToWrite: 1 };
  }
  return { level: "Standard", attBonus: 0, defPenalty: 0, debtToWrite: 0 };
}

// ─── Recovery Sub-Phase ───────────────────────────────────────────────────────

/**
 * Writes recovery debt to fighters and handles zone transitions.
 * Debt rule: take Math.min(3, Math.max(existing, toWrite)). Decays by 1 if toWrite=0.
 * Zone rule: fighter that took a hit gets pushed back one zone.
 * If no hit landed, zone drifts back toward Center.
 */
export function runRecovery(
  fA: FighterState,
  fD: FighterState,
  debtToWriteA: number,
  debtToWriteD: number,
  events: CombatEvent[],
  ctx?: ResolutionContext & {
    range?: import("@/types/shared.types").DistanceRange;
    zone?: import("@/types/shared.types").ArenaZone;
    pushedFighter?: "A" | "D";
  }
): void {
  // Write recovery debt
  if (debtToWriteA > 0) {
    fA.recoveryDebt = Math.min(3, Math.max(fA.recoveryDebt, debtToWriteA));
  } else {
    fA.recoveryDebt = Math.max(0, fA.recoveryDebt - 1);
  }
  if (debtToWriteD > 0) {
    fD.recoveryDebt = Math.min(3, Math.max(fD.recoveryDebt, debtToWriteD));
  } else {
    fD.recoveryDebt = Math.max(0, fD.recoveryDebt - 1);
  }

  if (!ctx || ctx.zone == null) return;

  // Zone transitions
  const hitOnA = events.some(e => e.type === "HIT" && e.target === "A");
  const hitOnD = events.some(e => e.type === "HIT" && e.target === "D");

  if (hitOnA) {
    const newZone = transitionZone(ctx.zone!);
    if (newZone !== ctx.zone) {
      ctx.pushedFighter = "A";
      ctx.zone = newZone;
      events.push({ type: "ZONE_SHIFT", actor: "D", target: "A", result: newZone });
    }
  } else if (hitOnD) {
    const newZone = transitionZone(ctx.zone!);
    if (newZone !== ctx.zone) {
      ctx.pushedFighter = "D";
      ctx.zone = newZone;
      events.push({ type: "ZONE_SHIFT", actor: "A", target: "D", result: newZone });
    }
  } else {
    // No hit: drift zone back toward Center
    if (ctx.pushedFighter) {
      const prev = ctx.zone;
      ctx.zone = resetZone(ctx.zone!);
      if (ctx.zone === "Center") {
        ctx.pushedFighter = undefined;
      }
    }
  }
}
