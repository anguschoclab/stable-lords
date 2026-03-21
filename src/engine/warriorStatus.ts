/**
 * Warrior Status Helpers
 * Single source of truth for warrior lifecycle checks.
 * Import these instead of checking `.status === "Dead"` manually.
 */
import type { Warrior, WarriorStatus } from "@/types/game";
import { isTooInjuredToFight, type Injury } from "@/engine/injuries";

/** Whether a warrior is dead (killed in combat) */
export function isDead(w: Pick<Warrior, "status">): boolean {
  return w.status === "Dead";
}

/** Whether a warrior has retired */
export function isRetired(w: Pick<Warrior, "status">): boolean {
  return w.status === "Retired";
}

/** Whether a warrior is on the active roster (not dead or retired) */
export function isActive(w: Pick<Warrior, "status">): boolean {
  return w.status === "Active";
}

/** Whether a warrior is active AND healthy enough to fight this week */
export function isFightReady(w: Warrior): boolean {
  if (!isActive(w)) return false;
  const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
  return !isTooInjuredToFight(injObjs);
}
