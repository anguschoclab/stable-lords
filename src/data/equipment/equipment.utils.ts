/**
 * Equipment utility functions for Stable Lords.
 * Provides functions to search, validate, and work with equipment.
 */

import { FightingStyle } from '@/types/game';
import { WEAPONS } from './weapons';
import { ARMORS } from './armor';
import { SHIELDS } from './shields';
import { HELMS } from './helms';
import type {
  EquipmentItem,
  EquipmentSlot,
  EquipmentLoadout,
  WeaponReqResult,
  WeaponReqCheck,
  LoadoutIssue,
} from './equipment.types';

// Combined all equipment for convenience
export const ALL_EQUIPMENT: EquipmentItem[] = [...WEAPONS, ...ARMORS, ...SHIELDS, ...HELMS];

export function getItemById(id: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.id === id);
}

export function getItemByCode(code: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.code === code);
}

export function getAvailableItems(slot: EquipmentSlot, style: FightingStyle): EquipmentItem[] {
  const pool =
    slot === 'weapon' ? WEAPONS : slot === 'armor' ? ARMORS : slot === 'shield' ? SHIELDS : HELMS;
  return pool.filter((item) => !item.restrictedStyles?.includes(style));
}

export function isPreferredWeapon(item: EquipmentItem, style: FightingStyle): boolean {
  return item.preferredStyles?.includes(style) ?? false;
}

export const DEFAULT_LOADOUT: EquipmentLoadout = {
  weapon: 'broadsword',
  armor: 'leather',
  shield: 'none_shield',
  helm: 'leather_cap',
};

/**
 * Style-aware default loadout. Every style gets its canonical (classic) weapon
 * so the +1 classic-weapon bonus and weapon stat-requirements line up with the
 * warrior's style. Without this, every default-loadout warrior was issued a
 * broadsword (Striking Attack's classic), giving ST a hidden +1 ATT advantage
 * that no other style had access to.
 *
 * Used by the warrior factory to seed `warrior.equipment` at creation, and by
 * combat fallback paths when a warrior has no equipment field set.
 */
export function getStyleDefaultLoadout(style: FightingStyle): EquipmentLoadout {
  const classic = STYLE_CLASSIC_WEAPONS[style] ?? 'broadsword';
  return {
    weapon: classic,
    armor: 'leather',
    shield: 'none_shield',
    helm: 'leather_cap',
  };
}

export function getLoadoutWeight(loadout: EquipmentLoadout): number {
  return [loadout.weapon, loadout.armor, loadout.shield, loadout.helm].reduce(
    (sum, id) => sum + (getItemById(id)?.weight ?? 0),
    0
  );
}

/** Check weapon stat requirements against warrior attributes. Returns penalty details. */
export function checkWeaponRequirements(
  weaponId: string,
  attrs: { ST: number; SZ: number; WT: number; DF: number }
): WeaponReqResult {
  const item = getItemById(weaponId);
  if (!item || item.slot !== 'weapon')
    return { met: true, failures: [], attPenalty: 0, endurancePenalty: 1 };

  const checks: WeaponReqCheck[] = [];
  if (item.reqST && attrs.ST < item.reqST)
    checks.push({
      stat: 'ST',
      label: 'Strength',
      required: item.reqST,
      current: attrs.ST,
      deficit: item.reqST - attrs.ST,
    });
  if (item.reqSZ && attrs.SZ < item.reqSZ)
    checks.push({
      stat: 'SZ',
      label: 'Size',
      required: item.reqSZ,
      current: attrs.SZ,
      deficit: item.reqSZ - attrs.SZ,
    });
  if (item.reqWT && attrs.WT < item.reqWT)
    checks.push({
      stat: 'WT',
      label: 'Wit',
      required: item.reqWT,
      current: attrs.WT,
      deficit: item.reqWT - attrs.WT,
    });
  if (item.reqDF && attrs.DF < item.reqDF)
    checks.push({
      stat: 'DF',
      label: 'Deftness',
      required: item.reqDF,
      current: attrs.DF,
      deficit: item.reqDF - attrs.DF,
    });

  const failCount = checks.length;
  return {
    met: failCount === 0,
    failures: checks,
    attPenalty: failCount * -2,
    endurancePenalty: 1 + failCount * 0.1,
  };
}

export function isOverEncumbered(loadout: EquipmentLoadout, carryCap: number): boolean {
  return getLoadoutWeight(loadout) > carryCap;
}

/**
 * Hard-block validation for a loadout. Replaces the previous soft-warning fallthrough
 * for the two-handed + shield conflict — illegal combinations return a list of issues
 * so the UI/plan layer can block save instead of silently stripping gear.
 */
export function validateLoadout(loadout: EquipmentLoadout): LoadoutIssue[] {
  const issues: LoadoutIssue[] = [];
  const weapon = getItemById(loadout.weapon);
  if (!weapon) {
    issues.push({ code: 'MISSING_WEAPON', message: 'Loadout has no valid weapon.' });
    return issues;
  }
  const usingShield =
    !!loadout.shield && loadout.shield !== 'none_shield' && loadout.shield !== 'None';
  // Also catch the case where both hands hold a shield (weapon slot is a shield
  // and the offhand is also a shield) OR a two-handed weapon is paired with any shield.
  if (weapon.twoHanded && usingShield) {
    issues.push({
      code: 'TWO_HANDED_WITH_SHIELD',
      message: `${weapon.name} is two-handed and cannot be paired with a shield.`,
    });
  }
  return issues;
}

/**
 * Classic/canonical weapon per fighting style — from Terrablood Duel II tables.
 * Using the classic weapon grants a +1 ATT bonus in combat.
 * Total-Parry is special: ANY shield is the classic weapon.
 */
export const STYLE_CLASSIC_WEAPONS: Record<string, string> = {
  [FightingStyle.AimedBlow]: 'quarterstaff', // CW: Quarterstaff
  [FightingStyle.BashingAttack]: 'mace', // CW: Mace
  [FightingStyle.LungingAttack]: 'short_spear', // CW: Short Spear
  [FightingStyle.ParryLunge]: 'longsword', // CW: Longsword
  [FightingStyle.ParryRiposte]: 'epee', // CW: Epée
  [FightingStyle.ParryStrike]: 'short_sword', // CW: Shortsword (was broadsword — corrected from Terrablood)
  [FightingStyle.SlashingAttack]: 'scimitar', // CW: Scimitar
  [FightingStyle.StrikingAttack]: 'broadsword', // CW: Broadsword
  [FightingStyle.TotalParry]: 'medium_shield', // CW: Any Shield (medium as default display)
  [FightingStyle.WallOfSteel]: 'morning_star', // CW: Morning Star
};

const SHIELD_IDS = new Set(['small_shield', 'medium_shield', 'large_shield']);

/** Returns +1 if the warrior is using their style's classic weapon, 0 otherwise.
 *  Total-Parry: any shield qualifies. */
export function getClassicWeaponBonus(style: FightingStyle, weaponId: string): number {
  if (style === FightingStyle.TotalParry) {
    return SHIELD_IDS.has(weaponId) ? 1 : 0;
  }
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
