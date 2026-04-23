/**
 * Stable Lords — Canonical Terrablood Charts
 * HP, Endurance, Damage, Encumbrance lookup tables from Terrablood's Duel II archives.
 *
 * Sources:
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/hit-point-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-endurance-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-damage-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/encumbrance-chart/
 */

// ─── Hit Points ─────────────────────────────────────────────────────────────
// Formula: HP = CN*2 + SZmod + WLmod  (100% accuracy per Ben Weinstein, n=3650)

const SZ_MOD: Record<number, number> = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 5,
  12: 5,
  13: 6,
  14: 6,
  15: 7,
  16: 7,
  17: 8,
  18: 8,
  19: 9,
  20: 9,
  21: 10,
};

const WL_MOD_HP: Record<number, number> = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 2,
  13: 2,
  14: 2,
  15: 3,
  16: 3,
  17: 4,
  18: 4,
  19: 5,
  20: 5,
  21: 6,
  22: 7,
  23: 8,
  24: 9,
  25: 10,
};

export function computeHP(cn: number, sz: number, wl: number): number {
  const szMod = SZ_MOD[Math.min(21, Math.max(3, sz))] ?? 0;
  const wlMod = WL_MOD_HP[Math.min(25, Math.max(3, wl))] ?? 0;
  return cn * 2 + szMod + wlMod;
}

export type HPRating =
  | 'Very Frail'
  | 'Cannot Take a Lot'
  | 'Average'
  | 'A Lot'
  | 'Tremendous'
  | 'Seemingly Unaffected';

export function getHPRating(hp: number): HPRating {
  if (hp >= 54) return 'Seemingly Unaffected';
  if (hp >= 41) return 'Tremendous';
  if (hp >= 36) return 'A Lot';
  if (hp >= 27) return 'Average';
  if (hp >= 22) return 'Cannot Take a Lot';
  return 'Very Frail';
}

// ─── Damage ─────────────────────────────────────────────────────────────────
// Lookup by ST(3-25) × SZ(3-21). Mode values encoded.
// L=Little(1), N=Normal(2), G=Good(3), R=Great(4), T=Tremendous(5), A=Awesome(6), D=Devastating(7), S=Superhuman(8), U=Unearthly(9)

export type DamageRating =
  | 'Little'
  | 'Normal'
  | 'Good'
  | 'Great'
  | 'Tremendous'
  | 'Awesome'
  | 'Devastating'
  | 'Superhuman'
  | 'Unearthly';

