import type { Rivalry, FightSummary } from "@/types/game";
import { MatchScoringService } from "../matchmakingServices";
import { getStablePairKey } from "@/utils/keyUtils";

/**
 * Detects and updates rivalries based on recent bouts, deaths, and upsets.
 */
export function updateRivalriesFromBouts(
  existingRivalries: Rivalry[],
  weekFights: FightSummary[],
  week: number
): Rivalry[] {
  const rivalries = [...existingRivalries];
  const pairs = new Map<string, { a: string; b: string; bouts: number; deaths: number; upsets: number; lastReason: string }>();
  
  for (const f of weekFights) {
    if (!f.stableA || !f.stableD) continue;
    const key = getStablePairKey(f.stableA, f.stableD);
    const entry = pairs.get(key) ?? { a: f.stableA, b: f.stableD, bouts: 0, deaths: 0, upsets: 0, lastReason: "" };
    
    entry.bouts++;
    if (f.by === "Kill") {
        entry.deaths++;
        entry.lastReason = `${f.winner === "A" ? f.a : f.d} killed ${f.winner === "A" ? f.d : f.a} in Week ${week}`;
    }
    
    if (f.winner && f.fameA !== undefined && f.fameD !== undefined) {
        const winnerFame = f.winner === "A" ? f.fameA : f.fameD;
        const loserFame = f.winner === "A" ? f.fameD : f.fameA;
        if (loserFame > winnerFame + 20) {
            entry.upsets++;
            if (!entry.lastReason || f.by !== "Kill") {
                entry.lastReason = `${f.winner === "A" ? f.a : f.d} upset ${f.winner === "A" ? f.d : f.a} in Week ${week}`;
            }
        }
    }
    pairs.set(key, entry);
  }
  
  for (const [_, data] of pairs.entries()) {
    const existing = rivalries.find(r =>
      (r.stableIdA === data.a && r.stableIdB === data.b) ||
      (r.stableIdB === data.a && r.stableIdA === data.b)
    );
    
    const intensityDelta = MatchScoringService.calculatePairingScore({
        playerWarrior: {} as any, 
        rivalWarrior: {} as any,
        playerStableId: data.a,
        rivalStableId: data.b,
        week: week,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: false,
        rng: Math.random
    }) > 200 ? 2 : 1;
    
    if (existing) {
      existing.intensity = Math.max(existing.intensity, Math.min(5, existing.intensity + Math.floor(intensityDelta / 2)));
      if (data.deaths > 0 || data.upsets > 0) {
          existing.reason = data.lastReason || existing.reason;
      }
    } else if (data.bouts >= 3) {
      rivalries.push({
        stableIdA: data.a,
        stableIdB: data.b,
        intensity: 2,
        reason: data.lastReason || `Frequent clashes in the arena`,
        startWeek: week
      });
    }
  }
  
  return rivalries;
}
