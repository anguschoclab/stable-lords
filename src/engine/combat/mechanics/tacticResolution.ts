import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import {
  suitabilityMultiplier,
  getOffensiveSuitability,
  getDefensiveSuitability,
} from '../../tacticSuitability';
import { OE_ATT_SCALING, OE_DEF_SCALING, AL_INI_SCALING } from './combatConstants';

/**
 * Stable Lords — Tactic & Attr Scaling Resolution
 */

export function oeAttMod(oe: number, style?: FightingStyle): number {
  const isAggressive =
    style === FightingStyle.BashingAttack ||
    style === FightingStyle.SlashingAttack ||
    style === FightingStyle.StrikingAttack;
  const base = Math.floor((oe - 5) * OE_ATT_SCALING);
  return isAggressive ? base + 1 : base;
}

export function oeDefMod(oe: number): number {
  // Canonical: OE 5 = neutral. Low OE = conservative (slight defense bonus).
  // High OE = opens up defenses (escalating penalty). Centered at 5, not 6.
  if (oe <= 5) return Math.floor((5 - oe) * OE_DEF_SCALING);
  return -Math.floor((oe - 5) * OE_DEF_SCALING);
}

export function alIniMod(al: number): number {
  return Math.floor((al - 5) * AL_INI_SCALING);
}

export function getOffensiveTacticMods(tactic: OffensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === 'none')
    return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  switch (tactic) {
    case 'Lunge':
      return {
        attBonus: Math.round(2 * mult),
        dmgBonus: 0,
        defPenalty: Math.round(1 * mult),
        endCost: 2,
        decBonus: 0,
        parryBypass: 0,
      };
    case 'Slash':
      return {
        attBonus: 0,
        dmgBonus: Math.round(2 * mult),
        defPenalty: 0,
        endCost: 1,
        decBonus: 0,
        parryBypass: Math.round(2 * mult),
      };
    case 'Bash':
      return {
        attBonus: Math.round(1 * mult),
        dmgBonus: Math.round(1 * mult),
        defPenalty: Math.round(2 * mult),
        endCost: 2,
        decBonus: 0,
        parryBypass: Math.round(4 * mult),
      };
    case 'Decisiveness':
      return {
        attBonus: 0,
        dmgBonus: 0,
        defPenalty: 0,
        endCost: 1,
        decBonus: Math.round(3 * mult),
        parryBypass: 0,
      };
    default:
      return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
  }
}

export function getDefensiveTacticMods(tactic: DefensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === 'none') return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };
  const mult = suitabilityMultiplier(getDefensiveSuitability(style, tactic));
  switch (tactic) {
    case 'Parry':
      return {
        parBonus: Math.round(3 * mult),
        defBonus: 0,
        ripBonus: -Math.round(1 * mult),
        iniBonus: 0,
      };
    case 'Dodge':
      return {
        parBonus: -Math.round(1 * mult),
        defBonus: Math.round(3 * mult),
        ripBonus: 0,
        iniBonus: 0,
      };
    case 'Riposte':
      return {
        parBonus: Math.round(1 * mult),
        defBonus: 0,
        ripBonus: Math.round(3 * mult),
        iniBonus: 0,
      };
    case 'Responsiveness':
      return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: Math.round(2 * mult) };
    default:
      return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };
  }
}

export function calculateFinalOEAL(
  effOE: number,
  effAL: number,
  plan: FightPlan,
  hp: number,
  maxHp: number,
  end: number,
  maxEnd: number,
  exchange: number
): [number, number] {
  let openOE = 0,
    openAL = 0;
  if (exchange < 3) {
    if (plan.openingMove === 'Aggressive') {
      openOE = 1;
      openAL = 1;
    } else if (plan.openingMove === 'Safe') {
      openOE = -1;
      openAL = -1;
    }
  }

  let fallOE = 0,
    fallAL = 0;
  if (plan.fallbackCondition === 'FLEE' && hp < maxHp * 0.3) {
    fallOE = -3;
    fallAL = -3;
  } else if (plan.fallbackCondition === 'TURTLE' && end < maxEnd * 0.3) {
    fallOE = -4;
    fallAL = 2;
  } else if (plan.fallbackCondition === 'BERZERK' && hp < maxHp * 0.3) {
    fallOE = 4;
    fallAL = -2;
  }

  const finalOE = Math.max(1, Math.min(10, effOE + openOE + fallOE));
  const finalAL = Math.max(1, Math.min(10, effAL + openAL + fallAL));
  return [finalOE, finalAL];
}
