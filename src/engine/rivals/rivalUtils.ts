/**
 * Rival Utility Functions - Helper functions for rival operations
 * Extracted from rivals.ts to follow SRP
 */
import type { RivalStableData, Warrior } from '@/types/state.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { clamp } from '@/utils/math';

/**
 * Randomly picks an eligible opponent from a pool of rival stables.
 * Used for AI-vs-AI matchmaking when local pools are empty.
 */
export function pickRivalOpponent(
  rivals: RivalStableData[],
  excludeIds: Set<string>,
  seed?: number
): { warrior: Warrior; rival: RivalStableData } | null {
  const allEligible: { warrior: Warrior; rival: RivalStableData }[] = [];
  rivals.forEach((r) => {
    r.roster.forEach((w) => {
      if (w.status === 'Active' && !excludeIds.has(w.id)) {
        allEligible.push({ warrior: w, rival: r });
      }
    });
  });

  if (allEligible.length === 0) return null;
  const rng = new SeededRNGService(seed ?? allEligible.length * 101);
  return rng.pick(allEligible);
}

/**
 * Generates rivalry narrative text.
 */
export function generateRivalryNarrative(
  stableA: string,
  stableB: string,
  warriorA: string,
  warriorB: string,
  seed?: number
): string {
  const rng = new SeededRNGService(seed ?? stableA.length * 13);
  const templates = [
    `🔥 RIVALRY REPORT: The feud between ${stableA} and ${stableB} rages on — ${warriorA} faced ${warriorB} in a grudge match!`,
    `⚔️ VENDETTA IN THE PITS: ${stableA} vs ${stableB} — ${warriorA} and ${warriorB} settled scores in the arena!`,
    `🏟️ BAD BLOOD: ${stableA} and ${stableB} clashed again as ${warriorA} took on ${warriorB}!`,
  ];
  return rng.pick(templates)!;
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
  return clamp(score, 1, 5);
}
