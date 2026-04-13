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
  // Weapon stat requirements (canonical minimums from Terrablood)
  reqST?: number;          // minimum Strength
  reqSZ?: number;          // minimum Size
  reqWT?: number;          // minimum Wit
  reqDF?: number;          // minimum Deftness
}

// ─── Single-Handed Weapons ──────────────────────────────────────────────────

export const WEAPONS: EquipmentItem[] = [
  // Light weapons (weight 1-2) — low requirements
  // preferredStyles = Terrablood W or CW rating; restrictedStyles = hard blocks (2H+shield conflicts or U-rated for style identity)
  { id: "dagger",       code: "DA", name: "Dagger",         slot: "weapon", weight: 1, reqST: 3, reqSZ: 3, reqWT: 5, reqDF: 7, description: "Fast, light. Precise styles excel.", preferredStyles: [FightingStyle.AimedBlow, FightingStyle.StrikingAttack] },
  { id: "epee",         code: "EP", name: "Epée",           slot: "weapon", weight: 2, reqST: 7, reqSZ: 3, reqWT: 15, reqDF: 15, description: "Thrusting weapon. CW for Parry-Riposte. W for most styles.", preferredStyles: [FightingStyle.ParryRiposte, FightingStyle.StrikingAttack, FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.ParryLunge, FightingStyle.ParryStrike, FightingStyle.TotalParry, FightingStyle.AimedBlow] },
  { id: "hatchet",      code: "HA", name: "Hatchet",        slot: "weapon", weight: 2, reqST: 7, reqSZ: 3, reqWT: 7, reqDF: 7, description: "Light chopping weapon. Quick and versatile.", preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.SlashingAttack] },
  { id: "short_sword",  code: "SH", name: "Shortsword",     slot: "weapon", weight: 2, reqST: 5, reqSZ: 3, reqWT: 3, reqDF: 7, description: "Versatile light blade. CW for Parry-Strike. W for most styles.", preferredStyles: [FightingStyle.ParryStrike, FightingStyle.StrikingAttack, FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryLunge, FightingStyle.TotalParry, FightingStyle.ParryRiposte, FightingStyle.AimedBlow] },
  { id: "small_shield", code: "SM", name: "Small Shield",   slot: "weapon", weight: 2, reqST: 5, reqSZ: 3, reqWT: 11, reqDF: 3, description: "Light shield. CW for Total-Parry.", preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel] },
  { id: "war_hammer",   code: "WH", name: "War Hammer",     slot: "weapon", weight: 2, reqST: 13, reqSZ: 3, reqWT: 5, reqDF: 7, description: "Light crushing weapon. Armor-piercing.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.ParryStrike], restrictedStyles: [FightingStyle.AimedBlow] },

  // Medium weapons (weight 3-4)
  { id: "scimitar",     code: "SC", name: "Scimitar",       slot: "weapon", weight: 3, reqST: 9, reqSZ: 3, reqWT: 11, reqDF: 11, description: "Curved slashing blade. CW for Slasher. W for most styles.", preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryLunge, FightingStyle.ParryStrike, FightingStyle.TotalParry, FightingStyle.ParryRiposte, FightingStyle.AimedBlow] },
  { id: "mace",         code: "MA", name: "Mace",           slot: "weapon", weight: 3, reqST: 9, reqSZ: 3, reqWT: 3, reqDF: 7, description: "Crushing weapon. CW for Basher.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "longsword",    code: "LO", name: "Longsword",      slot: "weapon", weight: 3, reqST: 11, reqSZ: 3, reqWT: 13, reqDF: 11, description: "Versatile blade. CW for Parry-Lunge. W for most styles.", preferredStyles: [FightingStyle.ParryLunge, FightingStyle.StrikingAttack, FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.ParryStrike, FightingStyle.TotalParry, FightingStyle.ParryRiposte, FightingStyle.AimedBlow] },
  { id: "battle_axe",   code: "BA", name: "Battle Axe",     slot: "weapon", weight: 4, reqST: 15, reqSZ: 7, reqWT: 7, reqDF: 9, description: "Heavy chopping weapon. Better for Strikers and Slashers than Bashers.", preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.SlashingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryStrike, FightingStyle.TotalParry], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "broadsword",   code: "BS", name: "Broadsword",     slot: "weapon", weight: 4, reqST: 11, reqSZ: 3, reqWT: 9, reqDF: 7, description: "Standard arena sword. CW for Striker. W for most styles.", preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.SlashingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryStrike, FightingStyle.TotalParry, FightingStyle.AimedBlow] },
  { id: "medium_shield",code: "ME", name: "Medium Shield",  slot: "weapon", weight: 4, reqST: 7, reqSZ: 3, reqWT: 11, reqDF: 3, description: "Standard shield. CW for Total-Parry. +2 DEF.", preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel], restrictedStyles: [FightingStyle.LungingAttack] },
  { id: "morning_star", code: "MS", name: "Morning Star",   slot: "weapon", weight: 4, reqST: 13, reqSZ: 3, reqWT: 9, reqDF: 11, description: "Spiked crushing weapon. CW for Wall of Steel.", preferredStyles: [FightingStyle.WallOfSteel, FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack] },
  { id: "short_spear",  code: "SS", name: "Short Spear",    slot: "weapon", weight: 4, reqST: 9, reqSZ: 3, reqWT: 5, reqDF: 7, description: "Thrusting polearm. CW for Lunger. W for parry styles.", preferredStyles: [FightingStyle.LungingAttack, FightingStyle.StrikingAttack, FightingStyle.ParryLunge, FightingStyle.ParryStrike, FightingStyle.ParryRiposte, FightingStyle.AimedBlow] },
  { id: "war_flail",    code: "WF", name: "War Flail",      slot: "weapon", weight: 4, reqST: 11, reqSZ: 3, reqWT: 5, reqDF: 5, description: "Chained weapon. Hard to parry.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel], restrictedStyles: [FightingStyle.AimedBlow] },
  { id: "large_shield", code: "LG", name: "Large Shield",   slot: "weapon", weight: 6, reqST: 13, reqSZ: 3, reqWT: 3, reqDF: 7, description: "Tower shield. CW for Total-Parry. +3 DEF, -1 ATT.", preferredStyles: [FightingStyle.TotalParry], restrictedStyles: [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow] },

  // Two-handed weapons — higher requirements
  { id: "quarterstaff", code: "QS", name: "Quarterstaff",   slot: "weapon", weight: 4, reqST: 11, reqSZ: 9, reqWT: 11, reqDF: 11, twoHanded: true, description: "Balanced staff. CW for Aimed-Blow. W for many styles.", preferredStyles: [FightingStyle.AimedBlow, FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryStrike, FightingStyle.TotalParry] },
  { id: "great_axe",    code: "GA", name: "Great Axe",      slot: "weapon", weight: 5, reqST: 13, reqSZ: 3, reqWT: 9, reqDF: 11, twoHanded: true, description: "Massive chopping weapon. No shield.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.SlashingAttack, FightingStyle.WallOfSteel], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry] },
  { id: "greatsword",   code: "GS", name: "Greatsword",     slot: "weapon", weight: 6, reqST: 15, reqSZ: 9, reqWT: 9, reqDF: 11, twoHanded: true, description: "Massive two-handed blade. No shield.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel, FightingStyle.ParryStrike], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry] },
  { id: "long_spear",   code: "LS", name: "Long Spear",     slot: "weapon", weight: 6, reqST: 11, reqSZ: 9, reqWT: 5, reqDF: 9, twoHanded: true, description: "Maximum reach polearm. No shield.", preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.LungingAttack, FightingStyle.ParryLunge, FightingStyle.AimedBlow], restrictedStyles: [FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
  { id: "halberd",      code: "HL", name: "Halberd",        slot: "weapon", weight: 8, reqST: 17, reqSZ: 9, reqWT: 9, reqDF: 11, twoHanded: true, description: "Polearm with devastating reach. No shield.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
  { id: "maul",         code: "ML", name: "Maul",           slot: "weapon", weight: 8, reqST: 15, reqSZ: 9, reqWT: 5, reqDF: 7, twoHanded: true, description: "Giant war hammer. No shield.", preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack], restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack, FightingStyle.TotalParry, FightingStyle.ParryRiposte] },
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

/** Check weapon stat requirements against warrior attributes. Returns penalty details. */
export interface WeaponReqCheck {
  stat: "ST" | "SZ" | "WT" | "DF";
  label: string;
  required: number;
  current: number;
  deficit: number;
}
export interface WeaponReqResult {
  met: boolean;
  failures: WeaponReqCheck[];
  attPenalty: number;        // -2 per failed requirement
  endurancePenalty: number;  // +10% per failed requirement (as multiplier, e.g. 1.2)
}

export function checkWeaponRequirements(
  weaponId: string,
  attrs: { ST: number; SZ: number; WT: number; DF: number }
): WeaponReqResult {
  const item = getItemById(weaponId);
  if (!item || item.slot !== "weapon") return { met: true, failures: [], attPenalty: 0, endurancePenalty: 1 };

  const checks: WeaponReqCheck[] = [];
  if (item.reqST && attrs.ST < item.reqST)
    checks.push({ stat: "ST", label: "Strength", required: item.reqST, current: attrs.ST, deficit: item.reqST - attrs.ST });
  if (item.reqSZ && attrs.SZ < item.reqSZ)
    checks.push({ stat: "SZ", label: "Size", required: item.reqSZ, current: attrs.SZ, deficit: item.reqSZ - attrs.SZ });
  if (item.reqWT && attrs.WT < item.reqWT)
    checks.push({ stat: "WT", label: "Wit", required: item.reqWT, current: attrs.WT, deficit: item.reqWT - attrs.WT });
  if (item.reqDF && attrs.DF < item.reqDF)
    checks.push({ stat: "DF", label: "Deftness", required: item.reqDF, current: attrs.DF, deficit: item.reqDF - attrs.DF });

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
 * Classic/canonical weapon per fighting style — from Terrablood Duel II tables.
 * Using the classic weapon grants a +1 ATT bonus in combat.
 * Total-Parry is special: ANY shield is the classic weapon.
 */
export const STYLE_CLASSIC_WEAPONS: Record<string, string> = {
  [FightingStyle.AimedBlow]:       "quarterstaff",  // CW: Quarterstaff
  [FightingStyle.BashingAttack]:   "mace",          // CW: Mace
  [FightingStyle.LungingAttack]:   "short_spear",   // CW: Short Spear
  [FightingStyle.ParryLunge]:      "longsword",     // CW: Longsword
  [FightingStyle.ParryRiposte]:    "epee",          // CW: Epée
  [FightingStyle.ParryStrike]:     "short_sword",   // CW: Shortsword (was broadsword — corrected from Terrablood)
  [FightingStyle.SlashingAttack]:  "scimitar",      // CW: Scimitar
  [FightingStyle.StrikingAttack]:  "broadsword",    // CW: Broadsword
  [FightingStyle.TotalParry]:      "medium_shield", // CW: Any Shield (medium as default display)
  [FightingStyle.WallOfSteel]:     "morning_star",  // CW: Morning Star
};

const SHIELD_IDS = new Set(["small_shield", "medium_shield", "large_shield"]);

/** Returns +1 if the warrior is using their style's classic weapon, 0 otherwise.
 *  Total-Parry: any shield qualifies. */
export function getClassicWeaponBonus(style: FightingStyle, weaponId: string): number {
  if (style === FightingStyle.TotalParry) {
    return SHIELD_IDS.has(weaponId) ? 1 : 0;
  }
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
