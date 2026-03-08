/**
 * Stable Lords — Equipment Database
 * Weapons, armor, shields, helms with style restrictions and encumbrance costs.
 */
import { FightingStyle } from "@/types/game";

// ─── Slot Types ─────────────────────────────────────────────────────────────

export type EquipmentSlot = "weapon" | "armor" | "shield" | "helm";

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  weight: number;          // encumbrance cost
  statMods?: Partial<Record<string, number>>; // e.g. ATT +1, DEF -1
  description: string;
  twoHanded?: boolean;     // weapons only — blocks shield slot
  restrictedStyles?: FightingStyle[]; // styles that CANNOT use this
  preferredStyles?: FightingStyle[];  // styles that get a bonus with this
}

// ─── Weapons ────────────────────────────────────────────────────────────────

export const WEAPONS: EquipmentItem[] = [
  // Light weapons
  { id: "dagger",       name: "Dagger",         slot: "weapon", weight: 1, description: "Fast, light. Favored by aimed-blow and lungers.", preferredStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "short_sword",  name: "Short Sword",    slot: "weapon", weight: 2, description: "Versatile light blade. No restrictions." },
  { id: "epee",         name: "Epée",           slot: "weapon", weight: 1, description: "Thrusting weapon for precise styles.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.ParryLunge, FightingStyle.ParryRiposte] },
  { id: "rapier",       name: "Rapier",         slot: "weapon", weight: 2, description: "Elegant thrusting blade.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.ParryLunge] },

  // Medium weapons
  { id: "scimitar",     name: "Scimitar",       slot: "weapon", weight: 3, description: "Curved slashing blade.", preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.StrikingAttack] },
  { id: "broadsword",   name: "Broadsword",     slot: "weapon", weight: 4, description: "Standard arena sword. Well-balanced.", preferredStyles: [FightingStyle.ParryStrike, FightingStyle.WallOfSteel] },
  { id: "longsword",    name: "Longsword",      slot: "weapon", weight: 4, description: "Versatile blade, good reach.", preferredStyles: [FightingStyle.ParryStrike, FightingStyle.SlashingAttack] },
  { id: "mace",         name: "Mace",           slot: "weapon", weight: 4, description: "Heavy crushing weapon.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow] },

  // Heavy weapons
  { id: "morning_star", name: "Morning Star",   slot: "weapon", weight: 5, description: "Spiked crushing weapon.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "battle_axe",   name: "Battle Axe",     slot: "weapon", weight: 5, description: "Devastating chopping weapon.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "war_hammer",   name: "War Hammer",     slot: "weapon", weight: 5, description: "Armor-piercing blunt weapon.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },

  // Two-handed weapons
  { id: "greatsword",   name: "Greatsword",     slot: "weapon", weight: 6, twoHanded: true, description: "Massive two-handed blade. No shield.", preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry] },
  { id: "halberd",      name: "Halberd",        slot: "weapon", weight: 7, twoHanded: true, description: "Polearm with devastating reach. No shield.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
  { id: "maul",         name: "Maul",           slot: "weapon", weight: 7, twoHanded: true, description: "Giant war hammer. No shield.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
];

// ─── Armor ──────────────────────────────────────────────────────────────────

export const ARMORS: EquipmentItem[] = [
  { id: "none_armor",   name: "None",           slot: "armor", weight: 0, description: "No armor. Maximum speed." },
  { id: "leather",      name: "Leather",        slot: "armor", weight: 1, description: "Light protection. Minimal encumbrance." },
  { id: "studded",      name: "Studded Leather", slot: "armor", weight: 2, description: "Reinforced leather. Good balance." },
  { id: "ring_mail",    name: "Ring Mail",      slot: "armor", weight: 3, description: "Linked rings over padding." },
  { id: "chain_mail",   name: "Chain Mail",     slot: "armor", weight: 4, description: "Interlocking metal rings. Standard protection." },
  { id: "scale_mail",   name: "Scale Mail",     slot: "armor", weight: 5, description: "Overlapping metal plates. Heavy." },
  { id: "plate_mail",   name: "Plate Mail",     slot: "armor", weight: 7, description: "Full plate armor. Maximum protection, heavy.", restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
];

// ─── Shields ────────────────────────────────────────────────────────────────

export const SHIELDS: EquipmentItem[] = [
  { id: "none_shield",  name: "None",           slot: "shield", weight: 0, description: "No shield. Free off-hand." },
  { id: "buckler",      name: "Buckler",        slot: "shield", weight: 1, description: "Small round shield. +1 PAR." },
  { id: "small_shield", name: "Small Shield",   slot: "shield", weight: 2, description: "Light wooden shield. +1 PAR, +1 DEF." },
  { id: "medium_shield",name: "Medium Shield",  slot: "shield", weight: 3, description: "Standard shield. +2 DEF.", restrictedStyles: [FightingStyle.LungingAttack] },
  { id: "large_shield", name: "Large Shield",   slot: "shield", weight: 4, description: "Tower shield. +3 DEF, -1 ATT.", restrictedStyles: [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow] },
];

// ─── Helms ──────────────────────────────────────────────────────────────────

export const HELMS: EquipmentItem[] = [
  { id: "none_helm",    name: "None",           slot: "helm", weight: 0, description: "No helm. Risky but light." },
  { id: "leather_cap",  name: "Leather Cap",    slot: "helm", weight: 1, description: "Basic head protection." },
  { id: "steel_cap",    name: "Steel Cap",      slot: "helm", weight: 2, description: "Open-faced metal helm." },
  { id: "full_helm",    name: "Full Helm",      slot: "helm", weight: 3, description: "Enclosed helm. Great protection, reduces visibility.", restrictedStyles: [FightingStyle.AimedBlow] },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export const ALL_EQUIPMENT: EquipmentItem[] = [...WEAPONS, ...ARMORS, ...SHIELDS, ...HELMS];

export function getItemById(id: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.id === id);
}

export function getAvailableItems(slot: EquipmentSlot, style: FightingStyle): EquipmentItem[] {
  const pool = slot === "weapon" ? WEAPONS
    : slot === "armor" ? ARMORS
    : slot === "shield" ? SHIELDS
    : HELMS;
  return pool.filter((item) => !item.restrictedStyles?.includes(style));
}

export function isPreferredWeapon(item: EquipmentItem, style: FightingStyle): boolean {
  return item.preferredStyles?.includes(style) ?? false;
}

export interface EquipmentLoadout {
  weapon: string;   // item id
  armor: string;
  shield: string;
  helm: string;
}

export const DEFAULT_LOADOUT: EquipmentLoadout = {
  weapon: "broadsword",
  armor: "leather",
  shield: "none_shield",
  helm: "leather_cap",
};

export function getLoadoutWeight(loadout: EquipmentLoadout): number {
  return [loadout.weapon, loadout.armor, loadout.shield, loadout.helm]
    .reduce((sum, id) => sum + (getItemById(id)?.weight ?? 0), 0);
}

export function isOverEncumbered(loadout: EquipmentLoadout, carryCap: number): boolean {
  return getLoadoutWeight(loadout) > carryCap;
}

/**
 * Classic/canonical weapon per fighting style from the Fighting Styles Compendium.
 * Using the classic weapon grants a +1 ATT bonus in combat.
 */
export const STYLE_CLASSIC_WEAPONS: Record<string, string> = {
  [FightingStyle.AimedBlow]:       "dagger",        // Quarterstaff (mapped to dagger as precision weapon)
  [FightingStyle.BashingAttack]:   "mace",           // Mace
  [FightingStyle.LungingAttack]:   "epee",           // Short Spear → Epée (closest jabbing weapon)
  [FightingStyle.ParryLunge]:      "longsword",      // Longsword
  [FightingStyle.ParryRiposte]:    "epee",           // Epée
  [FightingStyle.ParryStrike]:     "broadsword",     // Broad weapon variety
  [FightingStyle.SlashingAttack]:  "scimitar",       // Scimitar
  [FightingStyle.StrikingAttack]:  "broadsword",     // Broadsword
  [FightingStyle.TotalParry]:      "short_sword",    // Shield emphasis (weapon secondary)
  [FightingStyle.WallOfSteel]:     "morning_star",   // Morning Star
};

/** Returns +1 if the warrior is using their style's classic weapon, 0 otherwise */
export function getClassicWeaponBonus(style: FightingStyle, weaponId: string): number {
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
