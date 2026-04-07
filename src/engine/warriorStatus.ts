/**
 * Warrior Status Helpers
 * Single source of truth for warrior lifecycle checks.
 * Import these instead of checking `.status === "Dead"` manually.
 */
import type { Warrior, WarriorStatus, InjuryData } from "@/types/warrior.types";
import { isTooInjuredToFight } from "@/engine/injuries";

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

/** 
 * Whether a warrior is active AND healthy enough to fight this week.
 * Enforces a fatigue ceiling of 50 for regular bouts.
 */
export function isFightReady(w: Warrior, isTournament: boolean = false): boolean {
  if (!isActive(w)) return false;
  
  // ── Tournament Adrenaline ──
  // Fatigue is ignored during tournament weeks to allow for multi-round progression.
  if (!isTournament && (w.fatigue || 0) >= 50) return false;

  const injObjs = (w.injuries || []).filter((i): i is InjuryData => typeof i !== "string");
  return !isTooInjuredToFight(injObjs);
}
