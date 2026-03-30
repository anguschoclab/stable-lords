/**
 * Matchmaking Engine — cross-stable pairing, AI vs AI bouts, rivalry detection.
 */
import type {
  GameState, Warrior, RivalStableData, FightSummary,
  RestState, Rivalry, MatchRecord,
} from "@/types/game";
import { isFightReady } from "./warriorStatus";
import { simulateFight } from "./simulate";
import { aiPlanForWarrior } from "./ownerAI";
import { computeMetaDrift } from "./metaDrift";
import { pickRivalOpponent } from "./rivals";
import { MatchScoringService, AIBoutService } from "./matchmakingServices";
import { getStablePairKey, getWarriorPairKey } from "@/utils/keyUtils";
import { generateId } from "@/utils/idUtils";
import { updateEntityInList } from "@/utils/stateUtils";

/** Stablemates cannot fight each other */
function disallowStablemates(aStableId: string, dStableId: string): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
}

// ─── Eligibility ──────────────────────────────────────────────────────────

function isEligible(w: Warrior, week: number, restMap: Map<string, number>, trainingIds: Set<string>): boolean {
  if (!isFightReady(w)) return false;
  const restUntil = restMap.get(w.id);
  if (restUntil && restUntil > week) return false;
  if (trainingIds.has(w.id)) return false;
  return true;
}

// ─── Cross-Stable Pairing ─────────────────────────────────────────────────

export interface MatchPairing {
  playerWarrior: Warrior;
  rivalWarrior: Warrior;
  rivalStable: RivalStableData;
  isRivalryBout: boolean;
}

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
        rng
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

// ─── AI vs AI Background Bouts ────────────────────────────────────────────

export interface AIBoutResult {
  stableA: string;
  stableB: string;
  warriorA: string;
  warriorD: string;
  winner: "A" | "D" | null;
  by: string | null;
  kill: boolean;
}

export interface AIPoolWarrior {
  warrior: Warrior;
  stableIdx: number;
  stableId: string;
  stableName: string;
}

export function collectEligibleAIWarriors(state: GameState, rivals: RivalStableData[]): AIPoolWarrior[] {
  const restMap = new Map<string, number>();
  for (const r of (state.restStates || [])) {
    restMap.set(r.warriorId, Math.max(r.restUntilWeek, restMap.get(r.warriorId) ?? 0));
  }
  const trainingIds = new Set<string>();
  const pool: AIPoolWarrior[] = [];
  
  for (let si = 0; si < rivals.length; si++) {
    for (const w of rivals[si].roster) {
      if (isEligible(w, state.week, restMap, trainingIds)) {
        pool.push({ warrior: w, stableIdx: si, stableId: rivals[si].owner.id, stableName: rivals[si].owner.stableName });
      }
    }
  }
  return pool;
}

export function pairAIWarriors(pool: AIPoolWarrior[], rivals: RivalStableData[]): { a: AIPoolWarrior; d: AIPoolWarrior }[] {
  const maxBouts = Math.min(Math.floor(pool.length / 2), 4);
  const paired = new Set<string>();
  const boutPairs: { a: AIPoolWarrior; d: AIPoolWarrior }[] = [];

  for (const a of pool) {
    if (paired.has(a.warrior.id) || boutPairs.length >= maxBouts) break;

    let found = false;
    for (const d of pool) {
      if (paired.has(d.warrior.id) || disallowStablemates(a.stableId, d.stableId)) continue;
      boutPairs.push({ a, d });
      paired.add(a.warrior.id);
      paired.add(d.warrior.id);
      found = true;
      break;
    }

    if (!found && rivals.length > 0) {
      const pick = pickRivalOpponent(rivals, paired);
      if (pick && !disallowStablemates(a.stableId, pick.rival.owner.id)) {
        const dIdx = pool.findIndex(p => p.warrior.id === pick.warrior.id);
        if (dIdx >= 0) {
          boutPairs.push({ a, d: pool[dIdx] });
          paired.add(a.warrior.id);
          paired.add(pool[dIdx].warrior.id);
        }
      }
    }
  }
  return boutPairs;
}