const DMG_LABELS: DamageRating[] = [
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

// Encoded as mode damage class (1-9) indexed by [ST-3][SZ-3], clamped
// Simplified from the full chart — mode values only (ignoring ± variance)
const DMG_TABLE: number[][] = [
  // SZ: 3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21
  /*ST3*/ [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST4*/ [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST5*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST6*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST7*/ [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  /*ST8*/ [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  /*ST9*/ [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  /*ST10*/ [1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  /*ST11*/ [1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
  /*ST12*/ [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5],
  /*ST13*/ [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  /*ST14*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 6],
  /*ST15*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  /*ST16*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  /*ST17*/ [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6],
  /*ST18*/ [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6],
  /*ST19*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  /*ST20*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  /*ST21*/ [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7],
  /*ST22*/ [4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8],
  /*ST23*/ [4, 4, 4, 4, 6, 5, 5, 5, 5, 5, 6, 6, 7, 7, 7, 7, 7, 9, 9],
  /*ST24*/ [4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 9],
  /*ST25*/ [5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9],
];

export function computeDamageClass(st: number, sz: number): number {
  const stIdx = Math.min(22, Math.max(0, st - 3));
  const szIdx = Math.min(18, Math.max(0, sz - 3));
  return DMG_TABLE[stIdx]?.[szIdx] ?? 2;
}

export function getDamageRating(damageClass: number): DamageRating {
  return DMG_LABELS[Math.min(8, Math.max(0, damageClass - 1))] ?? 'Normal';
}

// ─── Encumbrance ────────────────────────────────────────────────────────────
// Lookup by ST(3-25) × CN(3-25). Returns class A-F.
// A=very little(~9), B=cannot carry a lot(~18), C=normal(~27), D=good(~36), E=tremendous(~45), F=limitless(~54)

export type EncumbranceClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Each class ≈ 6 weight points of gear capacity
// Canonical: average warrior (ST12/CN12) = class C = 18 points
// Max loadout weight: 2H(8) + Plate(14) + FullHelm(4) = 26 → only class E(30)/F(36) can carry it
export const ENCUMBRANCE_CAPACITY: Record<EncumbranceClass, number> = {
  A: 6,
  B: 12,
  C: 18,
  D: 24,
  E: 30,
  F: 36,
};

export const ENCUMBRANCE_LABELS: Record<EncumbranceClass, string> = {
  A: 'Very Little Weight',
  B: 'Cannot Carry a Lot',
  C: 'Normal',
  D: 'Good Amount',
  E: 'Tremendous Amount',
  F: 'Limitless',
};

// Encoded from the canonical chart: row=ST(3-25), col=CN(3-25), value=class index (0=A..5=F)
const ENC_TABLE: number[][] = [
  //CN:3 4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
  /*ST3*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST4*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST5*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST6*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST7*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST8*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST9*/ [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  /*ST10*/ [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  /*ST11*/ [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST12*/ [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST13*/ [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST14*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST15*/ [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST16*/ [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST17*/ [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST18*/ [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST19*/ [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST20*/ [2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
  /*ST21*/ [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST22*/ [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST23*/ [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST24*/ [2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST25*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
];

const ENC_CLASSES: EncumbranceClass[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function computeEncumbranceClass(st: number, cn: number): EncumbranceClass {
  const stIdx = Math.min(22, Math.max(0, st - 3));
  const cnIdx = Math.min(22, Math.max(0, cn - 3));
  const classIdx = ENC_TABLE[stIdx]?.[cnIdx] ?? 2;
  return ENC_CLASSES[classIdx];
}

export function computeEncumbranceCapacity(st: number, cn: number): number {
  return ENCUMBRANCE_CAPACITY[computeEncumbranceClass(st, cn)];
}

// ─── Endurance ──────────────────────────────────────────────────────────────
// Lookup by (ST+CN) vs WL. Returns tier letter.
// L=Very Little, P=Poor, N=Normal, G=Good, R=Great, T=Tremendous, A=Awesome, U=Limitless

export type EnduranceTier = 'L' | 'P' | 'N' | 'G' | 'R' | 'T' | 'A' | 'U';

export const ENDURANCE_LABELS: Record<EnduranceTier, string> = {
  L: 'Very Little',
  P: 'Poor',
  N: 'Normal',
  G: 'Good',
  R: 'Great',
  T: 'Tremendous',
  A: 'Awesome',
  U: 'Limitless',
};

// Numerical endurance value per tier (for combat calculations)
const ENDURANCE_VALUES: Record<EnduranceTier, number> = {
  L: 12,
  P: 18,
  N: 25,
  G: 33,
  R: 42,
  T: 52,
  A: 65,
  U: 80,
};

/**
 * Compute endurance tier from canonical chart.
 * Uses piecewise approximation of the massive (ST+CN) × WL table.
 */
export function computeEnduranceTier(st: number, cn: number, wl: number): EnduranceTier {
  const stcn = st + cn;
  // Simplified breakpoint approximation from the chart
  // The chart shows that higher WL dramatically increases endurance,
  // while higher ST+CN has a more moderate effect.
  const score = wl * 3 + stcn;

  if (score >= 95) return 'A';
  if (score >= 85) return 'T';
  if (score >= 75) return 'R';
  if (score >= 62) return 'G';
  if (score >= 48) return 'N';
  if (score >= 35) return 'P';
  return 'L';
}

export function computeEnduranceValue(st: number, cn: number, wl: number): number {
  return ENDURANCE_VALUES[computeEnduranceTier(st, cn, wl)];
}

// ─── Activity Ratings ───────────────────────────────────────────────────────
// Based on INI base + RIP base (old style chart from Terrablood)
// https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-activity-ratings/

export type ActivityRating =
  | 'Very Slow & Inactive'
  | 'Very Slow'
  | 'Very Inactive'
  | 'Relatively Slow & Inactive'
  | 'Relatively Slow'
  | 'Relatively Inactive'
  | 'Normal'
  | 'Quick & Active'
  | 'Quick'
  | 'Active'
  | 'Very Quick & Active'
  | 'Very Quick'
  | 'Very Active'
  | 'Incredibly Quick & Active'
  | 'Incredibly Quick'
  | 'Extremely Active'
  | 'Sensationally Quick & Active'
  | 'Sensationally Quick'
  | 'Sensationally Active';

export function computeActivityRating(iniBase: number, ripBase: number): ActivityRating {
  const total = iniBase + ripBase;

  if (total >= 30) {
    if (iniBase >= ripBase + 5) return 'Sensationally Quick';
    if (ripBase >= iniBase + 5) return 'Sensationally Active';
    return 'Sensationally Quick & Active';
  }
  if (total >= 24) {
    if (iniBase >= ripBase + 5) return 'Incredibly Quick';
    if (ripBase >= iniBase + 5) return 'Extremely Active';
    return 'Incredibly Quick & Active';
  }
  if (total >= 20) {
    if (iniBase >= ripBase + 5) return 'Very Quick';
    if (ripBase >= iniBase + 5) return 'Very Active';
    return 'Very Quick & Active';
  }
  if (total >= 16) {
    if (iniBase >= ripBase + 5) return 'Quick';
    if (ripBase >= iniBase + 5) return 'Active';
    return 'Quick & Active';
  }
  if (total >= 12) return 'Normal';
  if (total >= 8) {
    if (iniBase >= ripBase + 3) return 'Relatively Slow';
    if (ripBase >= iniBase + 3) return 'Relatively Inactive';
    return 'Relatively Slow & Inactive';
  }
  if (iniBase >= ripBase + 3) return 'Very Slow';
  if (ripBase >= iniBase + 3) return 'Very Inactive';
  return 'Very Slow & Inactive';
}

// ─── Coordination ───────────────────────────────────────────────────────────
// https://terrablood.com/duel-ii-formerly-known-as-duelmasters/coordination-statements/

export type CoordinationRating =
  | 'Clumsy'
  | 'Slightly Uncoordinated'
  | 'Normal'
  | 'Highly Coordinated'
  | 'Very Highly Coordinated'
  | 'Marvel of Fighting Coordination';

export function computeCoordination(sp: number, df: number): CoordinationRating {
  const total = sp + df;
  if (total >= 40) return 'Marvel of Fighting Coordination';
  if (total >= 32) return 'Very Highly Coordinated';
  if (total >= 28) return 'Highly Coordinated';
  if (total >= 21) return 'Normal';
  if (total >= 16) return 'Slightly Uncoordinated';
  return 'Clumsy';
}
