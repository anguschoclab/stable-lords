/**
 * Stable Lords — Base Skills & Derived Stats Calculator
 * Based on Duelmasters canonical formulas (pid=2, 8-16, Terrablood references)
 *
 * Base Skills: ATT, PAR, DEF, INI, RIP, DEC
 * Derived: HP, Endurance, Damage, Encumbrance
 *
 * Now uses canonical Terrablood lookup charts for derived stats.
 */
import { FightingStyle, type Attributes, type BaseSkills, type DerivedStats } from "@/types/game";
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
} from "@/data/terrabloodCharts";

// ─── Style Seed Offsets (canonical approximations from Terrablood) ────────
// Each style has base offsets for [ATT, PAR, DEF, INI, RIP, DEC]
const STYLE_SEEDS: Record<FightingStyle, [number, number, number, number, number, number]> = {
  //                                          ATT PAR DEF INI RIP DEC
  // BALANCE v5: Offensive ATT boosted to 8, defensive PAR/DEF compressed to 2-3.
  // Riposte seeds capped at 2 for counter styles (identity via passives).
  // Goal: offense lands hits frequently; defense wins via endurance/counters, not blocking everything.
  [FightingStyle.AimedBlow]:       [ 5,  2,  2,  3,  2,  4],  // 18 — precision via crit, lower ATT
  [FightingStyle.BashingAttack]:   [ 8,  1,  2,  4,  1,  3],  // 19 — highest ATT, raw power
  [FightingStyle.LungingAttack]:   [ 8,  1,  2,  5,  1,  3],  // 20 — fast, aggressive
  [FightingStyle.ParryLunge]:      [ 5,  3,  2,  3,  2,  3],  // 18 — balanced hybrid
  [FightingStyle.ParryRiposte]:    [ 3,  2,  2,  3,  2,  2],  // 14 — PAR reduced to 2, counter via passives only
  [FightingStyle.ParryStrike]:     [ 5,  3,  3,  3,  2,  3],  // 19 — efficient counter, PAR 3 (not 4)
  [FightingStyle.SlashingAttack]:  [ 8,  1,  2,  4,  1,  3],  // 19 — offensive, multi-hit identity
  [FightingStyle.StrikingAttack]:  [ 8,  2,  2,  4,  1,  3],  // 20 — reliable power
  [FightingStyle.TotalParry]:      [ 2,  3,  3,  2,  2,  2],  // 14 — DEF 3 (was 4), identity is endurance
  [FightingStyle.WallOfSteel]:     [ 3,  2,  3,  3,  2,  3],  // 16 — DEF+endurance, moderate parry
};

// ─── Attribute → Skill Breakpoint Contributions ──────────────────────────
// Simplified from Terrablood breakpoint tables

function breakpointBonus(val: number): number {
  if (val >= 21) return 4;
  if (val >= 17) return 3;
  if (val >= 13) return 2;
  if (val >= 9) return 1;
  return 0;
}

/**
 * Compute base skills from attributes + fighting style.
 * Deterministic — no randomness.
 */
export function computeBaseSkills(attrs: Attributes, style: FightingStyle): BaseSkills {
  const seed = STYLE_SEEDS[style];
  const { ST, CN, SZ, WT, WL, SP, DF } = attrs;

  // ATT: WT primary, DF secondary, ST tertiary
  const ATT = seed[0] + breakpointBonus(WT) * 2 + breakpointBonus(DF) + breakpointBonus(ST);

  // PAR: WT primary, DF secondary, WL tertiary
  const PAR = seed[1] + breakpointBonus(WT) * 2 + breakpointBonus(DF) + breakpointBonus(WL);

  // DEF: SP primary, DF secondary, WT tertiary
  const DEF = seed[2] + breakpointBonus(SP) * 2 + breakpointBonus(DF) + breakpointBonus(WT);

  // INI: SP primary, WT secondary, DF tertiary
  const INI = seed[3] + breakpointBonus(SP) * 2 + breakpointBonus(WT) + breakpointBonus(DF);

  // RIP: DF primary, WT secondary, SP tertiary
  const RIP = seed[4] + breakpointBonus(DF) * 2 + breakpointBonus(WT) + breakpointBonus(SP);

  // DEC: WT primary, WL secondary
  const DEC = seed[5] + breakpointBonus(WT) * 2 + breakpointBonus(WL);

  return {
    ATT: Math.max(1, Math.min(20, ATT)),
    PAR: Math.max(1, Math.min(20, PAR)),
    DEF: Math.max(1, Math.min(20, DEF)),
    INI: Math.max(1, Math.min(20, INI)),
    RIP: Math.max(1, Math.min(20, RIP)),
    DEC: Math.max(1, Math.min(20, DEC)),
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
  getDamageRating, getHPRating, computeEncumbranceClass,
  computeEnduranceTier, ENDURANCE_LABELS,
  type DamageRating, type HPRating, type EnduranceTier, type EncumbranceClass,
} from "@/data/terrabloodCharts";

export const DAMAGE_LABELS = [
  "", "Little", "Normal", "Good", "Great", "Tremendous",
  "Awesome", "Devastating", "Superhuman", "Unearthly",
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
