import { Warrior, InsightToken, FightingStyle, Attributes, FightPlan } from "@/types/game";

// Obfuscated representation of a warrior for the UI
export interface ObfuscatedWarrior extends Omit<Warrior, "style" | "attributes" | "defaultPlan"> {
  style: FightingStyle | "UNKNOWN";
  attributes: {
    ST: number | string;
    CN: number | string;
    SZ: number | string;
    WT: number | string;
    WL: number | string;
    SP: number | string;
    DF: number | string;
  };
  defaultPlan?: FightPlan | undefined; // Hidden unless known
  isFullyRevealed: boolean;
}

/**
 * Returns a masked version of the warrior based on the player's gathered InsightTokens.
 */
export function obfuscateWarrior(
  warrior: Warrior,
  insights: InsightToken[],
  isOwnedByPlayer: boolean
): ObfuscatedWarrior {
  if (isOwnedByPlayer) {
    return { ...warrior, isFullyRevealed: true };
  }

  const warriorInsights = insights.filter((i) => i.warriorId === warrior.id);

  // Has style insight?
  const knowsStyle = warriorInsights.some((i) => i.type === "Style");

  // Map known attributes
  const knownAttrs = warriorInsights
    .filter((i) => i.type === "Attribute" && i.targetKey)
    .map((i) => i.targetKey as keyof Attributes);

  // Helper to mask an attribute if unknown
  const getAttr = (key: keyof Attributes) => {
    if (knownAttrs.includes(key)) {
      return warrior.attributes[key];
    }
    // Return a qualitative band instead of the exact number
    const val = warrior.attributes[key];
    if (val >= 21) return "Monstrous";
    if (val >= 17) return "Exceptional";
    if (val >= 13) return "High";
    if (val >= 9) return "Average";
    if (val >= 5) return "Low";
    return "Pitiful";
  };

  return {
    ...warrior,
    style: knowsStyle ? warrior.style : "UNKNOWN" as import("@/types/game").FightingStyle,
    attributes: {
      ST: getAttr("ST"),
      CN: getAttr("CN"),
      SZ: getAttr("SZ"),
      WT: getAttr("WT"),
      WL: getAttr("WL"),
      SP: getAttr("SP"),
      DF: getAttr("DF"),
    },
    // Hide the actual fight plan completely
    defaultPlan: undefined,
    isFullyRevealed: false,
  };
}
