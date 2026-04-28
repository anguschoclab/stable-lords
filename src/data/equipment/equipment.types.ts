/**
 * Equipment type definitions for Stable Lords.
 */

import { FightingStyle } from '@/types/game';

export type EquipmentSlot = 'weapon' | 'armor' | 'shield' | 'helm';

export interface EquipmentItem {
  id: string;
  code: string; // canonical 2-letter code (DA, EP, BS, etc.)
  name: string;
  slot: EquipmentSlot;
  weight: number; // canonical encumbrance cost
  description: string;
  twoHanded?: boolean; // weapons only — blocks shield slot
  restrictedStyles?: FightingStyle[]; // styles that CANNOT use this
  preferredStyles?: FightingStyle[]; // styles that get a bonus with this
  // Weapon stat requirements (canonical minimums from Terrablood)
  reqST?: number; // minimum Strength
  reqSZ?: number; // minimum Size
  reqWT?: number; // minimum Wit
  reqDF?: number; // minimum Deftness
  // Shield-only: which hit-location band the shield reliably covers.
  // LOW = legs/groin, MEDIUM = torso/arms, HIGH = head/throat/shoulders.
  // Used by combatDamage to apply zone-specific mitigation when the defender
  // is protecting that band.
  coverage?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EquipmentLoadout {
  weapon: string; // item id
  armor: string;
  shield: string;
  helm: string;
}

/** Check weapon stat requirements against warrior attributes. Returns penalty details. */
export interface WeaponReqCheck {
  stat: 'ST' | 'SZ' | 'WT' | 'DF';
  label: string;
  required: number;
  current: number;
  deficit: number;
}

export interface WeaponReqResult {
  met: boolean;
  failures: WeaponReqCheck[];
  attPenalty: number; // -2 per failed requirement
  endurancePenalty: number; // +10% per failed requirement (as multiplier, e.g. 1.2)
}

/**
 * Hard-block validation for a loadout. Replaces the previous soft-warning fallthrough
 * for the two-handed + shield conflict — illegal combinations return a list of issues
 * so the UI/plan layer can block save instead of silently stripping gear.
 */
export interface LoadoutIssue {
  code: 'TWO_HANDED_WITH_SHIELD' | 'MISSING_WEAPON';
  message: string;
}
