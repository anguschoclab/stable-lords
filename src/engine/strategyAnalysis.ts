import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import { getTempoBonus } from '@/engine/stylePassives';
import { getOffensiveSuitability, getDefensiveSuitability } from '@/engine/tacticSuitability';
import { clamp } from '@/utils/math';

/**
 * Strategy Analysis Engine
 * Calculates the viability of a given fight plan for a specific warrior.
 * Logic moved from UI components to ensure engine-level consistency.
 */
export function computeStrategyScore(plan: FightPlan, warrior?: Warrior): number {
  let score = 60; // Base score for a "standard" plan

  // 1. Tactic Suitability vs Warrior Intellect (WT)
  if (plan.offensiveTactic && plan.offensiveTactic !== 'none') {
    const suit = getOffensiveSuitability(plan.style, plan.offensiveTactic);
    // Skill-based suitability clamp: Low Wit warriors (WT < 10) can't pull off complex (WS) tactics
    const skillPenalty = warrior && warrior.attributes.WT < 10 && suit === 'WS' ? -30 : 0;
    score += (suit === 'WS' ? 15 : suit === 'S' ? 5 : -25) + skillPenalty;
  }
  if (plan.defensiveTactic && plan.defensiveTactic !== 'none') {
    const suit = getDefensiveSuitability(plan.style, plan.defensiveTactic);
    // Low Wit warriors (WT < 10) can't pull off complex (WS) tactics
    const skillPenalty = warrior && warrior.attributes.WT < 10 && suit === 'WS' ? -30 : 0;
    score += (suit === 'WS' ? 15 : suit === 'S' ? 5 : -25) + skillPenalty;
  }

  // 2. Effort Balance vs Warrior Physical/Mental Capacity
  // OE (Offensive) scales with ST (Strength) and SP (Speed)
  if (plan.OE >= 7 && warrior) {
    if (warrior.attributes.ST >= 18 || warrior.attributes.SP >= 18) score += 10;
    if (warrior.attributes.ST < 10 && warrior.attributes.SP < 10) score -= 15;
  }

  // AL (Adaptive) scales with WT (Wit) and DF (Deftness)
  if (plan.AL >= 7 && warrior) {
    if (warrior.attributes.WT >= 18 || warrior.attributes.DF >= 18) score += 10;
    if (warrior.attributes.WT < 10 && warrior.attributes.DF < 10) score -= 15;
  }

  // Over-exertion (Total Effort > 16)
  const totalEffort = plan.OE + plan.AL;
  if (totalEffort > 16) score -= (totalEffort - 16) * 8;
  if (totalEffort < 6) score -= (6 - totalEffort) * 5;

  // 3. Style Synergy (Tempo)
  const tempo = getTempoBonus(plan.style, 'OPENING');
  if (plan.OE >= 7 && tempo > 0) score += 10;
  if (plan.OE <= 4 && tempo < 0) score += 10;

  return clamp(score, 0, 100);
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]';
  if (score >= 70) return 'text-primary';
  if (score >= 50) return 'text-arena-pop';
  return 'text-destructive';
}
