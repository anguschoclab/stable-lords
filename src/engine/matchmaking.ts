/**
 * Matchmaking Engine — cross-stable pairing, AI vs AI bouts, rivalry detection.
 * Implements Stable_Lords_Matchmaking_and_Scheduling_Spec_v1.0
 */
import type {
  GameState, Warrior, RivalStableData, FightSummary,
  RestState, Rivalry, MatchRecord,
} from "@/types/game";
import { isTooInjuredToFight } from "./injuries";
import { isFightReady } from "./warriorStatus";
import { simulateFight } from "./simulate";
import { aiPlanForWarrior } from "./ownerAI";
import { computeMetaDrift } from "./metaDrift";
import { pickRivalOpponent } from "./rivals";

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

// ─── Scoring ──────────────────────────────────────────────────────────────

function pairingScore(
  p: Warrior, r: Warrior, rivalStableId: string,
  rivalryMap: Map<string, number>, matchHistoryMap: Map<string, number>,
  playerStableId: string, week: number, rng: () => number,
  recentStylePairs: Set<string>,
  playerChallengesSet: Set<string>,
  playerAvoidsSet: Set<string>
): number {
  let score = 100;

  // Fame proximity bonus (0-30)
  score += Math.max(0, 30 - Math.abs(p.fame - r.fame) * 3);

  // Rivalry bonus
  const rivalryKey = playerStableId < rivalStableId ? `${playerStableId}|${rivalStableId}` : `${rivalStableId}|${playerStableId}`;
  const rivalryIntensity = rivalryMap.get(rivalryKey);

  if (rivalryIntensity !== undefined) {
    // Give intense rivalries / blood feuds (intensity >= 4) a massive booking score boost
    score += (rivalryIntensity >= 4) ? 200 : 50;
  }

  // Style diversity bonus — +20 if this style matchup hasn't occurred in last 4 weeks
  const thisPair = `${p.style}|${r.style}`;
  const reversePair = `${r.style}|${p.style}`;
  if (!recentStylePairs.has(thisPair) && !recentStylePairs.has(reversePair)) {
    score += 20;
  }


  // Repeat penalty — -100 if fought in last 2 weeks
  const matchKey = `${p.id}|${r.id}`;
  const lastMatchWeek = matchHistoryMap.get(matchKey);
  if (lastMatchWeek !== undefined && lastMatchWeek >= week - 2) {
      score -= 100;
  }

  // Challenge / Avoid Assistant modifiers
  // Extremely heavy weights so they basically override other considerations if possible
  if (playerChallengesSet.has(r.id) || playerChallengesSet.has(rivalStableId)) {
    score += 500;
  }
  if (playerAvoidsSet.has(r.id) || playerAvoidsSet.has(rivalStableId)) {
    score -= 500;
  }


  // Random jitter (0-15)
  score += Math.floor(rng() * 16);

  return score;
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
  
  // Collect all eligible rival warriors
  const rivalPool: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const rival of (state.rivals || [])) {
    for (const w of rival.roster) {
      if (isEligible(w, state.week, restMap, trainingIds)) {
        rivalPool.push({ warrior: w, stable: rival });
      }
    }
  }

  if (playerPool.length === 0 || rivalPool.length === 0) return [];

  const rivalries = state.rivalries || [];
  const rivalryMap = new Map<string, number>();
  for (const rv of rivalries) {
      const key = rv.stableIdA < rv.stableIdB ? `${rv.stableIdA}|${rv.stableIdB}` : `${rv.stableIdB}|${rv.stableIdA}`;
      rivalryMap.set(key, Math.max(rv.intensity, rivalryMap.get(key) ?? 0));
  }

  const matchHistory = state.matchHistory || [];
  const matchHistoryMap = new Map<string, number>();
  for (const m of matchHistory) {
      const key = `${m.playerWarriorId}|${m.opponentWarriorId}`;
      matchHistoryMap.set(key, Math.max(m.week, matchHistoryMap.get(key) ?? 0));
  }

  const recentHistory = state.arenaHistory || [];
  const recentStylePairs = new Set<string>();
  for (const f of recentHistory) {
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
    // Score all unpaired rival candidates
    let bestScore = -Infinity;
    let bestCandidate: { warrior: Warrior; stable: RivalStableData } | null = null;

    for (const rc of rivalPool) {
      if (pairedRival.has(rc.warrior.id)) continue;
      const s = pairingScore(
        pw, rc.warrior, rc.stable.owner.id,
        rivalryMap, matchHistoryMap, state.player.id, state.week, rng,
        recentStylePairs,
        playerChallengesSet,
        playerAvoidsSet
      );
      if (s > bestScore) { bestScore = s; bestCandidate = rc; }
    }

    if (bestCandidate) {
      const key = state.player.id < bestCandidate.stable.owner.id ? `${state.player.id}|${bestCandidate.stable.owner.id}` : `${bestCandidate.stable.owner.id}|${state.player.id}`;
      const isRivalryBout = rivalryMap.has(key);
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

export function runAIvsAIBouts(state: GameState): { results: AIBoutResult[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const restStates = state.restStates || [];
  const restMap = new Map<string, number>();
  for (const r of restStates) {
      restMap.set(r.warriorId, Math.max(r.restUntilWeek, restMap.get(r.warriorId) ?? 0));
  }
  const trainingIds = new Set<string>();

  // Collect eligible rival warriors with stable info
  const pool: { warrior: Warrior; stableIdx: number; stableId: string; stableName: string }[] = [];
  const rivals = [...(state.rivals || [])];
  
  for (let si = 0; si < rivals.length; si++) {
    for (const w of rivals[si].roster) {
      if (isEligible(w, state.week, restMap, trainingIds)) {
        pool.push({ warrior: w, stableIdx: si, stableId: rivals[si].owner.id, stableName: rivals[si].owner.stableName });
      }
    }
  }

  const maxBouts = Math.min(Math.floor(pool.length / 2), 4);
  const paired = new Set<string>();
  const boutPairs: { a: typeof pool[0]; d: typeof pool[0] }[] = [];

  // Pair warriors from DIFFERENT stables, using pickRivalOpponent as fallback
  for (const a of pool) {
    if (paired.has(a.warrior.id) || boutPairs.length >= maxBouts) break;
    // Try direct scan first for speed
    let found = false;
    for (const d of pool) {
      if (paired.has(d.warrior.id) || disallowStablemates(a.stableId, d.stableId)) continue;
      boutPairs.push({ a, d });
      paired.add(a.warrior.id);
      paired.add(d.warrior.id);
      found = true;
      break;
    }
    // Fallback: use pickRivalOpponent for broader cross-stable search
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

  const results: AIBoutResult[] = [];
  const gazetteItems: string[] = [];
  // Deep clone rivals for mutation
  const updatedRivals = rivals.map(r => ({
    ...r,
    roster: r.roster.map(w => ({ ...w, career: { ...w.career } })),
  }));

  // Compute current meta for plan adjustments
  const meta = computeMetaDrift(state.arenaHistory, 20);

  // Check for existing rivalries between AI stables
  const rivalries = state.rivalries || [];
  const rivalryMap = new Map<string, boolean>();
  for (const rv of rivalries) {
      const key = rv.stableIdA < rv.stableIdB ? `${rv.stableIdA}|${rv.stableIdB}` : `${rv.stableIdB}|${rv.stableIdA}`;
      rivalryMap.set(key, true);
  }

  for (const { a, d } of boutPairs) {
    // Use personality-driven plans for AI warriors with meta awareness
    const stableA = rivals.find((_, idx) => idx === a.stableIdx);
    const stableD = rivals.find((_, idx) => idx === d.stableIdx);
    const persA = stableA?.owner?.personality ?? "Pragmatic";
    const philA = stableA?.philosophy ?? "Balanced";
    const adaptA = stableA?.owner?.metaAdaptation ?? "Opportunist";
    const persD = stableD?.owner?.personality ?? "Pragmatic";
    const philD = stableD?.philosophy ?? "Balanced";
    const adaptD = stableD?.owner?.metaAdaptation ?? "Opportunist";

    const planA = a.warrior.plan ?? aiPlanForWarrior(a.warrior, persA, philA, { meta, adaptation: adaptA }, d.warrior.style);
    const planD = d.warrior.plan ?? aiPlanForWarrior(d.warrior, persD, philD, { meta, adaptation: adaptD }, a.warrior.style);
    const outcome = simulateFight(planA, planD, a.warrior, d.warrior);

    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;

    // Check if this is a rivalry bout between AI stables
    const key = a.stableId < d.stableId ? `${a.stableId}|${d.stableId}` : `${d.stableId}|${a.stableId}`;
    const isRivalryBout = rivalryMap.has(key);

    // Update records in updatedRivals
    const updateWarriorRecord = (stableIdx: number, wId: string, won: boolean, killed: boolean) => {
      const roster = updatedRivals[stableIdx].roster;
      const idx = roster.findIndex(w => w.id === wId);
      if (idx >= 0) {
        roster[idx] = {
          ...roster[idx],
          career: {
            wins: roster[idx].career.wins + (won ? 1 : 0),
            losses: roster[idx].career.losses + (won ? 0 : 1),
            kills: roster[idx].career.kills + (killed ? 1 : 0),
          },
          fame: Math.max(0, roster[idx].fame + (won ? (killed ? 3 : 1) : 0)),
        };
        // Accumulate stable-level fame on the owner
        if (won) {
          updatedRivals[stableIdx].owner = {
            ...updatedRivals[stableIdx].owner,
            fame: (updatedRivals[stableIdx].owner.fame ?? 0) + (killed ? 3 : 1),
          };
        }
      }
    };

    updateWarriorRecord(a.stableIdx, a.warrior.id, winnerSide === "A", isKill && winnerSide === "A");
    updateWarriorRecord(d.stableIdx, d.warrior.id, winnerSide === "D", isKill && winnerSide === "D");

    // Handle AI death
    if (isKill) {
      const deadStableIdx = winnerSide === "A" ? d.stableIdx : a.stableIdx;
      const deadId = winnerSide === "A" ? d.warrior.id : a.warrior.id;
      updatedRivals[deadStableIdx].roster = updatedRivals[deadStableIdx].roster.filter(w => w.id !== deadId);
    }

    const result: AIBoutResult = {
      stableA: a.stableName,
      stableB: d.stableName,
      warriorA: a.warrior.name,
      warriorD: d.warrior.name,
      winner: winnerSide,
      by: outcome.by,
      kill: isKill,
    };
    results.push(result);

    // Rivalry special coverage for AI vs AI bouts
    if (isRivalryBout) {
      const rivalryCoverageTemplates = [
        `🔥 RIVALRY REPORT: The feud between ${a.stableName} and ${d.stableName} rages on — ${a.warrior.name} faced ${d.warrior.name} in a grudge match!`,
        `⚔️ VENDETTA IN THE PITS: ${a.stableName} vs ${d.stableName} — ${a.warrior.name} and ${d.warrior.name} settled scores in the arena!`,
        `🏟️ BAD BLOOD: ${a.stableName} and ${d.stableName} clashed again as ${a.warrior.name} took on ${d.warrior.name}!`,
      ];
      gazetteItems.push(rivalryCoverageTemplates[Math.floor(Math.random() * rivalryCoverageTemplates.length)]);
    }

    // Generate gazette entry for notable outcomes
    if (isKill) {
      const killer = winnerSide === "A" ? a.warrior.name : d.warrior.name;
      const killerStable = winnerSide === "A" ? a.stableName : d.stableName;
      const victim = winnerSide === "A" ? d.warrior.name : a.warrior.name;
      if (isRivalryBout) {
        gazetteItems.push(`☠️ BLOOD FEUD DEEPENS: ${killer} (${killerStable}) slew ${victim} — this rivalry just turned deadlier!`);
      } else {
        gazetteItems.push(`☠️ ${killer} (${killerStable}) killed ${victim} in rival arena action!`);
      }
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

import { calculateRivalryScore } from "./rivals";

// ─── Rivalry Detection ────────────────────────────────────────────────────

export function updateRivalriesFromBouts(
  existingRivalries: Rivalry[],
  weekFights: FightSummary[],
  week: number
): Rivalry[] {
  const rivalries = [...existingRivalries];
  
  // Group fights by stable pairs
  const pairs = new Map<string, { a: string; b: string; bouts: number; deaths: number; upsets: number; lastReason: string }>();
  
  for (const f of weekFights) {
    if (!f.stableA || !f.stableD) continue; // Skip if it's not a stable-based fight
    const key = f.stableA < f.stableD ? `${f.stableA}|${f.stableD}` : `${f.stableD}|${f.stableA}`;
    const entry = pairs.get(key) ?? { a: f.stableA, b: f.stableD, bouts: 0, deaths: 0, upsets: 0, lastReason: "" };
    
    entry.bouts++;
    if (f.by === "Kill") {
        entry.deaths++;
        entry.lastReason = `${f.winner === "A" ? f.a : f.d} killed ${f.winner === "A" ? f.d : f.a} in Week ${week}`;
    }
    
    // Upset detection: fame gap > 20 and lower fame wins
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
  
  for (const [key, data] of pairs.entries()) {
    const existing = rivalries.find(r =>
      (r.stableIdA === data.a && r.stableIdB === data.b) ||
      (r.stableIdB === data.a && r.stableIdA === data.b)
    );
    
    const intensityDelta = calculateRivalryScore(data.bouts, data.deaths, data.upsets);
    
    if (existing) {
      existing.intensity = Math.max(existing.intensity, Math.min(5, existing.intensity + Math.floor(intensityDelta / 2)));
      if (data.deaths > 0 || data.upsets > 0) {
          existing.reason = data.lastReason || existing.reason;
      }
    } else if (intensityDelta >= 2 || data.bouts >= 3) {
      rivalries.push({
        stableIdA: data.a,
        stableIdB: data.b,
        intensity: Math.min(5, intensityDelta),
        reason: data.lastReason || `Frequent clashes in the arena`,
        startWeek: week
      });
    }
  }
  
  return rivalries;
}

// ─── Rest State Management ────────────────────────────────────────────────

export function addRestState(restStates: RestState[], warriorId: string, outcome: string | null, week: number): RestState[] {
  // KO loss = 1 week rest
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
  // Keep last 8 weeks
  const pruned = history.filter(m => m.week >= week - 8);
  return [...pruned, { week, playerWarriorId, opponentWarriorId, opponentStableId }];
}
