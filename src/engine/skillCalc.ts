/**
 * Stable Lords — Base Skills & Derived Stats Calculator
 *
 * Base Skills: ATT, PAR, DEF, INI, RIP, DEC
 * Derived: HP, Endurance, Damage, Encumbrance
 *
 * Skill generation uses canonical Terrablood breakpoint tables:
 *   terrablood.com/duel-ii-formerly-known-as-duelmasters/terrablood-skill-chart/
 *
 * Formula: base_skill = Σ(attribute_contributions) + style_penalty
 * Clamped to [1, 20].
 */
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, type Attributes } from '@/types/shared.types';
import type { Warrior, AttributePotential } from '@/types/warrior.types';
import { FightingStyle, type BaseSkills, type DerivedStats } from '@/types/shared.types';
import {
  computeHP as canonicalHP,
  computeDamageClass,
  getDamageRating,
  computeEncumbranceCapacity,
  computeEnduranceValue,
  computeEnduranceTier,
  getHPRating,
  computeEncumbranceClass,
  type DamageRating,
  type HPRating,
  type EnduranceTier,
  type EncumbranceClass,
} from '@/data/terrabloodCharts';

// ─── Breakpoint Helper ────────────────────────────────────────────────────
// Each entry is [attribute_threshold, bonus_granted_at_or_above_that_value].
// Cumulative: sum all entries where attr >= threshold.
type BP = [number, number][];

function bp(breakpoints: BP, val: number): number {
  let total = 0;
  for (const [threshold, bonus] of breakpoints) {
    if (val >= threshold) total += bonus;
  }
  return total;
}

// ─── Canonical Attribute → Skill Breakpoint Tables ────────────────────────
// Source: Terrablood Skill Chart (terrablood.com) — last updated 2004-03-02

// Strength → ATT and PAR (identical)
const ST_ATT: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const ST_PAR = ST_ATT;

