import { 
  GameState, RivalStableData, type Warrior 
} from "@/types/game";
import { simulateFight } from "../simulate";
import { aiPlanForWarrior } from "../ownerAI";
import { computeMetaDrift } from "../metaDrift";
import { pickRivalOpponent } from "../rivals";
import { AIBoutService } from "../matchmakingServices";
import { getStablePairKey } from "@/utils/keyUtils";
import { isEligible } from "./bracketEngine";

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
      stableA.owner.personality || "Pragmatic", 
      stableA.philosophy || "Opportunist", 
      d.warrior.style,
      stableA.strategy?.intent
    );
    const planD = d.warrior.plan ?? aiPlanForWarrior(
      d.warrior, 
      stableD.owner.personality || "Pragmatic", 
      stableD.philosophy || "Opportunist", 
      a.warrior.style,
      stableD.strategy?.intent
    );

    const outcome = simulateFight(planA, planD, a.warrior, d.warrior, undefined, state.trainers);
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
