/**
 * Stable Lords — Canonical Equipment Database
 * Weapons, armor, shields, helms with codes, weights, style restrictions.
 * Based on canonical Duelmasters equipment tables.
 */
import { FightingStyle } from "@/types/game";

// ─── Slot Types ─────────────────────────────────────────────────────────────

export type EquipmentSlot = "weapon" | "armor" | "shield" | "helm";

export interface EquipmentItem {
  id: string;
  code: string;           // canonical 2-letter code (DA, EP, BS, etc.)
  name: string;
  slot: EquipmentSlot;
  weight: number;          // canonical encumbrance cost
  description: string;
  twoHanded?: boolean;     // weapons only — blocks shield slot
  restrictedStyles?: FightingStyle[]; // styles that CANNOT use this
  preferredStyles?: FightingStyle[];  // styles that get a bonus with this
}

// ─── Single-Handed Weapons ──────────────────────────────────────────────────

export const WEAPONS: EquipmentItem[] = [
  // Light weapons (weight 1-2)
  { id: "dagger",       code: "DA", name: "Dagger",         slot: "weapon", weight: 1, description: "Fast, light. Favored by aimed-blow and lungers.", preferredStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "epee",         code: "EP", name: "Epée",           slot: "weapon", weight: 2, description: "Thrusting weapon for precise styles.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.ParryLunge, FightingStyle.ParryRiposte] },
  { id: "hatchet",      code: "HA", name: "Hatchet",        slot: "weapon", weight: 2, description: "Light chopping weapon. Quick and versatile.", preferredStyles: [FightingStyle.StrikingAttack] },
  { id: "short_sword",  code: "SH", name: "Shortsword",     slot: "weapon", weight: 2, description: "Versatile light blade. No restrictions." },
  { id: "small_shield", code: "SM", name: "Small Shield",   slot: "weapon", weight: 2, description: "Off-hand small shield used as weapon-slot blocker.", preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel] },
  { id: "war_hammer",   code: "WH", name: "War Hammer",     slot: "weapon", weight: 2, description: "Light crushing weapon. Armor-piercing.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow] },

  // Medium weapons (weight 3-4)
  { id: "scimitar",     code: "SC", name: "Scimitar",       slot: "weapon", weight: 3, description: "Curved slashing blade.", preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.StrikingAttack] },
  { id: "mace",         code: "MA", name: "Mace",           slot: "weapon", weight: 3, description: "Crushing weapon. Reliable and brutal.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "longsword",    code: "LO", name: "Longsword",      slot: "weapon", weight: 3, description: "Versatile blade, good reach.", preferredStyles: [FightingStyle.ParryStrike, FightingStyle.ParryLunge, FightingStyle.SlashingAttack] },
  { id: "battle_axe",   code: "BA", name: "Battle Axe",     slot: "weapon", weight: 4, description: "Devastating chopping weapon.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "broadsword",   code: "BS", name: "Broadsword",     slot: "weapon", weight: 4, description: "Standard arena sword. Well-balanced.", preferredStyles: [FightingStyle.ParryStrike, FightingStyle.WallOfSteel, FightingStyle.StrikingAttack] },
  { id: "medium_shield",code: "ME", name: "Medium Shield",  slot: "weapon", weight: 4, description: "Standard shield. +2 DEF.", preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel], restrictedStyles: [FightingStyle.LungingAttack] },
  { id: "morning_star", code: "MS", name: "Morning Star",   slot: "weapon", weight: 4, description: "Spiked crushing weapon.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.WallOfSteel], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "short_spear",  code: "SS", name: "Short Spear",    slot: "weapon", weight: 4, description: "Thrusting polearm. Good reach.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack] },
  { id: "war_flail",    code: "WF", name: "War Flail",      slot: "weapon", weight: 4, description: "Chained striking weapon. Hard to parry.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "large_shield", code: "LG", name: "Large Shield",   slot: "weapon", weight: 6, description: "Tower shield. +3 DEF, -1 ATT.", preferredStyles: [FightingStyle.TotalParry], restrictedStyles: [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow] },

  // Two-handed weapons
  { id: "quarterstaff", code: "QS", name: "Quarterstaff",   slot: "weapon", weight: 4, twoHanded: true, description: "Balanced staff. Fast two-handed option.", preferredStyles: [FightingStyle.AimedBlow, FightingStyle.ParryStrike, FightingStyle.WallOfSteel] },
  { id: "great_axe",    code: "GA", name: "Great Axe",      slot: "weapon", weight: 5, twoHanded: true, description: "Massive chopping weapon. No shield.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry] },
  { id: "greatsword",   code: "GS", name: "Greatsword",     slot: "weapon", weight: 6, twoHanded: true, description: "Massive two-handed blade. No shield.", preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry] },
  { id: "long_spear",   code: "LS", name: "Long Spear",     slot: "weapon", weight: 6, twoHanded: true, description: "Maximum reach polearm. No shield.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
  { id: "halberd",      code: "HL", name: "Halberd",        slot: "weapon", weight: 8, twoHanded: true, description: "Polearm with devastating reach. No shield.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
  { id: "maul",         code: "ML", name: "Maul",           slot: "weapon", weight: 8, twoHanded: true, description: "Giant war hammer. No shield.", preferredStyles: [FightingStyle.BashingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
];

// ─── Armor ──────────────────────────────────────────────────────────────────

export const ARMORS: EquipmentItem[] = [
  { id: "none_armor",    code: "",   name: "None",            slot: "armor", weight: 0,  description: "No armor. Maximum speed." },
  { id: "leather",       code: "ALE",name: "Leather",         slot: "armor", weight: 2,  description: "Light protection. Minimal encumbrance." },
  { id: "padded_leather",code: "APL",name: "Padded Leather",  slot: "armor", weight: 4,  description: "Reinforced leather. Good balance." },
  { id: "ring_mail",     code: "ARM",name: "Ringmail",        slot: "armor", weight: 6,  description: "Linked rings over padding." },
  { id: "scale_mail",    code: "ASM",name: "Scalemail",       slot: "armor", weight: 8,  description: "Overlapping metal scales. Heavy." },
  { id: "chain_mail",    code: "ACM",name: "Chainmail",       slot: "armor", weight: 10, description: "Interlocking metal rings. Standard heavy protection." },
  { id: "plate_mail",    code: "APM",name: "Platemail",       slot: "armor", weight: 12, description: "Full plate mail. Very heavy.", restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "plate_armor",   code: "APA",name: "Plate Armor",     slot: "armor", weight: 14, description: "Maximum protection. Extremely heavy.", restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack, FightingStyle.SlashingAttack] },
];

// ─── Helms ──────────────────────────────────────────────────────────────────

export const HELMS: EquipmentItem[] = [
  { id: "none_helm",    code: "",  name: "None",         slot: "helm", weight: 0, description: "No helm. Risky but light." },
  { id: "leather_cap",  code: "L", name: "Leather Cap",  slot: "helm", weight: 1, description: "Basic head protection." },
  { id: "steel_cap",    code: "S", name: "Steel Cap",    slot: "helm", weight: 2, description: "Open-faced metal helm." },
  { id: "helm",         code: "H", name: "Helm",         slot: "helm", weight: 3, description: "Standard enclosed helm." },
  { id: "full_helm",    code: "FF",name: "Full Helm",    slot: "helm", weight: 4, description: "Fully enclosed helm. Great protection, reduces visibility.", restrictedStyles: [FightingStyle.AimedBlow] },
];

// ─── Shields (offhand — separate from weapon-slot shields) ──────────────────
// NOTE: In canonical Duelmasters, shields are listed alongside weapons.
// Small Shield, Medium Shield, and Large Shield appear in the weapons list above.
// This array provides "no shield" for the offhand slot when using a one-handed weapon
// without a shield, or when the weapon IS a shield.

export const SHIELDS: EquipmentItem[] = [
  { id: "none_shield",  code: "",  name: "None", slot: "shield", weight: 0, description: "No shield. Free off-hand." },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export const ALL_EQUIPMENT: EquipmentItem[] = [...WEAPONS, ...ARMORS, ...SHIELDS, ...HELMS];

export function getItemById(id: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.id === id);
}

export function getItemByCode(code: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.code === code);
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
  [FightingStyle.AimedBlow]:       "quarterstaff",   // Quarterstaff (canonical AB weapon)
  [FightingStyle.BashingAttack]:   "mace",           // Mace
  [FightingStyle.LungingAttack]:   "short_spear",    // Short Spear
  [FightingStyle.ParryLunge]:      "longsword",      // Longsword
  [FightingStyle.ParryRiposte]:    "epee",           // Epée
  [FightingStyle.ParryStrike]:     "broadsword",     // Broadsword
  [FightingStyle.SlashingAttack]:  "scimitar",       // Scimitar
  [FightingStyle.StrikingAttack]:  "broadsword",     // Broadsword
  [FightingStyle.TotalParry]:      "short_sword",    // Shield emphasis (weapon secondary)
  [FightingStyle.WallOfSteel]:     "morning_star",   // Morning Star
};

/** Returns +1 if the warrior is using their style's classic weapon, 0 otherwise */
export function getClassicWeaponBonus(style: FightingStyle, weaponId: string): number {
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
