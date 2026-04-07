/**
 * Stable Lords — Crowd Mood System
 * Arena-wide mood states that affect fame gain, kill probability, and gazette tone.
 */
import type { FightSummary } from "@/types/combat.types";

export type CrowdMood = "Calm" | "Bloodthirsty" | "Theatrical" | "Solemn" | "Festive";

export const CROWD_MOODS: CrowdMood[] = ["Calm", "Bloodthirsty", "Theatrical", "Solemn", "Festive"];

export const MOOD_DESCRIPTIONS: Record<CrowdMood, string> = {
  Calm: "The crowd watches with quiet anticipation.",
  Bloodthirsty: "The mob roars for blood! Kill probability increased.",
  Theatrical: "The audience craves spectacle. Flashy fighters gain extra popularity.",
  Solemn: "A somber mood lingers after recent deaths. Fame gains are muted.",
  Festive: "Festival atmosphere! Fame and popularity gains are boosted.",
};

export const MOOD_ICONS: Record<CrowdMood, string> = {
  Calm: "😐",
  Bloodthirsty: "🩸",
  Theatrical: "🎭",
  Solemn: "🕯️",
  Festive: "🎉",
};

export interface MoodModifiers {
  fameMultiplier: number;
  popMultiplier: number;
  killChanceBonus: number;
}

export function getMoodModifiers(mood: CrowdMood): MoodModifiers {
  switch (mood) {
    case "Bloodthirsty":
      return { fameMultiplier: 1.0, popMultiplier: 0.8, killChanceBonus: 0.1 };
    case "Theatrical":
      return { fameMultiplier: 1.0, popMultiplier: 1.5, killChanceBonus: 0 };
    case "Solemn":
      return { fameMultiplier: 0.7, popMultiplier: 0.7, killChanceBonus: -0.05 };
    case "Festive":
      return { fameMultiplier: 1.3, popMultiplier: 1.3, killChanceBonus: 0 };
    default:
      return { fameMultiplier: 1.0, popMultiplier: 1.0, killChanceBonus: 0 };
  }
}

/**
 * Determine next crowd mood based on recent fight history.
 */
export function computeCrowdMood(recentFights: FightSummary[]): CrowdMood {
  if (recentFights.length === 0) return "Calm";

  const last5 = recentFights.slice(-5);
  const kills = last5.filter((f) => f.by === "Kill").length;
  const flashy = last5.filter((f) => f.flashyTags?.includes("Flashy")).length;
  const draws = last5.filter((f) => f.winner === null).length;

  if (kills >= 2) return "Bloodthirsty";
  if (kills >= 1 && draws >= 2) return "Solemn";
  if (flashy >= 3) return "Theatrical";
  if (last5.length >= 4 && kills === 0) return "Festive";
  return "Calm";
}
