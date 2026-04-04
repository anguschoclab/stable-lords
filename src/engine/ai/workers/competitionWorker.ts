import { type RivalStableData, type Warrior, type WeatherType } from "@/types/state.types";
import { type CrowdMood } from "../../crowdMood";
import { FightingStyle } from "@/types/shared.types";
import { logAgentAction } from "../agentCore";

/**
 * CompetitionWorker: Handles boutique reasoning, tournament entry, and matchmaking bids.
 * Implements "Skeptical Matchmaking" and "Targeted Competition".
 */

export interface BoutBid {
  proposingWarriorId: string;
  targetStableId?: string; // Specific ID for VENDETTA
  targetWarriorId?: string;
  minFame?: number;
  maxFame?: number;
  priority: number; // 1-10
  description?: string;
}

export function generateBoutBids(
  rival: RivalStableData,
  currentWeek: number,
  weather: WeatherType = "Clear",
  crowdMood: CrowdMood = "Calm"
): { bids: BoutBid[]; updatedRival: RivalStableData } {
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  const activeRoster = rival.roster.filter(w => w.status === "Active");
  const bids: BoutBid[] = [];

  for (const warrior of activeRoster) {
    // ⚡ TSA: Weather Predation & Caution
    let weatherModifier = 0;
    if (weather === "Rainy") {
      if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -3; // Precision styles hate rain
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2; // Mudders love the rain
    } else if (weather === "Scalding" && warrior.attributes.CN < 10) {
      weatherModifier = -2; // Low constitution warriors hate heat
    }

    // ⚡ TSA: Crowd Pandering
    let moodModifier = 0;
    const personality = rival.owner.personality ?? "Pragmatic";
    if (crowdMood === "Bloodthirsty" && personality === "Aggressive") moodModifier = +3;
    if (crowdMood === "Theatrical" && personality === "Showman") moodModifier = +3;

    if (intent === "VENDETTA" && rival.strategy?.targetStableId) {
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: rival.strategy.targetStableId,
        priority: Math.max(1, 10 + weatherModifier + moodModifier),
        description: `Vendetta target. ${weatherModifier < 0 ? "(Weather caution)" : weatherModifier > 0 ? "(Weather advantage)" : ""}`
      });
    } else if (intent === "RECOVERY") {
      if (weatherModifier < -2) continue; // Skip recovery bouts in bad weather
      bids.push({
        proposingWarriorId: warrior.id,
        maxFame: 50,
        priority: Math.max(1, 5 + moodModifier),
        description: "Seeking low-risk recovery bout."
      });
    } else if (intent === "EXPANSION") {
      bids.push({
        proposingWarriorId: warrior.id,
        minFame: 100,
        priority: Math.max(1, 7 + weatherModifier + moodModifier),
        description: "Seeking high-visibility expansion bout."
      });
    } else {
      // CONSOLIDATION
      bids.push({
        proposingWarriorId: warrior.id,
        priority: Math.max(1, 4 + weatherModifier + moodModifier),
        description: "Standard training bout."
      });
    }
  }

  return { bids, updatedRival: rival };
}

/**
 * verifyBoutAcceptance: A "Skeptical" check when another agent proposes a fight.
 */
export function verifyBoutAcceptance(
  rival: RivalStableData,
  warrior: Warrior,
  opponent: Warrior,
  opponentStable: RivalStableData,
  weather: WeatherType = "Clear"
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  
  // ⚡ Weather Skepticism
  if (weather === "Rainy" && warrior.style === "LungingAttack") {
    return { accepted: false, reason: "Precision penalty in rain." };
  }

  if (weather === "Scalding" && warrior.attributes.CN < 15) {
     return { accepted: false, reason: "Heatstroke risk too high." };
  }

  // Skeptical Check: RECOVERY agents refuse fights with "Killers"
  if (intent === "RECOVERY") {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return { accepted: false, reason: "Too risky for recovery phase." };
    }
  }

  // Skeptical Check: AGGRESSIVE agents accept most things (unless weather is lethal)
  if (rival.owner.personality === "Aggressive") {
    if (weather === "Scalding" && warrior.attributes.CN < 8) {
      return { accepted: false, reason: "Aggressive but not suicidal; heat is too dangerous for this unit." };
    }
    return { accepted: true };
  }

  // Default: Accept unless it's a massive fame gap
  if ((opponent.fame || 0) > (warrior.fame || 0) + 300) {
    return { accepted: false, reason: "Opponent outclasses us significantly." };
  }

  return { accepted: true };
}
