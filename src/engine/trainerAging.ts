import type { GameState, Trainer } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";

/**
 * Trainer Aging System
 * 
 * - Trainers age +1 year every 52 weeks.
 * - Legend Protection: High fame and retired warriors stay longer.
 * - Base retirement chance starts at age 65.
 */
export function computeTrainerAging(state: GameState): { updatedTrainers: Trainer[]; news: string[]; updatedHiringPool: Trainer[] } {
  const rng = new SeededRNG(state.week * 1337 + 7);
  const news: string[] = [];
  const WEEKS_PER_YEAR = 52;
  const isAgingWeek = state.week % WEEKS_PER_YEAR === 0;

  // Process all trainers in the world (active & hiring pool)
  const processAging = (trainers: Trainer[], locLabel: string) => {
    const kept: Trainer[] = [];
    for (const t of (trainers || [])) {
      let currentAge = t.age ?? 45;
      if (isAgingWeek) currentAge++;

      let retired = false;
      if (currentAge >= 65) {
        // Base retirement chance starts at 5% at age 65
        const baseChance = 0.05 + (currentAge - 65) * 0.02;

        // 🛡️ Legend Protection: -1% per 10 Fame (max -10%)
        const fameDiscount = Math.min(0.10, (t.fame || 0) * 0.001);
        
        // 🛡️ Retired Warrior Protection: -5% flat
        const legacyDiscount = t.retiredFromWarrior ? 0.05 : 0;

        const finalChance = Math.max(0.01, baseChance - fameDiscount - legacyDiscount);

        if (rng.next() < finalChance) {
          retired = true;
          const verb = currentAge > 80 ? "passed away peacefully" : "retired to the countryside";
          news.push(`🏠 LEGACY: ${t.name} (${t.focus} Trainer) has ${verb} at age ${currentAge}.`);
        }
      }

      if (!retired) {
        kept.push({ ...t, age: currentAge });
      }
    }
    return kept;
  };

  const updatedTrainers = processAging(state.trainers, "Active");
  const updatedHiringPool = processAging(state.hiringPool, "Pool");

  return { updatedTrainers, news, updatedHiringPool };
}
