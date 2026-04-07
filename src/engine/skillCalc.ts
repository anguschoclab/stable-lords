/**
 * Stable Lords — Base Skills & Derived Stats Calculator
 * Based on Duelmasters canonical formulas (pid=2, 8-16, Terrablood references)
 *
 * Base Skills: ATT, PAR, DEF, INI, RIP, DEC
 * Derived: HP, Endurance, Damage, Encumbrance
 *
 * Now uses canonical Terrablood lookup charts for derived stats.
 */
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX, type Attributes } from "@/types/shared.types";
import type { Warrior, AttributePotential } from "@/types/warrior.types";
import { FightingStyle, type BaseSkills, type DerivedStats } from "@/types/game";
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
  // BALANCE v8: Seeds re-tuned after defensive attribute compression.
  // PR RIP seed reduced (riposte identity via passives, not raw skill).
  // WS ATT/DEF boosted (zone-control identity needs baseline offense).
  // TP DEF reduced (endurance identity, not dodge-walling).
  //                                          ATT PAR DEF INI RIP DEC
  [FightingStyle.AimedBlow]:       [ 5,  6,  6,  4,  4,  6],  
  [FightingStyle.BashingAttack]:   [ 6,  5,  5,  4,  3,  4],  
  [FightingStyle.LungingAttack]:   [ 6,  5,  5,  5,  3,  4],  
  [FightingStyle.ParryLunge]:      [ 5,  7,  6,  4,  5,  4],  
  [FightingStyle.ParryRiposte]:    [ 4,  8,  7,  4,  7,  4],  
  [FightingStyle.ParryStrike]:     [ 5,  8,  8,  4,  6,  4],  
  [FightingStyle.SlashingAttack]:  [ 6,  5,  5,  5,  3,  4],  
  [FightingStyle.StrikingAttack]:  [ 6,  6,  6,  5,  3,  4],  
  [FightingStyle.TotalParry]:      [ 3,  10, 8,  4,  4,  4],  
  [FightingStyle.WallOfSteel]:     [ 5,  8,  9,  5,  4,  4],  
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
 *
 * SEED COMPRESSION (Balance v8):
 * Defensive skills (PAR, DEF, RIP) use compressed attribute scaling —
 * only 2 contributing attributes instead of 3, with no ×2 primary.
 * This ensures offense scales more aggressively from attributes than defense,
 * so defensive identity comes from style seeds + passives, not raw stat stacking.
 */
export function computeBaseSkills(attrs: Attributes, style: FightingStyle): BaseSkills {
  const seed = STYLE_SEEDS[style];
  const { ST, CN, SZ, WT, WL, SP, DF } = attrs;

  // ATT: WT primary (×2), DF secondary, ST tertiary — FULL offensive scaling
  const ATT = seed[0] + breakpointBonus(WT) * 2 + breakpointBonus(DF) + breakpointBonus(ST);

  // PAR: WT + DF only — COMPRESSED (was WT×2 + DF + WL = 4 bonus, now 2 bonus)
  const PAR = seed[1] + breakpointBonus(WT) + breakpointBonus(DF);

  // DEF: SP + DF only — COMPRESSED (was SP×2 + DF + WT = 4 bonus, now 2 bonus)
  const DEF = seed[2] + breakpointBonus(SP) + breakpointBonus(DF);

  // INI: SP primary (×2), WT secondary, DF tertiary — FULL offensive scaling
  const INI = seed[3] + breakpointBonus(SP) * 2 + breakpointBonus(WT) + breakpointBonus(DF);

  // RIP: DF + WT only — COMPRESSED (was DF×2 + WT + SP = 4 bonus, now 2 bonus)
  const RIP = seed[4] + breakpointBonus(DF) + breakpointBonus(WT);

  // DEC: WT primary (×2), WL secondary — unchanged (offensive/kill skill)
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