export function runAIvsAIBouts(state: GameState): { results: AIBoutResult[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rivals = [...(state.rivals || [])];
  const pool = collectEligibleAIWarriors(state, rivals);
  const boutPairs = pairAIWarriors(pool, rivals);

  const results: AIBoutResult[] = [];
  const gazetteItems: string[] = [];
  
  const updatedRivals = rivals.map(r => ({
    ...r,
    roster: r.roster.map(w => ({ ...w, career: { ...w.career } })),
  }));

  const meta = computeMetaDrift(state.arenaHistory, 20);
  const rivalryMap = new Map<string, boolean>();
  for (const rv of (state.rivalries || [])) {
    rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), true);
  }

  for (const { a, d } of boutPairs) {
    const stableA = rivals[a.stableIdx];
    const stableD = rivals[d.stableIdx];

    const planA = a.warrior.plan ?? aiPlanForWarrior(
      a.warrior, 
      stableA.owner.personality, 
      stableA.philosophy, 
      d.warrior.style
    );
    const planD = d.warrior.plan ?? aiPlanForWarrior(
      d.warrior, 
      stableD.owner.personality, 
      stableD.philosophy, 
      a.warrior.style
    );

    const outcome = simulateFight(planA, planD, a.warrior, d.warrior, undefined, state.trainers);
    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;
    const isRivalryBout = rivalryMap.has(getStablePairKey(a.stableId, d.stableId));

    // Update records using the service
    updatedRivals[a.stableIdx].roster = AIBoutService.updateWarriorRecord(
      updatedRivals[a.stableIdx].roster, 
      a.warrior.id, 
      winnerSide === "A", 
      isKill && winnerSide === "A"
    );
    updatedRivals[d.stableIdx].roster = AIBoutService.updateWarriorRecord(
      updatedRivals[d.stableIdx].roster, 
      d.warrior.id, 
      winnerSide === "D", 
      isKill && winnerSide === "D"
    );

    if (winnerSide === "A") {
      updatedRivals[a.stableIdx].owner.fame = (updatedRivals[a.stableIdx].owner.fame ?? 0) + (isKill ? 3 : 1);
    } else if (winnerSide === "D") {
      updatedRivals[d.stableIdx].owner.fame = (updatedRivals[d.stableIdx].owner.fame ?? 0) + (isKill ? 3 : 1);
    }

    if (isKill) {
      const deadIdx = winnerSide === "A" ? d.stableIdx : a.stableIdx;
      const deadId = winnerSide === "A" ? d.warrior.id : a.warrior.id;
      updatedRivals[deadIdx].roster = updatedRivals[deadIdx].roster.filter(w => w.id !== deadId);
    }

    results.push({
      stableA: a.stableName,
      stableB: d.stableName,
      warriorA: a.warrior.name,
      warriorD: d.warrior.name,
      winner: winnerSide,
      by: outcome.by,
      kill: isKill,
    });

    if (isRivalryBout) {
      gazetteItems.push(AIBoutService.generateRivalryNarrative(a.stableName, d.stableName, a.warrior.name, d.warrior.name));
    }

    if (isKill) {
      const killer = winnerSide === "A" ? a.warrior.name : d.warrior.name;
      const killerStable = winnerSide === "A" ? a.stableName : d.stableName;
      const victim = winnerSide === "A" ? d.warrior.name : a.warrior.name;
      gazetteItems.push(isRivalryBout 
        ? `☠️ BLOOD FEUD DEEPENS: ${killer} (${killerStable}) slew ${victim} — this rivalry just turned deadlier!`
        : `☠️ ${killer} (${killerStable}) killed ${victim} in rival arena action!`
      );
    } else if (outcome.by === "KO") {
      const winner = winnerSide === "A" ? a.warrior.name : d.warrior.name;
      const wStable = winnerSide === "A" ? a.stableName : d.stableName;
      const loser = winnerSide === "A" ? d.warrior.name : a.warrior.name;
      gazetteItems.push(`In rival action: ${winner} (${wStable}) defeated ${loser} by KO.`);
    }
  }

  if (results.length === 0) {
    gazetteItems.push("A quiet week in the rival arenas — no notable bouts.");
  }

  return { results, updatedRivals, gazetteItems };
}

export { calculateRivalryScore } from "./matchmakingServices";

// ─── Rivalry Detection ────────────────────────────────────────────────────

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
        playerWarrior: {} as any, // Only used for types here
        rivalWarrior: {} as any,
        playerStableId: data.a,
        rivalStableId: data.b,
        week: week,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: false,
        rng: Math.random
    }) > 200 ? 2 : 1; // Simplification for rivalry escalation logic
    
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

// ─── Rest State Management ────────────────────────────────────────────────

export function addRestState(restStates: RestState[], warriorId: string, outcome: string | null, week: number): RestState[] {
  if (outcome === "KO") {
    return [...restStates, { warriorId, restUntilWeek: week + 1 }];
  }
  return restStates;
}

export function clearExpiredRest(restStates: RestState[], week: number): RestState[] {
  return restStates.filter(r => r.restUntilWeek > week);
}

// ─── Match Record Tracking ────────────────────────────────────────────────

export function addMatchRecord(
  history: MatchRecord[], playerWarriorId: string,
  opponentWarriorId: string, opponentStableId: string, week: number
): MatchRecord[] {
  const pruned = history.filter(m => m.week >= week - 8);
  return [...pruned, { week, playerWarriorId, opponentWarriorId, opponentStableId }];
}
