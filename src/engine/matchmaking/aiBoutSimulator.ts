import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { simulateFight } from "../simulate";
import { aiPlanForWarrior } from "../ownerAI";
import { computeMetaDrift } from "../metaDrift";
import { AIBoutService } from "../matchmakingServices";
import { getStablePairKey } from "@/utils/keyUtils";
import { AIPoolWarrior } from "./aiPoolCollector";
import { SeededRNGService } from "@/engine/core/rng";

export interface AIBoutResult {
  stableA: string;
  stableB: string;
  warriorA: string;
  warriorD: string;
  winner: "A" | "D" | null;
  by: string | null;
  kill: boolean;
}

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
 * Simulates AI vs AI bouts for all paired warriors.
 * Handles fight simulation, record updates, death handling, and gazette generation.
 */
export function simulateAIBouts(
  state: GameState,
  boutPairs: { a: AIPoolWarrior; d: AIPoolWarrior }[],
  rivals: RivalStableData[],
  seed?: number
): { results: AIBoutResult[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const results: AIBoutResult[] = [];
  const gazetteItems: string[] = [];
  const rng = new SeededRNGService(seed ?? (state.week * 7919));
  
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
      gazetteItems.push(AIBoutService.generateRivalryNarrative(a.stableName, d.stableName, a.warrior.name, d.warrior.name, rng));
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
