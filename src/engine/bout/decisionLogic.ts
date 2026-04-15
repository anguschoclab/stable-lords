import type { FightOutcome } from "@/types/combat.types";
import { type FighterState } from "../combat/resolution";

type JudgeArchetype = "Crowd" | "Technical" | "Blood";

/**
 * Score a fight from one judge's perspective.
 * Returns the fighter label that the judge favors, or null for a tie.
 */
function judgeScore(
  archetype: JudgeArchetype,
  fA: FighterState,
  fD: FighterState
): "A" | "D" | null {
  let scoreA = 0;
  let scoreD = 0;

  switch (archetype) {
    case "Crowd":
      // Crowd loves aggression and flashy counters
      scoreA = fA.hitsLanded * 1.5 + fA.ripostes * 0.5;
      scoreD = fD.hitsLanded * 1.5 + fD.ripostes * 0.5;
      break;
    case "Technical":
      // Technical judges reward ripostes and penalize taking hits
      scoreA = fA.ripostes * 2 - fA.hitsTaken * 0.5;
      scoreD = fD.ripostes * 2 - fD.hitsTaken * 0.5;
      break;
    case "Blood":
      // Blood judges score by damage dealt (HP stripped from opponent)
      scoreA = fD.maxHp - fD.hp;
      scoreD = fA.maxHp - fA.hp;
      break;
  }

  if (scoreA > scoreD + 0.5) return "A";
  if (scoreD > scoreA + 0.5) return "D";
  return null;
}

function decisionNarrative(winner: "A" | "D", loser: "A" | "D", winName: string, loseName: string, fW: FighterState, fL: FighterState, voteType: "unanimous" | "split" | "overtime", dissenter?: string): string {
  const hitMargin = fW.hitsLanded - fL.hitsLanded;
  const domination = hitMargin >= 5;
  const close = hitMargin <= 2;
  const dmgDealt = fL.maxHp - fL.hp;
  const dmgTaken = fW.maxHp - fW.hp;

  const prefix = "Time! ";
  let result: string;

  if (voteType === "overtime") {
    return `${prefix}After a grinding overtime exchange, ${winName} edges out the win by the slimmest of margins.`;
  }

  if (domination) {
    const verb = voteType === "unanimous" ? "dominates" : "dominates";
    result = `${winName} ${verb} on points — landing ${hitMargin} more strikes than ${loseName}. All three judges are in agreement.`;
    if (voteType === "split") {
      result = `${winName} dominates on points, landing ${hitMargin} more strikes. The ${dissenter} judge dissented, but the scorecards tell the story.`;
    }
  } else if (close) {
    if (voteType === "unanimous") {
      result = `${winName} takes a narrow unanimous decision. The margin was razor-thin — ${dmgDealt} damage dealt to ${dmgTaken} taken.`;
    } else {
      result = `${winName} scrapes out a split decision. The ${dissenter} judge saw it for ${loseName}, but the majority sided with ${winName}.`;
    }
  } else {
    if (voteType === "unanimous") {
      result = `${winName} wins a clear unanimous decision on points, outworking ${loseName} over the distance.`;
    } else {
      result = `${winName} wins a split decision on points. The ${dissenter} judge sided with ${loseName}, but ${winName} controlled enough of the fight.`;
    }
  }

  return prefix + result;
}

/**
 * Resolves a fight that reached the time limit.
 * Three judges with different archetypes score the bout.
 * Close (1-1-1 with ties) triggers an overtime exchange via rng.
 */
export function resolveDecision(
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string,
  rng?: () => number
): { winner: "A" | "D" | null; by: FightOutcome["by"]; narrative: string } {
  const archetypes: JudgeArchetype[] = ["Crowd", "Technical", "Blood"];
  const votes = archetypes.map(a => judgeScore(a, fA, fD));

  const aVotes = votes.filter(v => v === "A").length;
  const dVotes = votes.filter(v => v === "D").length;

  // ── Unanimous ──
  if (aVotes === 3) {
    return { winner: "A", by: "Stoppage", narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "unanimous") };
  }
  if (dVotes === 3) {
    return { winner: "D", by: "Stoppage", narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "unanimous") };
  }

  // ── Split 2-1 ──
  if (aVotes === 2) {
    const dissentIdx = votes.indexOf("D") >= 0 ? votes.indexOf("D") : votes.indexOf(null);
    const dissenter = dissentIdx >= 0 ? archetypes[dissentIdx] : "Blood";
    return { winner: "A", by: "Stoppage", narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "split", dissenter) };
  }
  if (dVotes === 2) {
    const dissentIdx = votes.indexOf("A") >= 0 ? votes.indexOf("A") : votes.indexOf(null);
    const dissenter = dissentIdx >= 0 ? archetypes[dissentIdx] : "Blood";
    return { winner: "D", by: "Stoppage", narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "split", dissenter) };
  }

  // ── Contested / overtime ──
  if (rng) {
    const hpA = fA.hp / fA.maxHp;
    const hpD = fD.hp / fD.maxHp;
    const total = hpA + hpD;
    if (total > 0) {
      if (rng() < hpA / total) {
        return { winner: "A", by: "Stoppage", narrative: decisionNarrative("A", "D", nameA, nameD, fA, fD, "overtime") };
      } else {
        return { winner: "D", by: "Stoppage", narrative: decisionNarrative("D", "A", nameD, nameA, fD, fA, "overtime") };
      }
    }
  }

  // Pure draw fallback
  if (aVotes === 1 && dVotes === 1) {
    return { winner: null, by: "Draw", narrative: `Time! The judges are divided. The Arenamaster rules a draw.` };
  }

  // Tiebreaker by raw HP remaining
  if (fA.hp > fD.hp) {
    return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} wins on the narrowest of margins — bleeding less than their opponent.` };
  }
  if (fD.hp > fA.hp) {
    return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} wins on the narrowest of margins — bleeding less than their opponent.` };
  }
  return { winner: null, by: "Draw", narrative: `Time! The Arenamaster declares a draw.` };
}
