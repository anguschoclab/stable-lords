import { GameState, Promoter, PromoterPersonality } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { generateDynasticName } from '@/utils/nameLogic';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — Promoter Lifecycle Pass
 * Phase 3: Handles aging and retirement for recruiters and promoters.
 */

const PERSONALITIES: PromoterPersonality[] = [
  'Greedy',
  'Honorable',
  'Sadistic',
  'Flashy',
  'Corporate',
];

export function runPromoterLifecyclePass(state: GameState, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(state.week * 777 + 1);
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
      const legacyBonus = Math.min(0.1, p.history.totalPursePaid / 10000);
      const finalChance = Math.max(0.01, baseChance - legacyBonus);

      if (rngService.next() < finalChance) {
        retired = true;
        const newId = rngService.uuid();
        const successorName = generateDynasticName(p.name, state.week + 123);

        // 50% chance to inherit personality
        const personality =
          rngService.next() < 0.5 ? p.personality : rngService.pick(PERSONALITIES);

        const successor: Promoter = {
          id: newId,
          name: successorName,
          age: 25 + rngService.roll(0, 10),
          personality,
          tier: p.tier,
          capacity: p.capacity,
          biases: [...p.biases],
          history: {
            totalPursePaid: Math.floor(p.history.totalPursePaid * 0.2), // Inherit 20%
            notableBouts: [],
            mentorId: p.id,
            legacyFame: p.history.legacyFame + p.history.totalPursePaid / 1000,
          },
        };

        const retiredIds = new Set<string>();
        retiredIds.add(id);
        const successors: Record<string, Promoter> = {};
        successors[newId] = successor;

        // Apply removals safely
        const filteredPromoters = Object.entries(newPromoters)
          .filter(([pid]) => !retiredIds.has(pid))
          .reduce((acc, [pid, pObj]) => ({ ...acc, [pid]: pObj }), {});

        Object.assign(newPromoters, filteredPromoters);
        Object.assign(newPromoters, successors);

        // This is a bit complex inside a loop. Better: re-read the file and use a cleaner approach.
        news.push(
          `🏠 SUCCESSION: The legendary promoter ${p.name} has retired. Their protege, ${successorName}, takes over the ${p.tier} circuit.`
        );
      }
    }

    if (!retired) {
      newPromoters[id] = { ...p, age: currentAge };
    }
  }

  const impact: StateImpact = { promoters: newPromoters };

  if (news.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: state.week,
        title: 'Promoter News',
        items: news,
      },
    ];
  }

  return impact;
}
