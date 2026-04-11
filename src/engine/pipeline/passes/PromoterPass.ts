import { GameState, BoutOffer, Promoter, Warrior, RankingEntry } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";
import { FIGHT_PURSE } from "@/data/economyConstants";
import { generateId } from "@/utils/idUtils";

/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */
export const PASS_METADATA = {
  name: "PromoterPass",
  dependencies: ["RankingsPass"] // Depends on rankings for matchmaking
};

/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */

const TIER_MULTIPLIERS = {
  Local: 1.0,
  Regional: 1.8,
  National: 3.5,
  Legendary: 8.0
};

const RANK_REQUIREMENTS = {
  Local: 999,
  Regional: 200,
  National: 80,
  Legendary: 20
};

export function runPromoterPass(state: GameState, rng?: IRNGService): GameState {
  const rngService = rng || new SeededRNGService(state.week * 881 + 17);
  const newOffers: Record<string, BoutOffer> = { ...state.boutOffers };
  const rankings = state.realmRankings || {};
  
  // 0. Garbage Collection: Prune expired or stale bout offers
  for (const [offerId, offer] of Object.entries(newOffers)) {
    if (offer.boutWeek < state.week) {
      delete newOffers[offerId]; // Past events
    } else if (offer.expirationWeek < state.week && offer.status !== "Signed") {
      delete newOffers[offerId]; // Expired proposals
    }
  }
  
  // 1. Gather all active warriors
  const allWarriors: { w: Warrior; stableId: string }[] = [];
  state.roster.forEach(w => {
    if (w.status === "Active") allWarriors.push({ w, stableId: state.player.id });
  });
  (state.rivals || []).forEach(r => {
    r.roster.forEach(w => {
      if (w.status === "Active") allWarriors.push({ w, stableId: r.owner.id });
    });
  });

  // ⚡ Bolt: Pre-compute available warriors to avoid repeated availability checks
  // Available = No SIGNED bout for Week+2 or Week+3
  const targetWeek = state.week + 2; // Forward booking
  const unavailableWarriorIds = new Set<string>();
  Object.values(newOffers).forEach(o => {
    if (o.status === "Signed" && (o.boutWeek === targetWeek || o.boutWeek === targetWeek + 1)) {
      o.warriorIds.forEach(id => unavailableWarriorIds.add(id));
    }
  });

  const availableWarriors = allWarriors.filter(entry => !unavailableWarriorIds.has(entry.w.id));

  // 2. Iterate through Promoters
  Object.values(state.promoters).forEach(promoter => {
    const capacity = promoter.capacity;
    let generated = 0;

    // Attempt to fill capacity
    const shuffledWarriors = rngService.shuffle(availableWarriors);

    for (const warriorA of shuffledWarriors) {
      if (generated >= capacity) break;

      const rankA = rankings[warriorA.w.id]?.overallRank || 999;
      if (rankA > RANK_REQUIREMENTS[promoter.tier]) continue;

      // Find an opponent B
      const opponentB = shuffledWarriors.find(candidate => {
        if (candidate.w.id === warriorA.w.id) return false;

        const rankB = rankings[candidate.w.id]?.overallRank || 999;
        const scoreA = rankings[warriorA.w.id]?.compositeScore || 0;
        const scoreB = rankings[candidate.w.id]?.compositeScore || 0;

        // Qualification & Score Proximity (25% gap max)
        const gap = Math.abs(scoreA - scoreB) / Math.max(1, scoreA);
        return rankB <= RANK_REQUIREMENTS[promoter.tier] && gap <= 0.25;
      });

      if (opponentB) {
        const offerId = rngService.uuid();
        const hype = calculateHype(warriorA.w, opponentB.w, promoter);
        const basePurse = FIGHT_PURSE * TIER_MULTIPLIERS[promoter.tier];
        const finalPurse = Math.floor(basePurse * (hype / 100));

        newOffers[offerId] = {
          id: offerId,
          promoterId: promoter.id,
          warriorIds: [warriorA.w.id, opponentB.w.id],
          boutWeek: targetWeek,
          expirationWeek: state.week + 1,
          purse: finalPurse,
          hype,
          status: "Proposed",
          responses: {
            [warriorA.w.id]: "Pending",
            [opponentB.w.id]: "Pending"
          }
        };
        generated++;
      }
    }
  });

  return {
    ...state,
    boutOffers: newOffers
  };
}

function calculateHype(a: Warrior, b: Warrior, promoter: Promoter): number {
  let hype = 100;
  
  // 1. Style Clash
  const isBrute = (s: FightingStyle) => s === FightingStyle.BashingAttack || s === FightingStyle.StrikingAttack;
  const isEvasive = (s: FightingStyle) => s === FightingStyle.TotalParry || s === FightingStyle.WallOfSteel;

  if (isBrute(a.style) && isEvasive(b.style)) hype += 20;
  if (isBrute(b.style) && isEvasive(a.style)) hype += 20;
  if (isEvasive(a.style) && isEvasive(b.style)) hype -= 30;

  // 2. Personality Bias
  if (promoter.personality === "Sadistic" && (a.career.kills > 2 || b.career.kills > 2)) hype += 25;
  if (promoter.personality === "Flashy" && (a.fame > 100 || b.fame > 100)) hype += 15;

  // 3. "Zero has to Go"
  if (a.career.losses === 0 && b.career.losses === 0 && a.career.wins > 3 && b.career.wins > 3) {
    hype *= 1.5;
  }

  return Math.floor(hype);
}
