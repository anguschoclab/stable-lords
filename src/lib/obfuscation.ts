import { Warrior, InsightToken, FightingStyle, Attributes } from "@/types/game";

// Obfuscated representation of a warrior for the UI
export interface ObfuscatedWarrior extends Omit<Warrior, "style" | "attrs" | "defaultPlan"> {
  style: FightingStyle | "UNKNOWN";
  attrs: {
    ST: number | string;
    AG: number | string;
    EN: number | string;
    WI: number | string;
    CN: number | string;
    AP: number | string;
  };
  defaultPlan?: any; // Hidden unless known
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
      return warrior.attrs[key];
    }
    // Return a qualitative band instead of the exact number
    const val = warrior.attrs[key];
    if (val >= 21) return "Monstrous";
    if (val >= 17) return "Exceptional";
    if (val >= 13) return "High";
    if (val >= 9) return "Average";
    if (val >= 5) return "Low";
    return "Pitiful";
  };

  return {
    ...warrior,
    style: knowsStyle ? warrior.style : "UNKNOWN" as any,
    attrs: {
      ST: getAttr("ST"),
      AG: getAttr("AG"),
      EN: getAttr("EN"),
      WI: getAttr("WI"),
      CN: getAttr("CN"),
      AP: getAttr("AP"),
    },
    // Hide the actual fight plan completely
    defaultPlan: undefined,
    isFullyRevealed: false,
  };
}
