import type { Rivalry } from "@/types/state.types";
import type { FightSummary } from "@/types/combat.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { MatchScoringService } from "../matchmakingServices";
import { calculateRivalryScore } from "../ownerGrudges";
import { getStablePairKey } from "@/utils/keyUtils";

/**
 * Detects and updates rivalries based on recent bouts, deaths, and upsets.
 */
export function updateRivalriesFromBouts(
  existingRivalries: Rivalry[],
  weekFights: FightSummary[],
  week: number,
  rng: IRNGService
): Rivalry[] {
  const rivalries = [...existingRivalries];
  const pairs = new Map<string, { a: string; b: string; bouts: number; deaths: number; upsets: number; lastReason: string; aFame: number; dFame: number }>();
  
  for (const f of weekFights) {
    if (!f.a || !f.d) continue;
    const key = getStablePairKey(f.a, f.d);
    const entry = pairs.get(key) ?? { a: f.a, b: f.d, bouts: 0, deaths: 0, upsets: 0, lastReason: "", aFame: f.fameA || 0, dFame: f.fameD || 0 };
    
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
    
    const rawDelta = calculateRivalryScore(data.bouts, data.deaths, data.upsets);
    const intensityDelta = MatchScoringService.calculatePairingScore({
        p_fame: data.aFame || 0, 
        r_fame: data.dFame || 0,
        playerStableId: data.a,
        rivalStableId: data.b,
        week: week,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: false,
        rng: () => rng.next()
    }) > 200 ? 2 : 1;
    
    if (existing) {
      // Direct update using the canonical score, clamped to 5
      existing.intensity = Math.max(existing.intensity, Math.min(5, existing.intensity + intensityDelta + (rawDelta - 1)));
      if (data.deaths > 0 || data.upsets > 0) {
          existing.reason = data.lastReason || existing.reason;
      }
    } else if (data.bouts >= 1) { // Any clash can start a rivalry
      rivalries.push({
        id: rng.uuid("rivalry"),
        stableIdA: data.a,
        stableIdB: data.b,
        intensity: Math.min(5, intensityDelta + (rawDelta - 1)),
        reason: data.lastReason || `Clashed in the arena`,
        startWeek: week
      });
    }
  }
  
  return rivalries;
}
