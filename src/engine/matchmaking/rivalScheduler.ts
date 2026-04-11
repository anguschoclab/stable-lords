import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { simulateFight } from "../simulate";
import { aiPlanForWarrior } from "../ownerAI";
import { computeMetaDrift } from "../metaDrift";
import { logAgentAction } from "../ai/agentCore";
import { pickRivalOpponent } from "../rivals";
import { AIBoutService } from "../matchmakingServices";
import { getStablePairKey } from "@/utils/keyUtils";
import { isEligible } from "./eligibility";
import { SeededRNG } from "@/utils/random";

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

/** Stablemates cannot fight each other */
function disallowStablemates(aStableId: string, dStableId: string): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
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

import { generateBoutBids, verifyBoutAcceptance, BoutBid } from "../ai/workers/competitionWorker";

/** Simple FNV-1a hash for deterministic seeds from IDs */
function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * pairAIWarriors: Refactored to an "Agentic Market" model.
 * 1. Collect bids from all eligible agents.
 * 2. Reconcile bids into pairings.
 * 3. Skeptically verify acceptance.
 */
export function pairAIWarriors(pool: AIPoolWarrior[], rivals: RivalStableData[], state: GameState, seed?: number): { a: AIPoolWarrior; d: AIPoolWarrior }[] {
  const rngSnapshot = new SeededRNG(seed ?? (state.week * 7919 + 202));
  const maxBouts = Math.min(Math.floor(pool.length / 2), 6); 
  const paired = new Set<string>();
  const boutPairs: { a: AIPoolWarrior; d: AIPoolWarrior }[] = [];

  // A) Collect Bids
  const allBids: { rivalIdx: number; bids: BoutBid[] }[] = rivals.map((r, idx) => ({
    rivalIdx: idx,
    bids: generateBoutBids(r, state.week, state.weather, state.crowdMood).bids 
  }));

  // Sort bids by priority (VENDETTA highest)
  const flattenedBids = allBids.flatMap(ab => ab.bids.map(b => ({ ...b, rivalIdx: ab.rivalIdx })))
    .sort((a, b) => b.priority - a.priority);

  // B) Reconcile Bids
  for (const bid of flattenedBids) {
    if (paired.has(bid.proposingWarriorId) || boutPairs.length >= maxBouts) continue;

    const attackerPoolEntry = pool.find(p => p.warrior.id === bid.proposingWarriorId);
    if (!attackerPoolEntry) continue;

    // Find best defender based on bid criteria
    const candidates = pool.filter(p => {
      if (paired.has(p.warrior.id)) return false;
      if (disallowStablemates(attackerPoolEntry.stableId, p.stableId)) return false; // Ensure they aren't from the same stable

      // Bid Filters
      if (bid.targetStableId && p.stableId !== bid.targetStableId) return false;
      if (bid.targetWarriorId && p.warrior.id !== bid.targetWarriorId) return false;
      if (bid.minFame && (p.warrior.fame || 0) < bid.minFame) return false;
      if (bid.maxFame && (p.warrior.fame || 0) > bid.maxFame) return false;

      return true;
    });

    if (candidates.length > 0) {
      // Pick best candidate (e.g. closest fame or random)
      const d = rngSnapshot.pick(candidates);
      
      // ⚡ Skeptical Acceptance Check for the Defender
      const defenderStable = rivals.find(r => r.owner.id === d.stableId);
      const attackerStable = rivals[bid.rivalIdx];
      
      if (defenderStable && attackerPoolEntry && d) {
        const decision = verifyBoutAcceptance(defenderStable, d.warrior, attackerPoolEntry.warrior, attackerStable, state.weather);
        
        if (decision.accepted) {
          boutPairs.push({ a: attackerPoolEntry, d });
          paired.add(attackerPoolEntry.warrior.id);
          paired.add(d.warrior.id);
          
          // ⚡ Log Acceptance: Use the rivalIdx from the bid to find attacker stable
          rivals[bid.rivalIdx] = logAgentAction(rivals[bid.rivalIdx], "STRATEGY", `Proposed bout: ${attackerPoolEntry.warrior.name} vs ${d.warrior.name} - ${bid.description}`, "Medium", state.week);
          const defIdx = rivals.findIndex(r => r.owner.id === d.stableId);
          if (defIdx !== -1) {
            rivals[defIdx] = logAgentAction(rivals[defIdx], "STRATEGY", `Accepted bout: ${d.warrior.name} vs ${attackerPoolEntry.warrior.name} from ${attackerStable.owner.stableName}.`, "Low", state.week);
          }
        } else {
          const defIdx = rivals.findIndex(r => r.owner.id === d.stableId);
          if (defIdx !== -1) {
             rivals[defIdx] = logAgentAction(rivals[defIdx], "STRATEGY", `Declined bout for ${d.warrior.name}: ${decision.reason}`, "Low", state.week);
          }
        }
      }
    }
  }

  return boutPairs;
}

export function runAIvsAIBouts(state: GameState, seed?: number): { results: AIBoutResult[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rivals = [...(state.rivals || [])];
  const pool = collectEligibleAIWarriors(state, rivals);
  const mainSeed = seed ?? (state.week * 9973 + 88);
  const boutPairs = pairAIWarriors(pool, rivals, state, mainSeed + 1);

  const results: AIBoutResult[] = [];
  const gazetteItems: string[] = [];
  
  const updatedRivals = rivals.map(r => ({
    ...r,
    roster: r.roster.map(w => ({ ...w, career: { ...w.career } })),
  }));

  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory, 200);
  const rivalryMap = new Map<string, boolean>();
  for (const rv of (state.rivalries || [])) {
    rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), true);
  }

  for (const { a, d } of boutPairs) {
    const stableA = rivals[a.stableIdx];
    const stableD = rivals[d.stableIdx];

    const grudgeA = state.ownerGrudges?.find(g => 
      (g.ownerIdA === a.stableId && g.ownerIdB === d.stableId) || 
      (g.ownerIdB === a.stableId && g.ownerIdA === d.stableId)
    );
    const grudgeD = state.ownerGrudges?.find(g => 
      (g.ownerIdA === d.stableId && g.ownerIdB === a.stableId) || 
      (g.ownerIdB === d.stableId && g.ownerIdA === a.stableId)
    );

    const planA = a.warrior.plan ?? aiPlanForWarrior(
      a.warrior, 
      stableA.owner.personality || "Pragmatic", 
      stableA.philosophy || "Opportunist", 
      d.warrior.style,
      stableA.strategy?.intent,
      grudgeA?.intensity ?? 0
    );
    const planD = d.warrior.plan ?? aiPlanForWarrior(
      d.warrior, 
      stableD.owner.personality || "Pragmatic", 
      stableD.philosophy || "Opportunist", 
      a.warrior.style,
      stableD.strategy?.intent,
      grudgeD?.intensity ?? 0
    );

    const boutSeed = hashStr(`${state.week}|${a.warrior.id}|${d.warrior.id}`);
    const outcome = simulateFight(planA, planD, a.warrior, d.warrior, boutSeed, state.trainers, state.weather);
    const isKill = outcome.by === "Kill";
    const winnerSide = outcome.winner;
    const isRivalryBout = rivalryMap.has(getStablePairKey(a.stableId, d.stableId));

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
      gazetteItems.push(AIBoutService.generateRivalryNarrative(a.stableName, d.stableName, a.warrior.name, d.warrior.name, boutSeed + 42));
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
