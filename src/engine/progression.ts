/**
 * Warrior Skill Progression — XP and learn-by-doing
 * 
 * Warriors gain XP from fights:
 * - 2 XP for a win
 * - 1 XP for a loss or draw
 * - +1 bonus XP for a kill
 * - +1 bonus XP for flashy tags
 * 
 * Every 5 XP, a warrior gains +1 to a random relevant skill or attribute,
 * subject to their per-attribute potential ceiling. Diminishing returns
 * apply as attributes approach their potential.
 *
 * Fights also progressively reveal hidden potential.
 */
import type { Warrior, FightOutcome } from "@/types/game";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";
import { canGrow, diminishingReturnsFactor, revealPotential } from "./potential";
import { SeededRNG } from "@/utils/random";

const XP_PER_LEVEL = 5;
const TOTAL_ATTR_CAP = 80;

/** Chance to reveal an attribute's potential after each fight */
const POTENTIAL_REVEAL_CHANCE = 0.15;

export interface XPGain {
  warriorId: string;
  warriorName: string;
  xpGained: number;
  totalXp: number;
  levelUp: boolean;
  improvement?: string;
  potentialRevealed?: string;
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
export function applyXP(warrior: Warrior, xpGained: number, seed?: number): { warrior: Warrior; gain: XPGain } {
  const rng = new SeededRNG(seed ?? (xpGained * 7919 + 42));
  const currentXp = (warrior as import("@/types/game").Warrior).xp ?? 0;
  const newXp = currentXp + xpGained;
  const oldLevel = Math.floor(currentXp / XP_PER_LEVEL);
  const newLevel = Math.floor(newXp / XP_PER_LEVEL);
  const levelUp = newLevel > oldLevel;

  let updated = { ...warrior, xp: newXp } as Warrior & { xp: number };
  let improvement: string | undefined;
  let potentialRevealed: string | undefined;

  if (levelUp) {
    // Pick a random attribute to improve (only those below potential ceiling)
    const total = ATTRIBUTE_KEYS.reduce((s, k) => s + updated.attributes[k], 0);
    if (total < TOTAL_ATTR_CAP) {
      const improvableAttrs = ATTRIBUTE_KEYS.filter((k) => {
        if (updated.attributes[k] >= ATTRIBUTE_MAX) return false;
        const pot = updated.potential?.[k];
        return canGrow(updated.attributes[k], pot);
      });

      if (improvableAttrs.length > 0) {
        // Weight towards attributes with more headroom
        const weights = improvableAttrs.map((k) => {
          const dr = diminishingReturnsFactor(updated.attributes[k], updated.potential?.[k]);
          return Math.max(0.1, dr); // minimum weight so nothing is impossible
        });
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        let roll = rng.next() * totalWeight;
        let chosen = improvableAttrs[0];
        for (let i = 0; i < improvableAttrs.length; i++) {
          roll -= weights[i];
          if (roll <= 0) { chosen = improvableAttrs[i]; break; }
        }

        const newAttrs = { ...updated.attributes, [chosen]: updated.attributes[chosen] + 1 };
        const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, updated.style);
        updated = { ...updated, attributes: newAttrs, baseSkills, derivedStats };
        improvement = `+1 ${chosen}`;
      }
    }
  }

  // Chance to reveal one unrevealed potential attribute after each fight
  const unrevealed = ATTRIBUTE_KEYS.filter(
    (k) => !updated.potentialRevealed?.[k] && updated.potential?.[k] !== undefined
  );
  if (unrevealed.length > 0 && rng.chance(POTENTIAL_REVEAL_CHANCE)) {
    const revealKey = rng.pick(unrevealed);
    updated = {
      ...updated,
      potentialRevealed: revealPotential(updated.potentialRevealed, revealKey),
    };
    potentialRevealed = revealKey;
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
      potentialRevealed,
    },
  };
}
