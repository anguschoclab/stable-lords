import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { isEligible } from "./eligibility";

export interface AIPoolWarrior {
  warrior: Warrior;
  stableIdx: number;
  stableId: string;
  stableName: string;
}

/**
 * Collects eligible AI warriors from all rival stables.
 * Filters out warriors that are resting, injured, or in training.
 */
export function collectEligibleAIWarriors(state: GameState, rivals: RivalStableData[]): AIPoolWarrior[] {
  const restMap = new Map<string, number>();
  for (const r of (state.restStates || [])) {
    restMap.set(r.warriorId, Math.max(r.restUntilWeek, restMap.get(r.warriorId) ?? 0));
  }
  const trainingIds = new Set<string>();
  const pool: AIPoolWarrior[] = [];
  
  for (let si = 0; si < rivals.length; si++) {
    for (const w of rivals[si].roster) {
      if (isEligible(w, state.week, restMap, trainingIds)) {
        pool.push({ warrior: w, stableIdx: si, stableId: rivals[si].owner.id, stableName: rivals[si].owner.stableName });
      }
    }
  }
  return pool;
}
