import { FightingStyle, type Warrior, type GameState, type RivalStableData } from "@/types/game";
import { isTooInjuredToFight } from "./injuries";

const MATCHUP_MATRIX: Record<FightingStyle, Record<FightingStyle, number>> = {
  [FightingStyle.AimedBlow]: {
    [FightingStyle.AimedBlow]: 0, [FightingStyle.BashingAttack]: 1, [FightingStyle.LungingAttack]: 0, [FightingStyle.ParryLunge]: -1, [FightingStyle.ParryRiposte]: -2, [FightingStyle.ParryStrike]: -2, [FightingStyle.SlashingAttack]: 1, [FightingStyle.StrikingAttack]: 0, [FightingStyle.TotalParry]: -2, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.BashingAttack]: {
    [FightingStyle.AimedBlow]: -1, [FightingStyle.BashingAttack]: 0, [FightingStyle.LungingAttack]: 1, [FightingStyle.ParryLunge]: 0, [FightingStyle.ParryRiposte]: -1, [FightingStyle.ParryStrike]: -1, [FightingStyle.SlashingAttack]: 2, [FightingStyle.StrikingAttack]: 1, [FightingStyle.TotalParry]: -2, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.LungingAttack]: {
    [FightingStyle.AimedBlow]: 0, [FightingStyle.BashingAttack]: -1, [FightingStyle.LungingAttack]: 0, [FightingStyle.ParryLunge]: 1, [FightingStyle.ParryRiposte]: 0, [FightingStyle.ParryStrike]: -1, [FightingStyle.SlashingAttack]: 1, [FightingStyle.StrikingAttack]: 1, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.ParryLunge]: {
    [FightingStyle.AimedBlow]: 1, [FightingStyle.BashingAttack]: 0, [FightingStyle.LungingAttack]: -1, [FightingStyle.ParryLunge]: 0, [FightingStyle.ParryRiposte]: 1, [FightingStyle.ParryStrike]: 0, [FightingStyle.SlashingAttack]: 0, [FightingStyle.StrikingAttack]: -1, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.ParryRiposte]: {
    [FightingStyle.AimedBlow]: 2, [FightingStyle.BashingAttack]: 1, [FightingStyle.LungingAttack]: 0, [FightingStyle.ParryLunge]: -1, [FightingStyle.ParryRiposte]: 0, [FightingStyle.ParryStrike]: 1, [FightingStyle.SlashingAttack]: -1, [FightingStyle.StrikingAttack]: -2, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.ParryStrike]: {
    [FightingStyle.AimedBlow]: 2, [FightingStyle.BashingAttack]: 1, [FightingStyle.LungingAttack]: 1, [FightingStyle.ParryLunge]: 0, [FightingStyle.ParryRiposte]: -1, [FightingStyle.ParryStrike]: 0, [FightingStyle.SlashingAttack]: -1, [FightingStyle.StrikingAttack]: -2, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.SlashingAttack]: {
    [FightingStyle.AimedBlow]: -1, [FightingStyle.BashingAttack]: -2, [FightingStyle.LungingAttack]: -1, [FightingStyle.ParryLunge]: 0, [FightingStyle.ParryRiposte]: 1, [FightingStyle.ParryStrike]: 1, [FightingStyle.SlashingAttack]: 0, [FightingStyle.StrikingAttack]: 1, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.StrikingAttack]: {
    [FightingStyle.AimedBlow]: 0, [FightingStyle.BashingAttack]: -1, [FightingStyle.LungingAttack]: -1, [FightingStyle.ParryLunge]: 1, [FightingStyle.ParryRiposte]: 2, [FightingStyle.ParryStrike]: 2, [FightingStyle.SlashingAttack]: -1, [FightingStyle.StrikingAttack]: 0, [FightingStyle.TotalParry]: -1, [FightingStyle.WallOfSteel]: -2,
  },
  [FightingStyle.TotalParry]: {
    [FightingStyle.AimedBlow]: 2, [FightingStyle.BashingAttack]: 2, [FightingStyle.LungingAttack]: 1, [FightingStyle.ParryLunge]: 1, [FightingStyle.ParryRiposte]: 1, [FightingStyle.ParryStrike]: 1, [FightingStyle.SlashingAttack]: 1, [FightingStyle.StrikingAttack]: 1, [FightingStyle.TotalParry]: 0, [FightingStyle.WallOfSteel]: -1,
  },
  [FightingStyle.WallOfSteel]: {
    [FightingStyle.AimedBlow]: 2, [FightingStyle.BashingAttack]: 2, [FightingStyle.LungingAttack]: 2, [FightingStyle.ParryLunge]: 2, [FightingStyle.ParryRiposte]: 2, [FightingStyle.ParryStrike]: 2, [FightingStyle.SlashingAttack]: 2, [FightingStyle.StrikingAttack]: 2, [FightingStyle.TotalParry]: 1, [FightingStyle.WallOfSteel]: 0,
  }
};

