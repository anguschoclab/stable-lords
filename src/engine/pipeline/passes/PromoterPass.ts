import { GameState, Promoter, Warrior, PromoterPersonality } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FIGHT_PURSE } from '@/data/economyConstants';
import { collectAllActiveWarriors } from '@/engine/core/warriorCollection';
/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */
/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */

const TIER_MULTIPLIERS = {
  Local: 1.0,
  Regional: 1.8,
  National: 3.5,
  Legendary: 8.0,
};

const RANK_REQUIREMENTS = {
  Local: 999,
  Regional: 200,
  National: 80,
  Legendary: 20,
};

/** Personality-based skill gap thresholds for matching */
const PERSONALITY_GAP_THRESHOLDS: Record<PromoterPersonality, number> = {
  Greedy: 0.35, // Prefer bigger mismatches (crowd-pleasing blowouts)
  Honorable: 0.1, // Tight skill parity (<10% vs default 25%)
  Sadistic: 0.25, // Default
  Flashy: 0.25, // Default
  Corporate: 0.2, // Stable, predictable matches
};

/** Check if warrior is a "high-kill" type (for Sadistic promoter) */
function isHighKillWarrior(w: Warrior): boolean {
  return w.career.kills > 3 || w.style === FightingStyle.BashingAttack;
}

/** Check if warrior has injury-prone characteristics */
function hasInjuryRisk(w: Warrior): boolean {
  return (w.injuries || []).some(
    (i) => i.severity === 'Moderate' || i.severity === 'Severe' || i.severity === 'Critical'
  );
}

/** Check if warrior is "showy" (for Flashy promoter) */
function isShowyWarrior(w: Warrior): boolean {
  const showyStyles = [
    FightingStyle.LungingAttack,
    FightingStyle.AimedBlow,
    FightingStyle.ParryLunge,
  ];
  return showyStyles.includes(w.style) || w.fame > 75;
}

/** Calculate personality-based matching score (higher = better match) */
function calculatePersonalityMatchScore(
  warriorA: Warrior,
  warriorB: Warrior,
  promoter: Promoter
): number {
  const personality = promoter.personality;
  let score = 0;

  switch (personality) {
    case 'Greedy':
      // Prefer skill mismatches (bigger gap = higher score for greedy)
      // Gap is handled separately, this adds bonus for mismatches
      score += 10;
      break;

    case 'Honorable':
      // Prefer tight parity - handled by threshold, adds consistency bonus
      score += 15;
      break;

    case 'Sadistic':
      // Prefer Brute + high-kill warriors; injury-prone matchups
      const aIsBrute =
        warriorA.style === FightingStyle.BashingAttack ||
        warriorA.style === FightingStyle.StrikingAttack;
      const bIsBrute =
        warriorB.style === FightingStyle.BashingAttack ||
        warriorB.style === FightingStyle.StrikingAttack;
      if (aIsBrute || bIsBrute) score += 20;
      if (isHighKillWarrior(warriorA) || isHighKillWarrior(warriorB)) score += 15;
      if (hasInjuryRisk(warriorA) || hasInjuryRisk(warriorB)) score += 10;
      break;

    case 'Flashy':
      // Prefer famous + showy styles
      if (isShowyWarrior(warriorA)) score += 10;
      if (isShowyWarrior(warriorB)) score += 10;
      if (warriorA.fame > 75 && warriorB.fame > 75) score += 20;
      break;

    case 'Corporate':
      // Prefer stable tier-boundary matching (already enforced by capacity)
      // Add small consistency bonus
      score += 5;
      break;
  }

  return score;
}

