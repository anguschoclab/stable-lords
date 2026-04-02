import type { 
  GameState, Warrior, RivalStableData 
} from "@/types/game";
import { isFightReady } from "../warriorStatus";
import { MatchScoringService } from "../matchmakingServices";
import { getStablePairKey, getWarriorPairKey } from "@/utils/keyUtils";

export interface MatchPairing {
  playerWarrior: Warrior;
  rivalWarrior: Warrior;
  rivalStable: RivalStableData;
  isRivalryBout: boolean;
}

/**
 * Checks if a warrior is eligible for matchmaking this week.
 */
export function isEligible(
  w: Warrior, 
  week: number, 
  restMap: Map<string, number>, 
  trainingIds: Set<string>
): boolean {
  if (!isFightReady(w)) return false;
  const restUntil = restMap.get(w.id);
  if (restUntil && restUntil > week) return false;
  if (trainingIds.has(w.id)) return false;
  return true;
}

/**
 * Generates the weekly match card (Player vs Rival pairings).
 */
export function generateMatchCard(state: GameState): MatchPairing[] {
  const trainingIds = new Set((state.trainingAssignments || []).map(a => a.warriorId));
  const restStates = state.restStates || [];
  const restMap = new Map<string, number>();
  for (const r of restStates) {
      restMap.set(r.warriorId, Math.max(r.restUntilWeek, restMap.get(r.warriorId) ?? 0));
  }

  const playerPool = state.roster.filter(w => isEligible(w, state.week, restMap, trainingIds));
  
  const rivalPool: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const rival of (state.rivals || [])) {
    for (const w of rival.roster) {
      if (isEligible(w, state.week, restMap, trainingIds)) {
        rivalPool.push({ warrior: w, stable: rival });
      }
    }
  }

  if (playerPool.length === 0 || rivalPool.length === 0) return [];

  const rivalryMap = new Map<string, number>();
  for (const rv of (state.rivalries || [])) {
      rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), rv.intensity);
  }

  const matchHistoryMap = new Map<string, number>();
  for (const m of (state.matchHistory || [])) {
      matchHistoryMap.set(getWarriorPairKey(m.playerWarriorId, m.opponentWarriorId), m.week);
  }

  const recentStylePairs = new Set<string>();
  for (const f of (state.arenaHistory || [])) {
      if (f.week >= state.week - 4) {
          recentStylePairs.add(`${f.styleA}|${f.styleD}`);
      }
  }

  const playerChallengesSet = new Set(state.playerChallenges || []);
  const playerAvoidsSet = new Set(state.playerAvoids || []);

  // Simple seeded RNG for jitter
  let seed = state.week * 7919;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const pairedRival = new Set<string>();
  const pairings: MatchPairing[] = [];

  for (const pw of playerPool) {
    let bestScore = -Infinity;
    let bestCandidate: { warrior: Warrior; stable: RivalStableData } | null = null;

    for (const rc of rivalPool) {
      if (pairedRival.has(rc.warrior.id)) continue;
      
      const rivalryKey = getStablePairKey(state.player.id, rc.stable.owner.id);
      const matchKey = getWarriorPairKey(pw.id, rc.warrior.id);
      
      const score = MatchScoringService.calculatePairingScore({
        playerWarrior: pw,
        rivalWarrior: rc.warrior,
        playerStableId: state.player.id,
        rivalStableId: rc.stable.owner.id,
        week: state.week,
        rivalryIntensity: rivalryMap.get(rivalryKey),
        lastMatchWeek: matchHistoryMap.get(matchKey),
        isRecentStyleMatch: recentStylePairs.has(`${pw.style}|${rc.warrior.style}`) || recentStylePairs.has(`${rc.warrior.style}|${pw.style}`),
        isChallenged: playerChallengesSet.has(rc.warrior.id) || playerChallengesSet.has(rc.stable.owner.id),
        isAvoided: playerAvoidsSet.has(rc.warrior.id) || playerAvoidsSet.has(rc.stable.owner.id),
        rng,
        rivalIntent: rc.stable.strategy?.intent
      });

      if (score > bestScore) { bestScore = score; bestCandidate = rc; }
    }

    if (bestCandidate) {
      const isRivalryBout = rivalryMap.has(getStablePairKey(state.player.id, bestCandidate.stable.owner.id));
      pairings.push({
        playerWarrior: pw,
        rivalWarrior: bestCandidate.warrior,
        rivalStable: bestCandidate.stable,
        isRivalryBout,
      });
      pairedRival.add(bestCandidate.warrior.id);
    }
  }

  return pairings;
}
