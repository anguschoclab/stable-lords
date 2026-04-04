import { type GameState, type Warrior } from "@/types/game";
import { createFreshState, makeWarrior } from "@/engine/factories";
import { generateRivalStables } from "@/engine/rivals";
import { generateRecruitPool } from "@/engine/recruitment";
import { generateHiringPool } from "@/engine/trainers";
import { SeededRNG } from "@/utils/random";
import { FightingStyle } from "@/types/shared.types";

/**
 * Seed the world with initial rivals, recruits, and a starter player roster.
 * Bypasses the FTUE for headless simulation.
 */
export function populateInitialWorld(state: GameState, seed: number): GameState {
  const rng = new SeededRNG(seed);
  const usedNames = new Set<string>();

  // 1. Generate Rivals (10 stables)
  const rivals = generateRivalStables(10, seed + 1);
  rivals.forEach(r => r.roster.forEach(w => usedNames.add(w.name)));

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
    const w = makeWarrior(undefined, `Starter_${i}`, style, attrs, {}, () => rng.next());
    usedNames.add(w.name);
    return w;
  });

  return {
    ...state,
    rivals,
    recruitPool,
    hiringPool: generateHiringPool(8, seed + 100),
    roster: playerRoster,
    isFTUE: false,
    ftueComplete: true,
    gold: 500,
    week: 1,
  };
}
