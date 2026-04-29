import { FightingStyle } from '@/types/shared.types';
import type { OffensiveTactic, DefensiveTactic, PlanCondition } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan, PhaseStrategy } from '@/types/combat.types';
import type { OwnerPersonality, AIIntent } from '@/types/state.types';
import { defaultPlanForWarrior } from './simulate';
import { PERSONALITY_PLAN_MODS, PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';
import { computeStrategyScore } from './strategyAnalysis';
import { clamp } from '@/utils/math';
import { getOffensiveSuitability, getDefensiveSuitability } from './tacticSuitability';

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics, global strategic intent, and strategy score validation.
 */
export function aiPlanForWarrior(
  w: Warrior,
  personality: OwnerPersonality,
  philosophy: string,
  opponentStyle?: FightingStyle,
  intent?: AIIntent,
  grudgeIntensity: number = 0
): FightPlan {
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};

  // Intent-based modifiers
  let intentOE = 0;
  let intentAL = 0;
  let intentKD = 0;

  if (intent === 'RECOVERY') {
    intentOE = -2; // Defensive to minimize damage
    intentAL = -1;
    intentKD = -2;
  } else if (intent === 'VENDETTA') {
    intentAL = 2; // Relentless
    intentKD = 2;
  }

  // Grudge-based escalation
  const grudgeKD = grudgeIntensity; // +1 to +5
  const grudgeAL = Math.floor(grudgeIntensity / 2);

  // Per-style matchup heuristics
  const matchup = opponentStyle
    ? getStyleMatchupMods(w.style, opponentStyle)
    : { oe: 0, al: 0, kd: 0 };

  // Generate initial plan
  const plan: FightPlan = {
    ...base,
    OE: clamp((base.OE ?? 5) + (pMod.OE ?? 0) + (phMod.OE ?? 0) + matchup.oe + intentOE, 1, 10),
    AL: clamp(
      (base.AL ?? 5) + (pMod.AL ?? 0) + (phMod.AL ?? 0) + matchup.al + intentAL + grudgeAL,
      1,
      10
    ),
    killDesire: clamp(
      (base.killDesire ?? 5) +
        (pMod.killDesire ?? 0) +
        (phMod.killDesire ?? 0) +
        matchup.kd +
        intentKD +
        grudgeKD,
      1,
      10
    ),
  };

  // Strategy score validation with retry logic
  const minScore = 50;
  const maxRetries = 3;
  let retries = 0;
  let score = computeStrategyScore(plan, w);

  while (score < minScore && retries < maxRetries) {
    // Adjust plan parameters to improve score
    // Reduce over-exertion if that's the issue
    const totalEffort = plan.OE + plan.AL;
    if (totalEffort > 16) {
      plan.OE = Math.max(1, plan.OE - 1);
      plan.AL = Math.max(1, plan.AL - 1);
    }
    // Increase effort if too low
    else if (totalEffort < 6) {
      plan.OE = Math.min(10, plan.OE + 1);
      plan.AL = Math.min(10, plan.AL + 1);
    }
    // Adjust towards balanced effort
    else {
      const avgEffort = Math.floor(totalEffort / 2);
      plan.OE = clamp(avgEffort, 1, 10);
      plan.AL = clamp(avgEffort, 1, 10);
    }

    score = computeStrategyScore(plan, w);
    retries++;
  }

  // Tactic suitability validation - adjust OE/AL based on style compatibility
  // High OE is more suitable for aggressive styles, high AL for defensive styles
  const styleSuitabilityBias = getStyleSuitabilityBias(w.style);
  plan.OE = clamp(plan.OE + styleSuitabilityBias.oe, 1, 10);
  plan.AL = clamp(plan.AL + styleSuitabilityBias.al, 1, 10);

  // In-bout personality adaptation — appended AFTER any user-authored conditions
  // so player overrides take precedence (evaluateConditions is first-match-wins).
  // Each personality gets at most one adaptation condition to keep behaviour
  // legible in transcripts and bounded (±1/2 nudges, never beyond plan caps).
  // Style-appropriate tactic assignment — pick best-rated offensive + defensive tactic
  const bestOffTactic = getBestOffensiveTactic(w.style);
  const bestDefTactic = getBestDefensiveTactic(w.style);
  if (bestOffTactic !== 'none') plan.offensiveTactic = bestOffTactic;
  if (bestDefTactic !== 'none') plan.defensiveTactic = bestDefTactic;

  // Phase-stratified effort curves — opening is conservative, late is personality-modified
  plan.phases = buildPhasePlan(plan, personality, w.style);

  // Desperate plan — wired into resolution.ts at HP<30% or END<20%
  plan.desperatePlan = buildDesperatePlan(plan, personality);

  // Universal ENDURANCE_BELOW condition prepended before personality ones
  // (first-match-wins: this fires before personality-specific conditions)
  const universalConditions = buildUniversalConditions(plan);

  plan.ownerPersonality = personality;
  const adaptations = getPersonalityAdaptations(personality, plan, intent);
  plan.conditions = [...universalConditions, ...(plan.conditions ?? []), ...adaptations];

  return plan;
}