// Wit → ATT, DEF (identical pattern), INI (+4 spike at 11!), RIP, DEC
const WT_ATT: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_DEF = WT_ATT;
const WT_INI: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 4],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_RIP: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_DEC: BP = [
  [5, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Will → ATT, PAR (identical), DEF (stops at 21), DEC
const WL_ATT: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WL_PAR = WL_ATT;
const WL_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
]; // no 22-25 bonus
const WL_DEC: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Speed → DEC, DEF, INI, RIP
const SP_DEC: BP = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [18, 1],
  [20, 1],
];
const SP_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
];
const SP_INI: BP = [
  [4, 1],
  [6, 1],
  [9, 1],
  [12, 1],
  [18, 1],
];
const SP_RIP: BP = [
  [4, 1],
  [6, 1],
  [7, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [21, 1],
];

// Deftness → ATT, DEF, INI, PAR, RIP
const DF_ATT: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
const DF_DEF: BP = [
  [5, 1],
  [13, 1],
  [15, 1],
  [21, 1],
];
const DF_INI: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
const DF_PAR: BP = [
  [5, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [17, 1],
];
const DF_RIP: BP = [
  [6, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [16, 1],
  [18, 1],
  [20, 1],
];

// ─── Size Modifier (lookup table, not breakpoints) ────────────────────────
// SZ affects INI (large = faster), PAR and DEF (large = harder to parry/dodge)
// Source: Terrablood Skill Chart SZ table
const SZ_INI_MOD: Record<number, number> = {
  3: -2,
  4: -2,
  5: -1,
  6: -1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 1,
  16: 1,
  17: 2,
  18: 2,
  19: 2,
  20: 2,
  21: 4,
};
const SZ_PAR_MOD: Record<number, number> = {
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: -1,
  16: -1,
  17: -2,
  18: -2,
  19: -2,
  20: -2,
  21: -4,
};
const SZ_DEF_MOD = SZ_PAR_MOD; // Identical

function szMod(table: Record<number, number>, sz: number): number {
  return table[Math.max(3, Math.min(21, sz))] ?? 0;
}

// ─── Style Penalty Table ──────────────────────────────────────────────────
// Flat adjustments applied to attribute-derived skill totals.
//
// Originally from Terrablood Skill Chart, but REBALANCED (2026-04) because
// the original values assumed a uniform 70-point attribute spread.  Our
// archetype-based stat generation creates wildly different breakpoint yields
// per archetype (agile archetypes hit the WT=11/SP=11 spikes, brutal ones
// don't), producing a 4:1 skill-budget gap.  These adjusted penalties
// compress the effective skill budget to a ~22-30 range while preserving
// each style's relative identity.
//
// Format: [ATT, PAR, DEF, INI, RIP, DEC]
const STYLE_PENALTIES: Record<FightingStyle, [number, number, number, number, number, number]> = {
  //                                           ATT  PAR  DEF  INI  RIP  DEC
  // ── Cunning archetype (WT/DF/WL → high raw skills, needs steep penalty) ──
  [FightingStyle.AimedBlow]:      /*AB*/  [-13, -6, -10, -7, -5, +1],    // was -52, now -40: +12 budget (ATT/PAR/DEF/INI/RIP)
  [FightingStyle.ParryRiposte]:   /*PR*/  [-14, -8, -15, -8,  -2, -2],   // was -38, now -49: identity = riposte king (RIP least penalised)
  [FightingStyle.ParryStrike]:    /*PS*/  [-12, -6, -12, -9, -4, -1],    // was -42, now -44: minor INI nerf
  [FightingStyle.ParryLunge]:     /*PL*/  [-11, -7, -13, -7, -6, -1],    // was -35, now -45: ATT/INI/RIP down

  // ── Agile archetype (SP/DF/WT → massive breakpoint yields, heaviest penalty) ──
  [FightingStyle.LungingAttack]:  /*LU*/  [-10,-12, -13, -7, -7, -2],    // was -30, now -51: massive nerf to all skills
  [FightingStyle.SlashingAttack]: /*SL*/  [-12,-14, -15, -4, -7, -2],    // was -34, now -54: INI kept as identity, everything else down

  // ── Brutal archetype (ST/CN/SZ → low breakpoint yields, lightest penalty) ──
  [FightingStyle.BashingAttack]:  /*BA*/  [ -4, -6, -10,  0, -2, +2],    // was -35, now -20: +15 budget across all skills
  [FightingStyle.StrikingAttack]: /*ST*/  [ -7, -6,  -9, -2, -2, +2],    // was -41, now -24: +17 budget; still lower ATT than BA

  // ── Tank archetype (CN/WL/SZ → endurance/HP, needs skill floor to compete) ──
  [FightingStyle.TotalParry]:     /*TP*/  [-12, +1,  -9, -4, -2,  0],    // was -41, now -26: PAR buff is identity; ATT stays low
  [FightingStyle.WallOfSteel]:    /*WS*/  [ -2, -2,  -9,  2, -2,  0],    // was -27, now -13: small universal buff; INI positive = reads attacks
};

// ─── Base Skill Computation ───────────────────────────────────────────────

/**
 * Compute base skills from attributes + fighting style.
 * Deterministic — no randomness.
 *
 * Uses canonical Terrablood breakpoint tables with per-attribute, per-skill
 * contribution values. SZ adjusts INI/PAR/DEF. Style penalty applied as flat
 * modifier. Result clamped to [1, 20].
 *
 * Attribute→skill contributions:
 *   ATT: ST + WT + WL + DF
 *   PAR: ST + SZ + WL + DF
 *   DEF: SZ + WT + WL + SP + DF
 *   INI: SZ + WT + SP + DF
 *   RIP: WT + SP + DF
 *   DEC: WT + WL + SP
 */
export function computeBaseSkills(attrs: Attributes, style: FightingStyle): BaseSkills {
  const { ST, SZ, WT, WL, SP, DF } = attrs;
  const pen = STYLE_PENALTIES[style];

  const ATT_raw = bp(ST_ATT, ST) + bp(WT_ATT, WT) + bp(WL_ATT, WL) + bp(DF_ATT, DF) + pen[0];
  const PAR_raw = bp(ST_PAR, ST) + szMod(SZ_PAR_MOD, SZ) + bp(WL_PAR, WL) + bp(DF_PAR, DF) + pen[1];
  const DEF_raw =
    szMod(SZ_DEF_MOD, SZ) +
    bp(WT_DEF, WT) +
    bp(WL_DEF, WL) +
    bp(SP_DEF, SP) +
    bp(DF_DEF, DF) +
    pen[2];
  const INI_raw = szMod(SZ_INI_MOD, SZ) + bp(WT_INI, WT) + bp(SP_INI, SP) + bp(DF_INI, DF) + pen[3];
  const RIP_raw = bp(WT_RIP, WT) + bp(SP_RIP, SP) + bp(DF_RIP, DF) + pen[4];
  const DEC_raw = bp(WT_DEC, WT) + bp(WL_DEC, WL) + bp(SP_DEC, SP) + pen[5];

  return {
    ATT: Math.max(1, Math.min(20, ATT_raw)),
    PAR: Math.max(1, Math.min(20, PAR_raw)),
    DEF: Math.max(1, Math.min(20, DEF_raw)),
    INI: Math.max(1, Math.min(20, INI_raw)),
    RIP: Math.max(1, Math.min(20, RIP_raw)),
    DEC: Math.max(1, Math.min(20, DEC_raw)),
  };
}

// ─── Derived Stats (Canonical Terrablood Charts) ────────────────────────

/** HP = CN*2 + SZmod + WLmod (100% accuracy, n=3650) */
export function computeHP(attrs: Attributes): number {
  return canonicalHP(attrs.CN, attrs.SZ, attrs.WL);
}

/** Endurance from canonical (ST+CN) × WL chart */
export function computeEndurance(attrs: Attributes): number {
  return computeEnduranceValue(attrs.ST, attrs.CN, attrs.WL);
}

/** Damage class from canonical ST × SZ chart (returns 1-9 scale) */
export function computeDamage(attrs: Attributes): number {
  return computeDamageClass(attrs.ST, attrs.SZ);
}

/** Encumbrance capacity from canonical ST × CN chart */
export function computeEncumbrance(attrs: Attributes): number {
  return computeEncumbranceCapacity(attrs.ST, attrs.CN);
}

// Re-export chart labels for UI
export {
  getDamageRating,
  getHPRating,
  computeEncumbranceClass,
  computeEnduranceTier,
  ENDURANCE_LABELS,
  type DamageRating,
  type HPRating,
  type EnduranceTier,
  type EncumbranceClass,
} from '@/data/terrabloodCharts';

export const DAMAGE_LABELS = [
  '',
  'Little',
  'Normal',
  'Good',
  'Great',
  'Tremendous',
  'Awesome',
  'Devastating',
  'Superhuman',
  'Unearthly',
];

/** Convenience: compute all derived stats */
export function computeDerivedStats(attrs: Attributes): DerivedStats {
  return {
    hp: computeHP(attrs),
    endurance: computeEndurance(attrs),
    damage: computeDamage(attrs),
    encumbrance: computeEncumbrance(attrs),
  };
}

/** Full computation: base skills + derived stats */
export function computeWarriorStats(attrs: Attributes, style: FightingStyle) {
  return {
    baseSkills: computeBaseSkills(attrs, style),
    derivedStats: computeDerivedStats(attrs),
  };
}
