import { FightingStyle } from "@/types/shared.types";

/**
 * Stable Lords — Combat Engine Constants & Tuning
 */

export const GLOBAL_ATT_BONUS = -1.5; 
export const GLOBAL_PAR_PENALTY = 0.5;
export const MAX_EXCHANGES = 30; // 10 minutes (Death Rattle calibration)
export const EXCHANGES_PER_MINUTE = 3;
export const INITIATIVE_PRESS_BONUS = 1;

export const OE_ATT_SCALING = 0.7;
export const OE_DEF_SCALING = 0.5;
export const AL_INI_SCALING = 0.7;
export const AL_ATTR_SCALING = 0.5;

export const DEFENDER_ENDURANCE_DISCOUNT = 0.92;
export const DAMAGE_TAX_SCALING = 0.7;
export const KILL_WINDOW_ENDURANCE = 0.4;
export const KILL_DESIRE_SCALING = 0.04;
export const KILL_PHASE_LATE_BONUS = 0.15;
export const KILL_THRESHOLD_MIN = 0.05;
export const KILL_THRESHOLD_BASE = 0.3;

export const TACTIC_OVERUSE_CAP = 3;
export const CRIT_DAMAGE_MULT = 1.5;

// ─── Style Matchup Matrix ──────────────────────────────────────────────────

export const STYLE_ORDER = [
  FightingStyle.AimedBlow, FightingStyle.BashingAttack, FightingStyle.LungingAttack,
  FightingStyle.ParryLunge, FightingStyle.ParryRiposte, FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack, FightingStyle.StrikingAttack, FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

/** 
 * Canonical Style Advantage Matrix. 
 * Values are flat skill bonuses (positive = advantage). 
 */
export const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [ 0,  0,  0,  0, +1,  0,  0,  0, +1,  0], // AB
  [ 0,  0,  0, +1, +1,  0, +1, +1,  0,  0], // BA
  [ 0,  0,  0, +1, +1, -1,  0,  0, +1, -1], // LU
  [ 0, -1, -1,  0,  0,  0,  0, -1,  0,  0], // PL
  [-1, -1,  0,  0,  0,  0,  0, -1,  0, -1], // PR
  [ 0,  0, +1,  0,  0,  0,  0, -1,  0, -1], // PS
  [ 0, -1,  0,  0,  0,  0,  0,  0, +1,  0], // SL
  [ 0, -1, +1, +1, +1, +1,  0,  0, +1,  0], // ST
  [-1,  0, -1,  0,  0,  0, -1, -1,  0,  0], // TP
  [ 0, +2, +1,  0, +1, +1,  0,  0,  0,  0], // WS
];

export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}
