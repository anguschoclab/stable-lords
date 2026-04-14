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
  const tieVotes = votes.filter(v => v === null).length;

  // ── Unanimous ──
  if (aVotes === 3) {
    return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} wins a unanimous decision. All three judges saw it clearly.` };
  }
  if (dVotes === 3) {
    return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} wins a unanimous decision. All three judges saw it clearly.` };
  }

  // ── Split 2-1 ──
  if (aVotes === 2) {
    const minority = archetypes[votes.indexOf("D")];
    return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} wins a split decision — the ${minority} judge dissented.` };
  }
  if (dVotes === 2) {
    const minority = archetypes[votes.indexOf("A")];
    return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} wins a split decision — the ${minority} judge dissented.` };
  }

  // ── Contested / overtime ──
  // 1-1-1 with ties or all tied — one exchange overtime coin flip (weighted by HP)
  if (rng) {
    const hpA = fA.hp / fA.maxHp;
    const hpD = fD.hp / fD.maxHp;
    const total = hpA + hpD;
    if (total > 0) {
      const roll = rng();
      if (roll < hpA / total) {
        return { winner: "A", by: "Stoppage", narrative: `Time! After a grueling overtime exchange, ${nameA} edges out the win.` };
      } else {
        return { winner: "D", by: "Stoppage", narrative: `Time! After a grueling overtime exchange, ${nameD} edges out the win.` };
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
