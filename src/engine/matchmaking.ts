/**
 * Matchmaking Engine — cross-stable pairing, AI vs AI bouts, rivalry detection.
 * Implements Stable_Lords_Matchmaking_and_Scheduling_Spec_v1.0
 */
import type {
  GameState, Warrior, RivalStableData, FightSummary,
  RestState, Rivalry, MatchRecord,
} from "@/types/game";
import { isTooInjuredToFight, type Injury } from "./injuries";
import { simulateFight } from "./simulate";
import { aiPlanForWarrior } from "./ownerAI";
import { computeMetaDrift } from "./metaDrift";
import { pickRivalOpponent } from "./rivals";

/** Stablemates cannot fight each other */
function disallowStablemates(aStableId: string, dStableId: string): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
}

// ─── Eligibility ──────────────────────────────────────────────────────────

function isEligible(w: Warrior, week: number, restStates: RestState[], trainingIds: Set<string>): boolean {
  if (w.status !== "Active") return false;
  const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
  if (isTooInjuredToFight(injObjs)) return false;
  if (restStates.some(r => r.warriorId === w.id && r.restUntilWeek > week)) return false;
  if (trainingIds.has(w.id)) return false;
  return true;
}

// ─── Scoring ──────────────────────────────────────────────────────────────

function pairingScore(
  p: Warrior, r: Warrior, rivalStableId: string,
  rivalries: Rivalry[], matchHistory: MatchRecord[],
  playerStableId: string, week: number, rng: () => number,
  recentHistory: FightSummary[]
): number {
  let score = 100;

  // Fame proximity bonus (0-30)
  score += Math.max(0, 30 - Math.abs(p.fame - r.fame) * 3);

  // Rivalry bonus
  const hasRivalry = rivalries.some(rv =>
    (rv.stableIdA === playerStableId && rv.stableIdB === rivalStableId) ||
    (rv.stableIdB === playerStableId && rv.stableIdA === rivalStableId)
  );
  if (hasRivalry) {
    const rivalry = rivalries.find(rv =>
      (rv.stableIdA === playerStableId && rv.stableIdB === rivalStableId) ||
      (rv.stableIdB === playerStableId && rv.stableIdA === rivalStableId)
    );

    // Give intense rivalries / blood feuds (intensity >= 4) a massive booking score boost
    score += (rivalry && rivalry.intensity >= 4) ? 200 : 50;
  }

  // Style diversity bonus — +20 if this style matchup hasn't occurred in last 4 weeks
  const recentStylePairs = recentHistory
    .filter(f => f.week >= week - 4)
    .map(f => `${f.styleA}|${f.styleD}`);
  const thisPair = `${p.style}|${r.style}`;
  const reversePair = `${r.style}|${p.style}`;
  if (!recentStylePairs.includes(thisPair) && !recentStylePairs.includes(reversePair)) {
    score += 20;
  }

  // Repeat penalty — -100 if fought in last 2 weeks
  const recentMatch = matchHistory.some(m =>
    m.playerWarriorId === p.id && m.opponentWarriorId === r.id && m.week >= week - 2
  );
  if (recentMatch) score -= 100;

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
  const rivalries = state.rivalries || [];
  const matchHistory = state.matchHistory || [];

  const playerPool = state.roster.filter(w => isEligible(w, state.week, restStates, trainingIds));
  
  // Collect all eligible rival warriors
  const rivalPool: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const rival of (state.rivals || [])) {
    for (const w of rival.roster) {
      if (isEligible(w, state.week, restStates, trainingIds)) {
        rivalPool.push({ warrior: w, stable: rival });
      }
    }
  }

  if (playerPool.length === 0 || rivalPool.length === 0) return [];

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
        rivalries, matchHistory, state.player.id, state.week, rng,
        state.arenaHistory
      );
      if (s > bestScore) { bestScore = s; bestCandidate = rc; }
    }

    if (bestCandidate) {
      const isRivalryBout = rivalries.some(rv =>
        (rv.stableIdA === state.player.id && rv.stableIdB === bestCandidate!.stable.owner.id) ||
        (rv.stableIdB === state.player.id && rv.stableIdA === bestCandidate!.stable.owner.id)
      );
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
  const trainingIds = new Set<string>();

  // Collect eligible rival warriors with stable info
  const pool: { warrior: Warrior; stableIdx: number; stableId: string; stableName: string }[] = [];
  const rivals = [...(state.rivals || [])];
  
  for (let si = 0; si < rivals.length; si++) {
    for (const w of rivals[si].roster) {
      if (isEligible(w, state.week, restStates, trainingIds)) {
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
    const isRivalryBout = rivalries.some(rv =>
      (rv.stableIdA === a.stableId && rv.stableIdB === d.stableId) ||
      (rv.stableIdB === a.stableId && rv.stableIdA === d.stableId)
    );

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

// ─── Rivalry Detection ────────────────────────────────────────────────────

export function detectRivalries(
  existingRivalries: Rivalry[],
  killerStableId: string,
  victimStableId: string,
  killerName: string,
  victimName: string,
  week: number
): Rivalry[] {
  const rivalries = [...existingRivalries];
  const existing = rivalries.find(r =>
    (r.stableIdA === killerStableId && r.stableIdB === victimStableId) ||
    (r.stableIdB === killerStableId && r.stableIdA === victimStableId)
  );

  if (existing) {
    existing.intensity = Math.min(5, existing.intensity + 2);
    existing.reason = `${killerName} killed ${victimName} in Week ${week}`;
  } else {
    rivalries.push({
      stableIdA: killerStableId,
      stableIdB: victimStableId,
      intensity: 3,
      reason: `${killerName} killed ${victimName} in Week ${week}`,
      startWeek: week,
    });
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
