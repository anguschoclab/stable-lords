import { GameState, Warrior, RivalStableData, BoutOffer } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateId } from '@/utils/idUtils';
import { FightingStyle } from '@/types/shared.types';

/**
 * World Matchmaking Service
 * 
 * Logic to pair NPC warriors from different stables for background bouts.
 * Ensures the world evolves (XP, fame, mortality) even without player input.
 */

export function planWorldBouts(state: GameState, rng: IRNGService): BoutOffer[] {
  const eligibleWarriors: { warrior: Warrior; stable: RivalStableData }[] = [];
  
  (state.rivals || []).forEach(rival => {
    rival.roster.forEach(warrior => {
      if (warrior.status === 'Active' && !warrior.isDead) {
        eligibleWarriors.push({ warrior, stable: rival });
      }
    });
  });

  if (eligibleWarriors.length < 2) return [];

  const offers: BoutOffer[] = [];
  const pairedIds = new Set<string>();

  // Shuffle warriors to avoid bias
  const pool = [...eligibleWarriors].sort(() => rng.next() - 0.5);

  for (let i = 0; i < pool.length; i++) {
    const entryA = pool[i];
    if (pairedIds.has(entryA.warrior.id)) continue;

    // Find a suitable opponent (proximity in fame + different stable)
    let bestOpponent: typeof entryA | null = null;
    let minFameGap = Infinity;

    for (let j = i + 1; j < pool.length; j++) {
      const entryD = pool[j];
      if (pairedIds.has(entryD.warrior.id)) continue;
      if (entryA.stable.id === entryD.stable.id) continue;

      const fameGap = Math.abs((entryA.warrior.fame || 0) - (entryD.warrior.fame || 0));
      if (fameGap < minFameGap) {
        minFameGap = fameGap;
        bestOpponent = entryD;
      }
      
      // If we find a very close match, take it immediately
      if (fameGap < 20) break;
    }

    if (bestOpponent) {
      pairedIds.add(entryA.warrior.id);
      pairedIds.add(bestOpponent.warrior.id);

      const offerId = `world_bout_${rng.uuid()}`;
      const offer: BoutOffer = {
        id: offerId,
        proposerStableId: entryA.stable.id,
        warriorIds: [entryA.warrior.id, bestOpponent.warrior.id],
        boutWeek: state.week + 1,
        purse: 300,
        hype: 100 + Math.floor(rng.next() * 50),
        status: 'Proposed',
        responses: {
          [entryA.warrior.id]: 'Pending',
          [bestOpponent.warrior.id]: 'Pending'
        },
        conditions: [],
        createdAt: new Date().toISOString()
      };
      offers.push(offer);
    }
  }

  return offers;
}