/**
 * Pick the best-rated offensive tactic for a style, returning 'none' for TotalParry.
 */
function getBestOffensiveTactic(style: FightingStyle): OffensiveTactic {
  const tactics: OffensiveTactic[] = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
  let best: OffensiveTactic = 'none';
  let bestScore = -1;
  for (const t of tactics) {
    const r = getOffensiveSuitability(style, t);
    const score = r === 'WS' ? 2 : r === 'S' ? 1 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}

/**
 * Pick the best-rated defensive tactic for a style.
 */
function getBestDefensiveTactic(style: FightingStyle): DefensiveTactic {
  const tactics: DefensiveTactic[] = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
  let best: DefensiveTactic = 'none';
  let bestScore = -1;
  for (const t of tactics) {
    const r = getDefensiveSuitability(style, t);
    const score = r === 'WS' ? 2 : r === 'S' ? 1 : 0;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return bestScore > 0 ? best : 'none';
}

/**
 * Build per-phase OE/AL curves: conservative opening, base mid, personality-tweaked late.
 */
function buildPhasePlan(
  plan: FightPlan,
  personality: OwnerPersonality,
  style: FightingStyle
): FightPlan['phases'] {
  const isDefensive =
    style === FightingStyle.TotalParry ||
    style === FightingStyle.WallOfSteel ||
    style === FightingStyle.ParryRiposte;
  const openingOE = clamp(plan.OE - (isDefensive ? 2 : 1), 1, 10);
  const opening: PhaseStrategy = {
    OE: openingOE,
    AL: plan.AL,
    killDesire: Math.max(1, (plan.killDesire ?? 5) - 1),
  };
  const mid: PhaseStrategy = { OE: plan.OE, AL: plan.AL, killDesire: plan.killDesire ?? 5 };
  const lateOE =
    personality === 'Aggressive' || personality === 'Showman'
      ? clamp(plan.OE + 1, 1, 10)
      : personality === 'Methodical' || personality === 'Tactician'
        ? clamp(plan.OE - 1, 1, 10)
        : plan.OE;
  const lateAL =
    personality === 'Methodical' || personality === 'Tactician'
      ? clamp(plan.AL + 1, 1, 10)
      : plan.AL;
  const late: PhaseStrategy = { OE: lateOE, AL: lateAL, killDesire: plan.killDesire ?? 5 };
  return { opening, mid, late };
}

/**
 * Build a personality-keyed desperate plan (HP<30% or END<20% fallback).
 */
function buildDesperatePlan(
  plan: FightPlan,
  personality: OwnerPersonality
): FightPlan['desperatePlan'] {
  const baseOE = plan.OE;
  const baseAL = plan.AL;
  const baseKD = plan.killDesire ?? 5;
  if (personality === 'Aggressive') {
    return {
      OE: clamp(baseOE - 1, 1, 10),
      AL: clamp(baseAL + 1, 1, 10),
      killDesire: clamp(baseKD + 1, 1, 10),
    };
  }
  if (personality === 'Methodical') {
    return { OE: 1, AL: clamp(baseAL + 3, 1, 10), killDesire: clamp(baseKD - 2, 1, 10) };
  }
  return {
    OE: clamp(baseOE - 2, 1, 10),
    AL: clamp(baseAL + 2, 1, 10),
    killDesire: clamp(baseKD - 2, 1, 10),
  };
}

/**
 * Universal conditions prepended before personality ones (first-match-wins).
 * Ensures every AI warrior has a critical-endurance survival fallback.
 */
function buildUniversalConditions(plan: FightPlan): PlanCondition[] {
  const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);
  return [
    {
      trigger: { type: 'ENDURANCE_BELOW', value: 15 },
      override: { OE: bounded(plan.OE, -2), AL: bounded(plan.AL, +2) },
      label: 'Universal: critical endurance survival',
    },
  ];
}

/**
 * Per-personality in-bout nudges. Returned as PlanConditions so they're evaluated
 * by the existing WT-gated condition pipeline — no new code path.
 */
function getPersonalityAdaptations(
  personality: OwnerPersonality,
  plan: FightPlan,
  intent?: AIIntent
): PlanCondition[] {
  const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);
  const isKillIntent = intent === 'VENDETTA' || intent === 'AGGRESSIVE_EXPANSION';
  switch (personality) {
    case 'Aggressive': {
      const conditions: PlanCondition[] = [
        {
          trigger: { type: 'MOMENTUM_LEAD', value: 2 },
          override: { OE: bounded(plan.OE, +1), killDesire: bounded(plan.killDesire ?? 5, +1) },
          label: 'Aggressive: press the advantage',
        },
      ];
      if (isKillIntent) {
        conditions.push({
          trigger: { type: 'MOMENTUM_LEAD', value: 2 },
          override: { OE: bounded(plan.OE, +1), killDesire: bounded(plan.killDesire ?? 5, +2) },
          label: 'Aggressive+Vendetta: kill commitment',
        });
      }
      return conditions;
    }
    case 'Methodical':
      // Losing ground on momentum → tighten defence.
      return [
        {
          trigger: { type: 'MOMENTUM_DEFICIT', value: 2 },
          override: { AL: bounded(plan.AL, +1), OE: bounded(plan.OE, -1) },
          label: 'Methodical: disengage and reset',
        },
      ];
    case 'Showman':
      // Late-phase flourish: drama sells tickets, lethality sells legends.
      return [
        {
          trigger: { type: 'PHASE_IS', value: 'LATE' },
          override: { killDesire: bounded(plan.killDesire ?? 5, +1), OE: bounded(plan.OE, +1) },
          label: 'Showman: late-phase flourish',
        },
      ];
    case 'Pragmatic':
      // Below 30% HP: survive the round first, win the campaign second.
      return [
        {
          trigger: { type: 'HP_BELOW', value: 30 },
          override: {
            OE: bounded(plan.OE, -1),
            AL: bounded(plan.AL, +2),
            killDesire: bounded(plan.killDesire ?? 5, -1),
          },
          label: 'Pragmatic: preservation',
        },
      ];
    case 'Tactician':
      // Endurance under 40%: conserve, outlast.
      return [
        {
          trigger: { type: 'ENDURANCE_BELOW', value: 40 },
          override: { OE: bounded(plan.OE, -1), AL: bounded(plan.AL, +1) },
          label: 'Tactician: conserve pace',
        },
      ];
    default:
      return [];
  }
}

