import type { Warrior } from "@/types/warrior.types";

/**
 * Update a warrior's state after a bout
 * Consolidates fame, popularity, career stats, and flair updates
 */
export function updateWarriorAfterBout(
  warrior: Warrior,
  fameDelta: number,
  popularityDelta: number,
  isWinner: boolean,
  wasKilled: boolean,
  tags: string[]
): Warrior {
  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + fameDelta),
    popularity: Math.max(0, (warrior.popularity || 0) + popularityDelta),
    career: {
      ...warrior.career,
      wins: (warrior.career.wins || 0) + (isWinner ? 1 : 0),
      losses: (warrior.career.losses || 0) + (!isWinner ? 1 : 0),
      kills: (warrior.career.kills || 0) + (wasKilled ? 1 : 0),
    },
    flair: isWinner && tags.includes("Flashy") 
      ? Array.from(new Set([...(warrior.flair || []), "Flashy"])) 
      : warrior.flair,
  };
}

/**
 * Apply a fame delta to a warrior with bounds checking
 */
export function applyFameDelta(warrior: Warrior, delta: number): Warrior {
  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + delta),
  };
}

/**
 * Apply career stat updates based on bout result
 */
export function applyCareerStats(
  warrior: Warrior,
  result: { win: boolean; kill: boolean }
): Warrior {
  return {
    ...warrior,
    career: {
      ...warrior.career,
      wins: (warrior.career.wins || 0) + (result.win ? 1 : 0),
      losses: (warrior.career.losses || 0) + (!result.win ? 1 : 0),
      kills: (warrior.career.kills || 0) + (result.kill ? 1 : 0),
    },
  };
}
