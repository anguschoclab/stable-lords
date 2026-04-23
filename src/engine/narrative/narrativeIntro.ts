/**
 * Narrative Intro - Pre-bout introduction functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import { type FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { getItemById, checkWeaponRequirements, type EquipmentItem } from '@/data/equipment';
import type { Attributes } from '@/types/shared.types';
import { szToHeight, getWeaponDisplayName } from './narrativeUtils';
import { getFromArchive, interpolateTemplate, type CombatContext } from './narrativePBPUtils';

type RNG = () => number;

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
  /** Physical attributes — used by the weapon-fit statement to call out deficiencies. */
  attributes?: Attributes;
  /** Optional handedness override (deterministic) — when absent, RNG chooses per-warrior. */
  handedness?: 'right' | 'left' | 'ambidextrous';
  /** Backup weapon shown in intro — minor flavour, purely cosmetic. */
  backupWeaponId?: string;
}

/**
 * Generates warrior introduction text.
 */
export function generateWarriorIntro(rng: RNG, data: WarriorIntroData, sz?: number): string[] {
  const lines: string[] = [];
  const n = data.name;

  if (sz) lines.push(`${n} is ${szToHeight(sz)}.`);

  // Handedness: deterministic override wins; otherwise RNG biased right-handed.
  const hand = data.handedness
    ? data.handedness === 'ambidextrous'
      ? 'ambidextrous'
      : `${data.handedness} handed`
    : rng() < 0.85
      ? 'right handed'
      : rng() < 0.5
        ? 'left handed'
        : 'ambidextrous';
  lines.push(`${n} is ${hand}.`);

  // Armor & Helm
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== 'none_armor') {
    const verb = getFromArchive(rng, ['fanfare', 'armor_intro_verbs']) || 'is wearing';
    lines.push(`${n} ${verb} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== 'none_helm') {
    lines.push(`And will wear a ${helmItem.name.toUpperCase()}.`);
  }

  // Weapon & Style
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === 'OPEN HAND') {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    const verb =
      getFromArchive(rng, ['fanfare', 'weapon_intro_verbs']) || 'is armed with {{weapon}}';
    lines.push(interpolateTemplate(verb, { attacker: n, weapon: weaponName }));
  }

  lines.push(`${n} uses the ${STYLE_DISPLAY_NAMES[data.style]} style.`);

  // Weapon-fitness statement — compares warrior attributes against weapon's
  // canonical ST/SZ/WT/DF minimums. Falls back to the generic line when we
  // don't have attributes (e.g. generated freelancers without stats).
  const weaponItem: EquipmentItem | undefined = data.weaponId
    ? getItemById(data.weaponId)
    : undefined;
  if (data.attributes && weaponItem && weaponItem.id !== 'open_hand') {
    const fit = checkWeaponRequirements(weaponItem.id, data.attributes);
    if (fit.attPenalty < 0) {
      lines.push(`${n} strains against the ${weaponItem.name} — ill-suited to its demands.`);
    } else {
      lines.push(`${n} is well suited to the ${weaponItem.name}.`);
    }
  } else {
    lines.push(`${n} is well suited to the weapons selected.`);
  }

  // Backup weapon mention — flavour only, surfaced when present.
  const backupItem = data.backupWeaponId ? getItemById(data.backupWeaponId) : undefined;
  if (backupItem && backupItem.id !== 'none_backup' && backupItem.id !== 'open_hand') {
    lines.push(`${n} carries a ${backupItem.name} as backup.`);
  }

  return lines;
}

/**
 * Generates battle opener text.
 */
export function battleOpener(rng: RNG): string {
  return getFromArchive(rng, ['pbp', 'openers']);
}
