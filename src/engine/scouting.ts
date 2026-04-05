/**
 * Scouting System — gather intel on upcoming opponents.
 * 
 * Scouting reveals partial information about an opponent:
 * - Style (always visible)
 * - Approximate attribute text descriptions (based on scout quality)
 * - Win/loss record
 * - Known injuries
 * - Suspected fight plan tendencies
 */
import type { Warrior, InsightToken, InsightTokenType } from "@/types/game";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/types/game";
import { generateId } from "@/utils/idUtils";

export type ScoutQuality = "Basic" | "Detailed" | "Expert";

export interface ScoutReport {
  id: string;
  warriorName: string;
  style: string;
  quality: ScoutQuality;
  week: number;
  /** Attribute ranges mapped to text descriptions */
  attributeRanges: Record<string, string>;
  record: string;
  knownInjuries: string[];
  suspectedOE?: string; // "Low" | "Medium" | "High"
  suspectedAL?: string;
  notes: string;
}

const QUALITY_FUZZ: Record<ScoutQuality, number> = {
  Basic: 5,
  Detailed: 3,
  Expert: 1,
};

const SCOUT_COST: Record<ScoutQuality, number> = {
  Basic: 25,
  Detailed: 50,
  Expert: 100,
};

export function getScoutCost(quality: ScoutQuality): number {
  return SCOUT_COST[quality];
}

/** Converts a numerical stat into a qualitative text description */
export function getAttributeDescription(value: number): string {
  if (value <= 5) return "Pathetic";
  if (value <= 8) return "Weak";
  if (value <= 11) return "Average";
  if (value <= 14) return "Good";
  if (value <= 17) return "Great";
  if (value <= 20) return "Exceptional";
  return "Monstrous";
}

/** Converts a stat range into a textual description */
export function getAttributeRangeDescription(low: number, high: number): string {
  const lowDesc = getAttributeDescription(low);
  const highDesc = getAttributeDescription(high);

  if (lowDesc === highDesc) return lowDesc;
  return `${lowDesc} to ${highDesc}`;
}

/** Generate a scout report for a warrior */
export function generateScoutReport(
  warrior: Warrior,
  quality: ScoutQuality,
  week: number,
  rng: () => number = Math.random
): { report: ScoutReport; newInsights: InsightToken[] } {
  const fuzz = QUALITY_FUZZ[quality];

  const attributeRanges: Record<string, string> = {};
  for (const key of ATTRIBUTE_KEYS) {
    const val = warrior.attributes[key];
    const low = Math.max(3, val - fuzz + Math.floor(rng() * 2));
    const high = Math.min(25, val + fuzz - Math.floor(rng() * 2));
    attributeRanges[key] = getAttributeRangeDescription(low, high);
  }

  const record = `${warrior.career.wins}W-${warrior.career.losses}L`;

  const knownInjuries: string[] = [];
  if (quality !== "Basic") {
    // Show injury names (not details)
    for (const inj of warrior.injuries) {
      if (typeof inj === "string") knownInjuries.push(inj);
    }
  }

  let suspectedOE: string | undefined;
  let suspectedAL: string | undefined;
  if (quality === "Expert" && warrior.plan) {
    suspectedOE = warrior.plan.OE >= 7 ? "High" : warrior.plan.OE >= 4 ? "Medium" : "Low";
    suspectedAL = warrior.plan.AL >= 7 ? "High" : warrior.plan.AL >= 4 ? "Medium" : "Low";
  }

  const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;
  const notes = quality === "Basic"
    ? `${warrior.name} fights as a ${styleName}. Limited intel available.`
    : quality === "Detailed"
    ? `${warrior.name} is a ${styleName} with ${record}. ${warrior.fame > 3 ? "Well-known in the arena." : "Relatively unknown."}`
    : `${warrior.name} is an experienced ${styleName} (${record}). ${
        warrior.career.kills > 0 ? `Known killer (${warrior.career.kills} kills).` : "No kills on record."
      }`;


  const newInsights: InsightToken[] = [];

  // Basic scouting reveals Style
  newInsights.push({
    id: generateId(),
    type: "Style",
    warriorId: warrior.id,
    warriorName: warrior.name,
    detail: `Identified as ${styleName}`,
    discoveredWeek: week
  });

  // Detailed scouting reveals 2 random attributes
  if (quality === "Detailed" || quality === "Expert") {
    const attrsToReveal = [...ATTRIBUTE_KEYS].sort(() => 0.5 - rng()).slice(0, quality === "Expert" ? 4 : 2);
    attrsToReveal.forEach(attr => {
      newInsights.push({
        id: generateId(),
        type: "Attribute",
        warriorId: warrior.id,
        warriorName: warrior.name,
        targetKey: attr,
        detail: `Discovered exact ${ATTRIBUTE_LABELS[attr] ?? attr}`,
        discoveredWeek: week
      });
    });
  }

  // Expert scouting reveals Tactics
  if (quality === "Expert" && warrior.plan) {
    newInsights.push({
      id: generateId(),
      type: "Tactic",
      warriorId: warrior.id,
      warriorName: warrior.name,
      detail: `Suspected OE: ${suspectedOE}, AL: ${suspectedAL}`,
      discoveredWeek: week
    });
  }

  return {
    report: {
      id: generateId(),
      warriorName: warrior.name,
      style: warrior.style,
      quality,
      week,
      attributeRanges,
      record,
      knownInjuries,
      suspectedOE,
      suspectedAL,
      notes,
    },
    newInsights
  };

}
