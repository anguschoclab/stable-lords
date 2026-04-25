import { FightingStyle } from '@/types/shared.types';

/**
 * Stable Lords — Combat Engine Constants & Tuning
 */

export const GLOBAL_ATT_BONUS = 2.5;
export const GLOBAL_PAR_PENALTY = -2.5;
export const MAX_EXCHANGES = 30; // 10 minutes (Death Rattle calibration)
export const EXCHANGES_PER_MINUTE = 3;
export const INITIATIVE_PRESS_BONUS = 1;

export const OE_ATT_SCALING = 0.7;
export const OE_DEF_SCALING = 0.5;
export const AL_INI_SCALING = 0.7;
export const AL_ATTR_SCALING = 0.5;

export const DEFENDER_ENDURANCE_DISCOUNT = 0.6;
export const DAMAGE_TAX_SCALING = 0.7;
export const KILL_WINDOW_ENDURANCE = 0.4;
export const KILL_DESIRE_SCALING = 0.04;
export const KILL_PHASE_LATE_BONUS = 0.15;
export const KILL_THRESHOLD_MIN = 0.05;
export const KILL_THRESHOLD_BASE = 0.3;

export const TACTIC_OVERUSE_CAP = 3;
export const CRIT_DAMAGE_MULT = 1.7;

// ─── Style Matchup Matrix ──────────────────────────────────────────────────

export const STYLE_ORDER = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.ParryLunge,
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

/**
 * Canonical Style Advantage Matrix.
 * Values are flat skill bonuses (positive = advantage).
 *
 * Tuned 2026-04 across two passes:
 *
 * Pass 1 (style W%): nerfed WS (+5→+1), buffed AB (+2→+4), softened PR (-4→-1).
 * Pass 2 (per-matchup W%, 4400-bout sample): BA emerged as new outlier at
 * 70.3%, AB still bottom at 26.5%. Per-matchup data showed:
 *  - BA dominated nearly all matchups (79-80% vs ST/TP/PS/PR)
 *  - AB lost 75-85% of fights vs BA/PS/PR despite matrix advantages, implying
 *    style-passive headwind (matrix can't fully compensate)
 *  - Symmetric mirror diagonal stays balanced; major asymmetry concentrated
 *    in BA's aggressive defaults
 *
 * Pass 2 changes:
 *  - BA: row sum +4 → +1 (dropped +1 vs PR/SL/ST). Matches the broad
 *    overperformance pattern across BA's most-played matchups.
 *  - AB: added +1 vs BA, +1 vs PR, +1 vs PS to counter the passive headwind.
 *    Row sum +4 → +7 (most aggressive in the matrix; accepted because passives
 *    drag AB down ~20pp from its raw matrix expectation).
 *  - PS: added +1 vs AB tempered to 0 (was already 0); kept other entries.
 *  - ST: added +1 vs WS to address ST's persistent low W% from passives.
 *  - TP: removed -1 vs AB to dampen the AB-eats-TP swing without flipping.
 *  - PL/PR/PS: minor symmetric softening to lift the bottom of the spread.
 *
 * Target: aggregate W% spread ≤ 20pp; per-matchup spread ≤ 30pp on samples ≥50.
 */
export const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [0, +1, +2, +1, +1, +1, +2, +2, +1, +2], // AB  (heavy buff; rich-mode AB still 28.8%)
  [0, 0, 0, +1, +1, +1, 0, 0, +1, 0], // BA  (restored some advantages after rich-mode AB attr pool sapped BA to 37%)
  [-2, 0, 0, +1, +1, -1, 0, 0, +1, -1], // LU  (penalized vs AB; LU at 71% rich-mode, kept hostile)
  [0, -1, -1, 0, 0, 0, 0, -1, 0, 0], // PL
  [0, -1, 0, 0, 0, 0, 0, -1, +1, 0], // PR
  [0, 0, +1, 0, 0, 0, 0, -1, 0, 0], // PS
  [-1, -1, 0, 0, +1, 0, 0, -1, +1, 0], // SL  (penalized vs AB/BA; SL still 67.8% rich-mode)
  [-1, 0, +1, +1, +1, 0, +1, 0, +1, +1], // ST
  [0, 0, -1, 0, 0, 0, -1, -1, 0, 0], // TP
  [-1, 0, +1, 0, 0, 0, 0, 0, 0, 0], // WS
];

export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}