/**
 * Returns OE/AL bias preferences for each fighting style.
 * Aggressive styles prefer higher OE, defensive styles prefer higher AL.
 */
function getStyleSuitabilityBias(style: FightingStyle): { oe: number; al: number } {
  const biases: Partial<Record<FightingStyle, { oe: number; al: number }>> = {
    [FightingStyle.BashingAttack]: { oe: 2, al: -1 },
    [FightingStyle.SlashingAttack]: { oe: 1, al: 0 },
    [FightingStyle.StrikingAttack]: { oe: 1, al: 0 },
    [FightingStyle.LungingAttack]: { oe: 1, al: 1 },
    [FightingStyle.AimedBlow]: { oe: -1, al: 1 },
    [FightingStyle.TotalParry]: { oe: -2, al: 2 },
    [FightingStyle.ParryRiposte]: { oe: -1, al: 2 },
    [FightingStyle.ParryLunge]: { oe: 0, al: 1 },
    [FightingStyle.ParryStrike]: { oe: 0, al: 1 },
    [FightingStyle.WallOfSteel]: { oe: -1, al: 2 },
  };
  return biases[style] ?? { oe: 0, al: 0 };
}

/**
 * Per-style matchup heuristics from the Fighting Styles Compendium.
 * Returns OE/AL/KD adjustments when facing a specific opponent style.
 */
export function getStyleMatchupMods(
  myStyle: FightingStyle,
  oppStyle: FightingStyle
): { oe: number; al: number; kd: number } {
  // Map myStyle to its counter logic
  const matchers: Partial<
    Record<FightingStyle, (opp: FightingStyle) => { oe: number; al: number; kd: number } | null>
  > = {
    [FightingStyle.AimedBlow]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack)
        return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: 1, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.BashingAttack]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel)
        return { oe: 2, al: 1, kd: 1 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.LungingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: -1, al: 2, kd: 0 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: -2, al: 1, kd: -1 };
      return null;
    },
    [FightingStyle.ParryLunge]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      return null;
    },
    [FightingStyle.ParryRiposte]: (opp) => {
      if (opp === FightingStyle.BashingAttack || opp === FightingStyle.SlashingAttack)
        return { oe: -2, al: 0, kd: 0 };
      if (opp === FightingStyle.TotalParry) return { oe: 1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.ParryStrike]: (opp) => {
      if (opp === FightingStyle.SlashingAttack) return { oe: 1, al: 0, kd: 1 };
      if (opp === FightingStyle.LungingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.StrikingAttack]: (opp) => {
      if (opp === FightingStyle.BashingAttack) return { oe: 0, al: 1, kd: 0 };
      if (opp === FightingStyle.WallOfSteel) return { oe: 2, al: 0, kd: 1 };
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.SlashingAttack]: (opp) => {
      if (opp === FightingStyle.TotalParry || opp === FightingStyle.ParryRiposte)
        return { oe: 1, al: 0, kd: 0 };
      if (opp === FightingStyle.ParryStrike) return { oe: 0, al: 0, kd: 1 };
      return null;
    },
    [FightingStyle.TotalParry]: (opp) => {
      if (opp === FightingStyle.LungingAttack || opp === FightingStyle.WallOfSteel)
        return { oe: -2, al: -1, kd: -1 };
      if (opp === FightingStyle.AimedBlow) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
    [FightingStyle.WallOfSteel]: (opp) => {
      if (opp === FightingStyle.StrikingAttack) return { oe: 0, al: 1, kd: 0 };
      if (opp === FightingStyle.SlashingAttack) return { oe: -1, al: 0, kd: 0 };
      return null;
    },
  };

  const matcher = matchers[myStyle];
  return matcher?.(oppStyle) ?? { oe: 0, al: 0, kd: 0 };
}