/** Calculate purse modifier based on promoter personality and matchup */
function calculatePersonalityPurseModifier(
  warriorA: Warrior,
  warriorB: Warrior,
  promoter: Promoter,
  baseHype: number
): number {
  const personality = promoter.personality;

  switch (personality) {
    case 'Greedy':
      // +15% purse, -10% hype (crowd-pleasing blowouts pay more but generate less organic hype)
      return 1.15;

    case 'Honorable':
      // +10% hype (competitive matches draw more interest)
      return baseHype > 120 ? 1.05 : 1.0;

    case 'Sadistic':
      // Already +25 hype for kill warriors; add +20% on injury-risk pairings
      if (hasInjuryRisk(warriorA) || hasInjuryRisk(warriorB)) return 1.2;
      return 1.0;

    case 'Flashy':
      // Already +15 hype for fame; add +20% purse when both fame > 75
      if (warriorA.fame > 75 && warriorB.fame > 75) return 1.2;
      return 1.0;

    case 'Corporate':
      // +5% purse, stable
      return 1.05;

    default:
      return 1.0;
  }
}

export function runPromoterPass(state: GameState, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(state.week * 881 + 17);
  const rankings = state.realmRankings || {};

  // 0. Garbage Collection: Prune expired or stale bout offers
  const newOffers = Object.fromEntries(
    Object.entries(state.boutOffers || {}).filter(([_, offer]) => {
      const isPast = offer.boutWeek < state.week;
      const isExpired = offer.expirationWeek < state.week && offer.status !== 'Signed';
      return !isPast && !isExpired;
    })
  );

  // 1. Gather all active warriors using utility
  const allWarriors = collectAllActiveWarriors(state);

  // ⚡ Bolt: Pre-compute available warriors to avoid repeated availability checks
  // Available = No SIGNED or PROPOSED bout for Week+2 or Week+3
  const targetWeek = state.week + 2; // Forward booking
  const unavailableWarriorIds = new Set<string>();
  Object.values(newOffers).forEach((o) => {
    const isBooked =
      (o.status === 'Signed' || o.status === 'Proposed') &&
      (o.boutWeek === targetWeek || o.boutWeek === targetWeek + 1);
    if (isBooked) {
      o.warriorIds.forEach((id) => unavailableWarriorIds.add(id));
    }
  });

  // 🔒 Tournament Lock: On tournament weeks, exclude warriors in active tournaments
  if (state.isTournamentWeek) {
    const tournamentLockedIds = new Set<string>();
    state.tournaments?.forEach((t) => {
      if (!t.completed) {
        t.participants?.forEach((p) => tournamentLockedIds.add(p.id));
      }
    });
    tournamentLockedIds.forEach((id) => unavailableWarriorIds.add(id));
  }

  const availableWarriors = allWarriors.filter(
    (entry) => !unavailableWarriorIds.has(entry.warrior.id)
  );

  // 2. Iterate through Promoters
  Object.values(state.promoters || []).forEach((promoter) => {
    const capacity = promoter.capacity;
    let generated = 0;

    // Attempt to fill capacity
    const shuffledWarriors = rngService.shuffle(availableWarriors);

    // Get personality-specific gap threshold
    const gapThreshold = PERSONALITY_GAP_THRESHOLDS[promoter.personality] ?? 0.25;

    for (const warriorA of shuffledWarriors) {
      if (generated >= capacity) break;

      const rankA = rankings[warriorA.warrior.id]?.overallRank || 999;
      if (rankA > RANK_REQUIREMENTS[promoter.tier]) continue;

      // Find an opponent B with personality-based matching
      const scoreA = rankings[warriorA.warrior.id]?.compositeScore || 0;

      // Score and rank candidates by personality fit + skill proximity
      const candidates = shuffledWarriors
        .filter((candidate) => {
          if (candidate.warrior.id === warriorA.warrior.id) return false;

          const rankB = rankings[candidate.warrior.id]?.overallRank || 999;
          const scoreB = rankings[candidate.warrior.id]?.compositeScore || 0;

          // Qualification & Score Proximity (personality-based gap threshold)
          const gap = Math.abs(scoreA - scoreB) / Math.max(1, scoreA);
          return rankB <= RANK_REQUIREMENTS[promoter.tier] && gap <= gapThreshold;
        })
        .map((candidate) => ({
          ...candidate,
          scoreB: rankings[candidate.warrior.id]?.compositeScore || 0,
          personalityScore: calculatePersonalityMatchScore(
            warriorA.warrior,
            candidate.warrior,
            promoter
          ),
          gap:
            Math.abs(scoreA - (rankings[candidate.warrior.id]?.compositeScore || 0)) /
            Math.max(1, scoreA),
        }))
        .sort((a, b) => {
          // Greedy prefers bigger gaps, others prefer smaller gaps
          if (promoter.personality === 'Greedy') {
            return b.gap - a.gap; // Bigger gap = better for Greedy
          }
          // Others: personality score first, then tighter gap
          if (b.personalityScore !== a.personalityScore) {
            return b.personalityScore - a.personalityScore;
          }
          return a.gap - b.gap; // Tighter gap = better
        });

      const opponentB = candidates[0];

      if (opponentB) {
        const offerId = rngService.uuid();
        const hype = calculateHype(warriorA.warrior, opponentB.warrior, promoter);
        const basePurse = FIGHT_PURSE * TIER_MULTIPLIERS[promoter.tier];
        const purseModifier = calculatePersonalityPurseModifier(
          warriorA.warrior,
          opponentB.warrior,
          promoter,
          hype
        );
        const finalPurse = Math.floor(basePurse * (hype / 100) * purseModifier);

        newOffers[offerId] = {
          id: offerId,
          promoterId: promoter.id,
          warriorIds: [warriorA.warrior.id, opponentB.warrior.id],
          boutWeek: targetWeek,
          expirationWeek: state.week + 1,
          purse: finalPurse,
          hype,
          status: 'Proposed',
          responses: {
            [warriorA.warrior.id]: 'Pending',
            [opponentB.warrior.id]: 'Pending',
          },
        };
        generated++;
      }
    }
  });

  return {
    boutOffers: newOffers,
  };
}

