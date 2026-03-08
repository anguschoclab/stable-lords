/**
 * Warrior Skill Progression — XP and learn-by-doing
 * 
 * Warriors gain XP from fights:
 * - 2 XP for a win
 * - 1 XP for a loss or draw
 * - +1 bonus XP for a kill
 * - +1 bonus XP for flashy tags
 * 
 * Every 5 XP, a warrior gains +1 to a random relevant skill or attribute.
 */
import type { Warrior, FightOutcome } from "@/types/game";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

const XP_PER_LEVEL = 5;
const TOTAL_ATTR_CAP = 80;

export interface XPGain {
  warriorId: string;
  warriorName: string;
  xpGained: number;
  totalXp: number;
  levelUp: boolean;
  improvement?: string;
}

/** Calculate XP gain from a fight outcome */
export function calculateXP(
  outcome: FightOutcome,
  side: "A" | "D",
  tags: string[]
): number {
  const won = outcome.winner === side;
  const draw = outcome.winner === null;
  let xp = won ? 2 : draw ? 1 : 1;
  
  if (won && outcome.by === "Kill") xp += 1;
  if (tags.includes("Flashy")) xp += 1;
  if (tags.includes("Comeback") && won) xp += 1;
  
  return xp;
}

/** Apply XP to a warrior, potentially triggering a level-up improvement */
export function applyXP(warrior: Warrior, xpGained: number): { warrior: Warrior; gain: XPGain } {
  const currentXp = (warrior as any).xp ?? 0;
  const newXp = currentXp + xpGained;
  const oldLevel = Math.floor(currentXp / XP_PER_LEVEL);
  const newLevel = Math.floor(newXp / XP_PER_LEVEL);
  const levelUp = newLevel > oldLevel;

  let updated = { ...warrior, xp: newXp } as Warrior & { xp: number };
  let improvement: string | undefined;

  if (levelUp) {
    // Pick a random attribute to improve (weighted by style)
    const total = ATTRIBUTE_KEYS.reduce((s, k) => s + updated.attributes[k], 0);
    if (total < TOTAL_ATTR_CAP) {
      const improvableAttrs = ATTRIBUTE_KEYS.filter(
        (k) => updated.attributes[k] < ATTRIBUTE_MAX
      );
      if (improvableAttrs.length > 0) {
        const chosen = improvableAttrs[Math.floor(Math.random() * improvableAttrs.length)];
        const newAttrs = { ...updated.attributes, [chosen]: updated.attributes[chosen] + 1 };
        const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, updated.style);
        updated = { ...updated, attributes: newAttrs, baseSkills, derivedStats };
        improvement = `+1 ${chosen}`;
      }
    }
  }

  return {
    warrior: updated,
    gain: {
      warriorId: warrior.id,
      warriorName: warrior.name,
      xpGained,
      totalXp: newXp,
      levelUp,
      improvement,
    },
  };
}
