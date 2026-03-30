import type { 
  Warrior, RivalStableData, MatchRecord, 
  Rivalry, FightOutcome 
} from "@/types/game";
import { getStablePairKey, getWarriorPairKey } from "@/utils/keyUtils";

/**
 * Matchmaking Scoring Service - handles the weights and logic for pairing warriors.
 */
export class MatchScoringService {
  /**
   * Calculates a booking score for a potential matchup.
   * Higher score = more likely to be booked.
   */
  static calculatePairingScore(params: {
    playerWarrior: Warrior;
    rivalWarrior: Warrior;
    rivalStableId: string;
    playerStableId: string;
    week: number;
    rivalryIntensity?: number;
    lastMatchWeek?: number;
    isRecentStyleMatch: boolean;
    isChallenged: boolean;
    isAvoided: boolean;
    rng: () => number;
  }): number {
    const { 
      playerWarrior: p, rivalWarrior: r, rivalryIntensity, 
      lastMatchWeek, isRecentStyleMatch, isChallenged, 
      isAvoided, week, rng 
    } = params;

    let score = 100;

    // 1. Fame proximity bonus (0-30)
    score += Math.max(0, 30 - Math.abs(p.fame - r.fame) * 3);

    // 2. Rivalry bonus
    if (rivalryIntensity !== undefined) {
      // Give intense rivalries / blood feuds (intensity >= 4) a massive booking score boost
      score += (rivalryIntensity >= 4) ? 200 : 50;
    }

    // 3. Style diversity bonus (+20 if this style matchup is fresh)
    if (!isRecentStyleMatch) {
      score += 20;
    }

    // 4. Repeat penalty (-100 if fought in last 2 weeks)
    if (lastMatchWeek !== undefined && lastMatchWeek >= week - 2) {
      score -= 100;
    }

    // 5. Challenge / Avoid modifiers (override-level weights)
    if (isChallenged) score += 500;
    if (isAvoided) score -= 500;

    // 6. Random jitter (0-15) for variety
    score += Math.floor(rng() * 16);

    return score;
  }
}

/**
 * AI Bout Service - handles automatic background resolution of rival-vs-rival fights.
 */
export class AIBoutService {
  /**
   * Updates a rival warrior's record after a background bout.
   * This is a pure-ish helper that returns the updated roster.
   */
  static updateWarriorRecord(
    roster: Warrior[],
    wId: string,
    won: boolean,
    killed: boolean
  ): Warrior[] {
    return roster.map(w => {
      if (w.id !== wId) return w;
      return {
        ...w,
        career: {
          wins: w.career.wins + (won ? 1 : 0),
          losses: w.career.losses + (won ? 0 : 1),
          kills: w.career.kills + (killed ? 1 : 0),
        },
        fame: Math.max(0, w.fame + (won ? (killed ? 3 : 1) : 0)),
      };
    });
  }

  /**
   * Generates a narrative line for a rival rivalry bout.
   */
  static generateRivalryNarrative(stableA: string, stableB: string, warriorA: string, warriorB: string): string {
    const templates = [
      `🔥 RIVALRY REPORT: The feud between ${stableA} and ${stableB} rages on — ${warriorA} faced ${warriorB} in a grudge match!`,
      `⚔️ VENDETTA IN THE PITS: ${stableA} vs ${stableB} — ${warriorA} and ${warriorB} settled scores in the arena!`,
      `🏟️ BAD BLOOD: ${stableA} and ${stableB} clashed again as ${warriorA} took on ${warriorB}!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Calculate rivalry intensity adjustment based on match outcomes.
 * Base (bouts fought) + Death (+5) + Upset (+3).
 */
export function calculateRivalryScore(
  boutsFought: number,
  deathsCount: number,
  upsetsCount: number
): number {
  let score = 0;
  score += Math.floor(boutsFought / 3);
  score += deathsCount * 5;
  score += upsetsCount * 3;
  return Math.max(1, Math.min(5, score));
}
