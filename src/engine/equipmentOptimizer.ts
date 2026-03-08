/**
 * Equipment Optimizer — recommends optimal gear by fighting style.
 * Analyzes encumbrance tradeoffs and style synergy.
 */
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import {
  WEAPONS, ARMORS, SHIELDS, HELMS,
  type EquipmentItem, type EquipmentLoadout,
  getAvailableItems, getLoadoutWeight, isPreferredWeapon,
} from "@/data/equipment";

export interface GearRecommendation {
  loadout: EquipmentLoadout;
  label: string;
  description: string;
  totalWeight: number;
  synergy: number; // 0-100 score
  breakdown: {
    weapon: { item: EquipmentItem; preferred: boolean };
    armor: { item: EquipmentItem };
    shield: { item: EquipmentItem; blocked: boolean };
    helm: { item: EquipmentItem };
  };
}

type BuildProfile = "speed" | "balanced" | "tank" | "damage";

const STYLE_PROFILES: Record<FightingStyle, BuildProfile[]> = {
  [FightingStyle.AimedBlow]: ["speed", "balanced"],
  [FightingStyle.BashingAttack]: ["damage", "tank"],
  [FightingStyle.LungingAttack]: ["speed", "balanced"],
  [FightingStyle.ParryLunge]: ["balanced", "speed"],
  [FightingStyle.ParryRiposte]: ["balanced", "speed"],
  [FightingStyle.ParryStrike]: ["balanced", "tank"],
  [FightingStyle.SlashingAttack]: ["damage", "balanced"],
  [FightingStyle.StrikingAttack]: ["damage", "balanced"],
  [FightingStyle.TotalParry]: ["tank", "balanced"],
  [FightingStyle.WallOfSteel]: ["tank", "balanced"],
};

const PROFILE_LABELS: Record<BuildProfile, string> = {
  speed: "Lightning Build",
  balanced: "Balanced Build",
  tank: "Fortress Build",
  damage: "Power Build",
};

const PROFILE_DESCS: Record<BuildProfile, string> = {
  speed: "Minimal encumbrance for maximum initiative and mobility.",
  balanced: "Moderate protection without sacrificing speed.",
  tank: "Heavy armor and shields — outlast opponents through defense.",
  damage: "Heavy weapons for maximum damage output.",
};

function scoreWeapon(item: EquipmentItem, style: FightingStyle, profile: BuildProfile): number {
  let score = 10;
  if (isPreferredWeapon(item, style)) score += 30;
  if (profile === "speed" && item.weight <= 2) score += 15;
  if (profile === "damage" && item.weight >= 5) score += 15;
  if (profile === "balanced" && item.weight >= 2 && item.weight <= 4) score += 10;
  if (profile === "tank" && item.weight <= 4) score += 5;
  return score;
}

function scoreArmor(item: EquipmentItem, profile: BuildProfile): number {
  if (profile === "speed") return item.weight <= 1 ? 30 : item.weight <= 2 ? 15 : 0;
  if (profile === "damage") return item.weight <= 3 ? 20 : 10;
  if (profile === "tank") return item.weight >= 5 ? 30 : item.weight >= 3 ? 20 : 5;
  // balanced
  return item.weight >= 2 && item.weight <= 4 ? 25 : 10;
}

function scoreShield(item: EquipmentItem, profile: BuildProfile): number {
  if (item.id === "none_shield") return profile === "speed" || profile === "damage" ? 20 : 5;
  if (profile === "tank") return item.weight >= 3 ? 30 : 20;
  if (profile === "speed") return item.weight <= 1 ? 15 : 0;
  return item.weight <= 2 ? 15 : 10;
}

function scoreHelm(item: EquipmentItem, profile: BuildProfile): number {
  if (item.id === "none_helm") return profile === "speed" ? 20 : 5;
  if (profile === "tank") return item.weight >= 2 ? 25 : 15;
  if (profile === "speed") return item.weight <= 1 ? 20 : 5;
  return item.weight <= 2 ? 20 : 10;
}

function bestItem(items: EquipmentItem[], scorer: (i: EquipmentItem) => number): EquipmentItem {
  return items.reduce((best, item) => scorer(item) > scorer(best) ? item : best, items[0]);
}

