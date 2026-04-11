import type { 
  Warrior, RivalStableData, MatchRecord, 
  Rivalry
} from "@/types/state.types";
import type { FightOutcome } from "@/types/combat.types";
import { getStablePairKey, getWarriorPairKey } from "@/utils/keyUtils";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

/**
 * Matchmaking Scoring Service - handles the weights and logic for pairing warriors.
 */
export class MatchScoringService {
  /**
   * Calculates a booking score for a potential matchup.
   * Higher score = more likely to be booked.
   */
  static calculatePairingScore(params: {
    p_fame: number;
    r_fame: number;
    rivalStableId: string;
    playerStableId: string;
    week: number;
    rivalryIntensity?: number;
    lastMatchWeek?: number;
    isRecentStyleMatch: boolean;
    isChallenged: boolean;
    isAvoided: boolean;
    rng: () => number;
    rivalIntent?: string;
  }): number {
    const { 
      p_fame, r_fame, rivalryIntensity, 
      lastMatchWeek, isRecentStyleMatch, isChallenged, 
      isAvoided, week, rng, rivalIntent
    } = params;

    let score = 100;

    // 1. Fame proximity bonus (0-30)
    score += Math.max(0, 30 - Math.abs(p_fame - r_fame) * 3);

    // 2. Rivalry & Strategic Intent
    if (rivalryIntensity !== undefined) {
      score += (rivalryIntensity >= 4) ? 200 : 50;
    }

    // VENDETTA: If intentional targeting of the player
    if (rivalIntent === "VENDETTA") {
      score += 300;
    }

    // RECOVERY: Avoid high-risk bouts
    if (rivalIntent === "RECOVERY" && p_fame > r_fame + 20) {
      score -= 200;
    }

    // 3. Style diversity bonus
    if (!isRecentStyleMatch) score += 20;

    // 4. Repeat penalty
    if (lastMatchWeek !== undefined && lastMatchWeek >= week - 2) {
      score -= 100;
    }

    // 5. Challenge / Avoid modifiers
    if (isChallenged) score += 500;
    if (isAvoided) score -= 500;

    // 6. Random jitter
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
  static generateRivalryNarrative(stableA: string, stableB: string, warriorA: string, warriorB: string, rng: IRNGService): string {
    const templates = [
      `🔥 RIVALRY REPORT: The feud between ${stableA} and ${stableB} rages on — ${warriorA} faced ${warriorB} in a grudge match!`,
      `⚔️ VENDETTA IN THE PITS: ${stableA} vs ${stableB} — ${warriorA} and ${warriorB} settled scores in the arena!`,
      `🏟️ BAD BLOOD: ${stableA} and ${stableB} clashed again as ${warriorA} took on ${warriorB}!`,
    ];
    return rng.pick(templates);
  }
}
