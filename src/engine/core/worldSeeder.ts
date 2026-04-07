import { 
  FightingStyle, 
  type Attributes, 
  ATTRIBUTE_KEYS, 
  ATTRIBUTE_MAX 
} from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { CombatEvent } from "@/types/combat.types";
import type { Trainer } from "@/types/state.types";
import { type GameState } from "@/types/state.types";
import { createFreshState, makeWarrior } from "@/engine/factories";
import { generateRivalStables } from "@/engine/rivals";
import { generateRecruitPool } from "@/engine/recruitment";
import { generateHiringPool } from "@/engine/trainers";
import { SeededRNG } from "@/utils/random";

import { generatePromoters } from "@/engine/promoters/promoterGenerator";

/**
 * Seed the world with initial rivals, recruits, and a starter player roster.
 * Bypasses the FTUE for headless simulation.
 */
export function populateInitialWorld(state: GameState, seed: number): GameState {
  const rng = new SeededRNG(seed);
  const usedNames = new Set<string>();

  // 1. Generate Rivals (45 stables for the fluid population target)
  const rivals = generateRivalStables(45, seed + 1);
  rivals.forEach(r => r.roster.forEach(w => usedNames.add(w.name)));

  // 1.1 Generate Promoters (30 for the tiered system)
  const promoters = generatePromoters(30, seed + 3);

  // 2. Generate Initial Recruit Pool
  const recruitPool = generateRecruitPool(12, 1, usedNames, seed + 2);

  // 3. Generate Player Roster (4 balanced warriors)
  const styles = [
    FightingStyle.StrikingAttack,
    FightingStyle.WallOfSteel,
    FightingStyle.ParryRiposte,
    FightingStyle.LungingAttack
  ];

  const playerRoster: Warrior[] = styles.map((style, i) => {
    const attrs = {
      ST: 8 + rng.roll(0, 4),
      CN: 8 + rng.roll(0, 4),
      SZ: 10,
      WT: 10,
      WL: 10,
      SP: 8 + rng.roll(0, 4),
      DF: 8 + rng.roll(0, 4)
    };
    const w = makeWarrior(undefined, `Starter_${i}`, style, attrs, {}, rng);
    usedNames.add(w.name);
    return w;
  });

  return {
    ...state,
    rivals,
    promoters, // Seeded Promoters
    boutOffers: {},
    realmRankings: {},
    recruitPool,
    hiringPool: generateHiringPool(8, seed + 100),
    roster: playerRoster,
    isFTUE: false,
    ftueComplete: true,
    treasury: 500,
    week: 1,
    year: 1,
  };
}