export function generateRecommendations(style: FightingStyle, carryCap: number): GearRecommendation[] {
  const profiles = STYLE_PROFILES[style] ?? ["balanced"];
  const weapons = getAvailableItems("weapon", style);
  const armors = getAvailableItems("armor", style);
  const shields = getAvailableItems("shield", style);
  const helms = getAvailableItems("helm", style);

  return profiles.map(profile => {
    const weapon = bestItem(weapons, w => scoreWeapon(w, style, profile));
    const isTwoHanded = weapon.twoHanded ?? false;
    const armor = bestItem(armors, a => scoreArmor(a, profile));
    const shield = isTwoHanded
      ? shields.find(s => s.id === "none_shield")!
      : bestItem(shields, s => scoreShield(s, profile));
    const helm = bestItem(helms, h => scoreHelm(h, profile));

    const loadout: EquipmentLoadout = {
      weapon: weapon.id,
      armor: armor.id,
      shield: shield.id,
      helm: helm.id,
    };

    const totalWeight = getLoadoutWeight(loadout);
    const preferred = isPreferredWeapon(weapon, style);

    // Synergy score: 0-100
    let synergy = 40;
    if (preferred) synergy += 25;
    if (totalWeight <= carryCap) synergy += 20;
    if (totalWeight <= carryCap * 0.7) synergy += 15;

    return {
      loadout,
      label: PROFILE_LABELS[profile],
      description: PROFILE_DESCS[profile],
      totalWeight,
      synergy: Math.min(100, synergy),
      breakdown: {
        weapon: { item: weapon, preferred },
        armor: { item: armor },
        shield: { item: shield, blocked: isTwoHanded },
        helm: { item: helm },
      },
    };
  });
}

/** Get style-specific equipment tips */
export function getStyleEquipmentTips(style: FightingStyle): string[] {
  const tips: Record<FightingStyle, string[]> = {
    [FightingStyle.AimedBlow]: [
      "Daggers and epées are your best friends — light weapons maximize your precision.",
      "Avoid heavy armor — you need the mobility for targeted strikes.",
      "Full helms are restricted for your style (blocks aimed shots).",
    ],
    [FightingStyle.BashingAttack]: [
      "Heavy weapons like maces, morning stars, and mauls deal devastating damage.",
      "You can afford heavier armor since mobility matters less.",
      "Two-handed weapons trade shield protection for raw power.",
    ],
    [FightingStyle.LungingAttack]: [
      "Epées and rapiers are ideal — light thrusting weapons.",
      "Stay light on armor to maintain your speed advantage.",
      "Medium+ shields are restricted — they interfere with lunging footwork.",
    ],
    [FightingStyle.ParryLunge]: [
      "Rapiers and epées complement your parry-then-thrust technique.",
      "Bucklers add parry bonus without encumbering you.",
      "Moderate armor works well — you're a hybrid fighter.",
    ],
    [FightingStyle.ParryRiposte]: [
      "Light-medium weapons give you the speed for ripostes.",
      "Shields complement your defensive foundation.",
      "Don't over-encumber — you need defense stat preservation.",
    ],
    [FightingStyle.ParryStrike]: [
      "Broadswords and longswords are your most efficient weapons.",
      "Moderate armor and a small shield is the optimal balance.",
      "You're the most gear-flexible style — experiment freely.",
    ],
    [FightingStyle.SlashingAttack]: [
      "Scimitars, longswords, and greatswords maximize slashing arcs.",
      "Large shields are restricted — they block your swing.",
      "Medium armor balances protection with mobility.",
    ],
    [FightingStyle.StrikingAttack]: [
      "Battle axes and greatswords deliver maximum striking force.",
      "You can handle moderate encumbrance without losing effectiveness.",
      "Heavy weapons + medium armor is a strong default.",
    ],
    [FightingStyle.TotalParry]: [
      "Weapon choice matters less — your defense is what wins.",
      "Maximize armor and shield for the ultimate defensive wall.",
      "Two-handed weapons and greatswords are restricted for your style.",
    ],
    [FightingStyle.WallOfSteel]: [
      "Broadswords are ideal for maintaining constant blade motion.",
      "Moderate armor keeps you mobile enough for the blade wall.",
      "Shield + medium weapon is your classic configuration.",
    ],
  };
  return tips[style] ?? [];
}
