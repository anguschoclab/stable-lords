import { GameState, Promoter, PromoterPersonality } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { generateDynasticName } from "@/utils/nameLogic";

/**
 * Stable Lords — Promoter Lifecycle Pass
 * Phase 3: Handles aging and retirement for recruiters and promoters.
 */

export const PASS_METADATA = {
  name: "PromoterLifecyclePass",
  dependencies: ["PromoterPass"] // Depends on promoter pass completing
};

const PERSONALITIES: PromoterPersonality[] = ["Greedy", "Honorable", "Sadistic", "Flashy", "Corporate"];

export function runPromoterLifecyclePass(state: GameState, rng: SeededRNG): GameState {
  const newPromoters: Record<string, Promoter> = { ...state.promoters };
  const news: string[] = [];
  const WEEKS_PER_YEAR = 52;
  const isAgingWeek = state.week % WEEKS_PER_YEAR === 0;

  for (const id in newPromoters) {
    const p = newPromoters[id];
    let currentAge = p.age ?? 45;
    if (isAgingWeek) currentAge++;

    let retired = false;
    if (currentAge >= 65) {
      // Base retirement chance starts at 5% at age 65
      const baseChance = 0.05 + (currentAge - 65) * 0.03;
      // Legend protection: High purse paid reduces retirement chance
      const legacyBonus = Math.min(0.10, p.history.totalPursePaid / 10000);
      const finalChance = Math.max(0.01, baseChance - legacyBonus);

      if (rng.next() < finalChance) {
        retired = true;
        const newId = rng.uuid("promoter");
        const successorName = generateDynasticName(p.name, state.week + 123);
        
        // 50% chance to inherit personality
        const personality = rng.chance(0.5) ? p.personality : rng.pick(PERSONALITIES);

        const successor: Promoter = {
          id: newId,
          name: successorName,
          age: 25 + rng.roll(0, 10),
          personality,
          tier: p.tier,
          capacity: p.capacity,
          biases: [...p.biases],
          history: {
            totalPursePaid: Math.floor(p.history.totalPursePaid * 0.2), // Inherit 20%
            notableBouts: [],
            mentorId: p.id,
            legacyFame: p.history.legacyFame + (p.history.totalPursePaid / 1000)
          }
        };

        delete newPromoters[id];
        newPromoters[newId] = successor;
        news.push(`🏠 SUCCESSION: The legendary promoter ${p.name} has retired. Their protege, ${successorName}, takes over the ${p.tier} circuit.`);
      }
    }

    if (!retired) {
      newPromoters[id] = { ...p, age: currentAge };
    }
  }

  return {
    ...state,
    promoters: newPromoters,
    newsletter: news.length > 0 ? [...state.newsletter, { id: rng.uuid("newsletter"), week: state.week, title: "Promoter News", items: news }] : state.newsletter
  };
}
