/**
 * Gazette Detection Functions - Detects patterns in fight data for gazette generation
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import type { FightSummary } from "@/types/combat.types";

export interface GazetteDetections {
  tags: string[];
  hotStreakers: { name: string; streak: number }[];
  rivalryPair: { a: string; b: string; count: number } | null;
  risingStars: string[];
  upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[];
}

/**
 * Compute current win streaks from fight history.
 */
export function computeStreaks(allFights: FightSummary[]): Map<string, number> {
  const streaks = new Map<string, number>();
  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (f.winner === "A") {
      const aStreak = streaks.get(f.a) ?? 0;
      const dStreak = streaks.get(f.d) ?? 0;
      streaks.set(f.a, aStreak >= 0 ? aStreak + 1 : 1);
      streaks.set(f.d, dStreak <= 0 ? dStreak - 1 : -1);
    } else if (f.winner === "D") {
      const aStreak = streaks.get(f.a) ?? 0;
      const dStreak = streaks.get(f.d) ?? 0;
      streaks.set(f.d, dStreak >= 0 ? dStreak + 1 : 1);
      streaks.set(f.a, aStreak <= 0 ? aStreak - 1 : -1);
    } else {
      streaks.set(f.a, 0);
      streaks.set(f.d, 0);
    }
  }
  return streaks;
}

/**
 * Detect if any fight this week involves warriors who have faced each other 3+ times.
 */
export function detectRivalryMatchup(
  weekFights: FightSummary[],
  allFights: FightSummary[]
): { a: string; b: string; count: number } | null {
  const candidatePairs = new Set<string>();
  const names = new Set<string>();
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    candidatePairs.add(f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`);
    names.add(f.a);
    names.add(f.d);
  }

  const pairCounts = new Map<string, number>();
  for (const key of candidatePairs) {
    pairCounts.set(key, 0);
  }

  for (let i = 0; i < allFights.length; i++) {
    const f = allFights[i];
    if (!f) continue;
    if (names.has(f.a) && names.has(f.d)) {
      const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
      if (pairCounts.has(key)) {
        pairCounts.set(key, pairCounts.get(key)! + 1);
      }
    }
  }

  let best: { a: string; b: string; count: number } | null = null;
  for (let i = 0; i < weekFights.length; i++) {
    const f = weekFights[i];
    if (!f) continue;
    const key = f.a < f.d ? `${f.a}||${f.d}` : `${f.d}||${f.a}`;
    const count = pairCounts.get(key) ?? 0;
    if (count >= 3 && (!best || count > best.count)) {
      best = { a: f.a, b: f.d, count };
    }
  }
  return best;
}

/**
 * Detect gazette tags from fights and detections.
 */
export function detectGazetteTags(fights: FightSummary[], detections: GazetteDetections): string[] {
  const tags: string[] = [];
  const kills = fights.filter(f => f.by === "Kill");
  const knockouts = fights.filter(f => f.by === "KO");

  if (kills.length >= 2) tags.push("Bloodbath");
  if (fights.some(f => f.flashyTags?.includes("Comeback"))) tags.push("Comeback");
  if (fights.some(f => f.flashyTags?.includes("Dominance"))) tags.push("Dominance");
  if (knockouts.length >= 3) tags.push("KO Fest");
  if (detections.hotStreakers.length > 0) tags.push("Hot Streak");
  if (detections.rivalryPair) tags.push("Rivalry");
  if (detections.risingStars.length > 0) tags.push("Rising Star");
  if (detections.upsets.length > 0) tags.push("Upset");

  return tags;
}

/**
 * Detect warriors on hot streaks.
 */
export function detectHotStreakers(fights: FightSummary[], streaks: Map<string, number>): { name: string; streak: number }[] {
  const hotStreakers: { name: string; streak: number }[] = [];
  for (const f of fights) {
    if (!f.winner) continue;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const s = streaks.get(winnerName) ?? 0;
    if (s >= 5) hotStreakers.push({ name: winnerName, streak: s });
  }
  return hotStreakers;
}

/**
 * Detect rising stars (3-0 warriors).
 */
export function detectRisingStars(fights: FightSummary[], allFights: FightSummary[]): string[] {
  const risingStars: string[] = [];
  if (!allFights || fights.length === 0) return risingStars;

  const candidates = new Set<string>();
  for (const f of fights) {
    if (f.winner) {
      candidates.add(f.winner === "A" ? f.a : f.d);
    }
  }

  const stats = new Map<string, { total: number; wins: number }>();
  for (const c of candidates) {
    stats.set(c, { total: 0, wins: 0 });
  }

  for (const af of allFights) {
    if (candidates.has(af.a)) {
      const s = stats.get(af.a)!;
      s.total++;
      if (af.winner === "A") s.wins++;
    }
    if (candidates.has(af.d)) {
      const s = stats.get(af.d)!;
      s.total++;
      if (af.winner === "D") s.wins++;
    }
  }

  for (const c of candidates) {
    const s = stats.get(c)!;
    if (s.total === 3 && s.wins === 3) {
      risingStars.push(c);
    }
  }

  return risingStars;
}

/**
 * Detect upset victories.
 */
export function detectUpsets(fights: FightSummary[]): { winner: string; loser: string; winnerFame: number; loserFame: number }[] {
  const upsets: { winner: string; loser: string; winnerFame: number; loserFame: number }[] = [];
  for (const f of fights) {
    if (!f.winner || f.fameA == null || f.fameD == null) continue;
    const winnerFame = f.winner === "A" ? f.fameA : f.fameD;
    const loserFame = f.winner === "A" ? f.fameD : f.fameA;
    const winnerName = f.winner === "A" ? f.a : f.d;
    const loserName = f.winner === "A" ? f.d : f.a;
    if (loserFame >= winnerFame + 10 && loserFame >= winnerFame * 2) {
      upsets.push({ winner: winnerName, loser: loserName, winnerFame, loserFame });
    }
  }
  return upsets;
}