function calculateHype(a: Warrior, b: Warrior, promoter: Promoter): number {
  let hype = 100;

  // 1. Style Clash
  const isBrute = (s: FightingStyle) =>
    s === FightingStyle.BashingAttack || s === FightingStyle.StrikingAttack;
  const isEvasive = (s: FightingStyle) =>
    s === FightingStyle.TotalParry || s === FightingStyle.WallOfSteel;

  if (isBrute(a.style) && isEvasive(b.style)) hype += 20;
  if (isBrute(b.style) && isEvasive(a.style)) hype += 20;
  if (isEvasive(a.style) && isEvasive(b.style)) hype -= 30;

  // 2. Personality Bias - Extended for all personalities
  switch (promoter.personality) {
    case 'Greedy':
      // -10% hype for crowd-pleasing blowouts (they pay more but generate less organic hype)
      hype *= 0.9;
      break;

    case 'Honorable':
      // +10% hype for competitive matches
      if (Math.abs(a.fame - b.fame) < 50) hype *= 1.1;
      break;

    case 'Sadistic':
      // Already existing: +25 hype for kill warriors
      if (a.career.kills > 2 || b.career.kills > 2) hype += 25;
      // Additional: +20% on injury-risk pairings
      if (hasInjuryRisk(a) || hasInjuryRisk(b)) hype *= 1.2;
      break;

    case 'Flashy':
      // Already existing: +15 hype for fame
      if (a.fame > 100 || b.fame > 100) hype += 15;
      // Additional: +10% when both have showy styles
      if (isShowyWarrior(a) && isShowyWarrior(b)) hype *= 1.1;
      break;

    case 'Corporate':
      // Stable, moderate hype
      break;
  }

  // 3. "Zero has to Go"
  if (a.career.losses === 0 && b.career.losses === 0 && a.career.wins > 3 && b.career.wins > 3) {
    hype *= 1.5;
  }

  return Math.floor(hype);
}
