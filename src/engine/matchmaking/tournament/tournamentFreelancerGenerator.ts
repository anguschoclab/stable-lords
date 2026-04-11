import type { Warrior } from "@/types/warrior.types";
import { FightingStyle } from "@/types/shared.types";
import { makeWarrior } from "@/engine/factories";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

/**
 * Generates a freelancer warrior for tournament filler.
 * Used when world population is decimated and not enough warriors are available.
 */
export function generateFreelancer(tier: string, index: number, rng: IRNGService): Warrior {
  const styles = Object.values(FightingStyle);
  const style = rng.pick(styles);
  const pool = tier === "Gold" ? 120 : tier === "Silver" ? 100 : tier === "Bronze" ? 85 : 70;
  const attrs = { ST: 5, CN: 5, SZ: 10, WT: 10, WL: 10, SP: 5, DF: 5 };
  let remaining = pool - 50;
  const keys: (keyof typeof attrs)[] = ["ST", "CN", "SP", "DF", "WL", "WT"];
  while (remaining > 0) {
    const key = rng.pick(keys);
    if (attrs[key] < 25) { attrs[key]++; remaining--; }
  }
  return makeWarrior(undefined, `Freelancer ${rng.pick(["Thrax", "Murmillo", "Kaeso"])} #${index}`, style, attrs, {}, rng);
}