export interface MatchupScore {
  playerWarriorId: string;
  rivalWarrior: Warrior;
  rivalStableName: string;
  score: number;
  styleAdvantage: number;
  fameDiff: number;
  notes: string[];
}

export function scoreMatchup(playerWarrior: Warrior, rivalWarrior: Warrior, state: GameState): number {
  const styleAdvantage = MATCHUP_MATRIX[playerWarrior.style]?.[rivalWarrior.style] ?? 0;
  const fameDiff = playerWarrior.fame - rivalWarrior.fame;

  let score = 100;
  score += styleAdvantage * 25;

  const absFameDiff = Math.abs(fameDiff);
  if (absFameDiff > 20) {
      score -= (absFameDiff - 20);
  } else if (fameDiff > 10) {
      score -= 5;
  } else if (fameDiff < -10) {
      score += 10;
  }

  const pWinRate = playerWarrior.career.wins / (Math.max(1, playerWarrior.career.wins + playerWarrior.career.losses));
  const rWinRate = rivalWarrior.career.wins / (Math.max(1, rivalWarrior.career.wins + rivalWarrior.career.losses));
  score += (pWinRate - rWinRate) * 20;


  // Rivalry multiplier for grudge matches
  const rivalries = state.rivalries || [];
  const playerStableId = playerWarrior.stableId || state.player?.id;
  const rivalStableId = rivalWarrior.stableId;

  if (playerStableId && rivalStableId) {
      const rivalry = rivalries.find(r =>
          (r.stableIdA === playerStableId && r.stableIdB === rivalStableId) ||
          (r.stableIdB === playerStableId && r.stableIdA === rivalStableId)
      );
      if (rivalry) {
          score += rivalry.intensity * 50; // Grudge match!
      }
  }

  return score;
}

function getEligibleRivals(state: GameState): { warrior: Warrior, stable: RivalStableData }[] {
    const rivals: { warrior: Warrior, stable: RivalStableData }[] = [];
    for (const stable of (state.rivals ?? [])) {
        for (const warrior of stable.roster) {
            if (warrior.status === "Active" && !isTooInjuredToFight(warrior.injuries as import("@/types/game").InjuryData[])) {
                rivals.push({ warrior, stable });
            }
        }
    }
    return rivals;
}

function getMatchupNotes(playerWarrior: Warrior, rivalWarrior: Warrior, styleAdvantage: number, fameDiff: number): string[] {
    const notes: string[] = [];
    if (styleAdvantage >= 2) notes.push("Hard counter! Excellent style advantage.");
    else if (styleAdvantage === 1) notes.push("Favorable style matchup.");
    else if (styleAdvantage === -1) notes.push("Unfavorable style matchup.");
    else if (styleAdvantage <= -2) notes.push("Severe style disadvantage! Hard counter against you.");

    if (fameDiff > 15) notes.push("Safe fight, but low fame reward.");
    else if (fameDiff < -15) notes.push("Dangerous fight, but high fame reward!");

    return notes;
}

export function getRecommendedChallenges(state: GameState, playerWarrior: Warrior, limit = 3): MatchupScore[] {
    const eligibleRivals = getEligibleRivals(state);
    const scores: MatchupScore[] = eligibleRivals.map(r => {
        const styleAdvantage = MATCHUP_MATRIX[playerWarrior.style]?.[r.warrior.style] ?? 0;
        const fameDiff = playerWarrior.fame - r.warrior.fame;
        return {
            playerWarriorId: playerWarrior.id,
            rivalWarrior: r.warrior,
            rivalStableName: r.stable.owner.stableName,
            score: scoreMatchup(playerWarrior, r.warrior, state),
            styleAdvantage,
            fameDiff,
            notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff)
        };
    });
    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getMatchupsToAvoid(state: GameState, playerWarrior: Warrior, limit = 3): MatchupScore[] {
    const eligibleRivals = getEligibleRivals(state);
    const scores: MatchupScore[] = eligibleRivals.map(r => {
        const styleAdvantage = MATCHUP_MATRIX[playerWarrior.style]?.[r.warrior.style] ?? 0;
        const fameDiff = playerWarrior.fame - r.warrior.fame;
        return {
            playerWarriorId: playerWarrior.id,
            rivalWarrior: r.warrior,
            rivalStableName: r.stable.owner.stableName,
            score: scoreMatchup(playerWarrior, r.warrior, state),
            styleAdvantage,
            fameDiff,
            notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff)
        };
    });
    return scores.sort((a, b) => a.score - b.score).slice(0, limit);
}
