import { type GameState, type Warrior, type RivalStableData, type BoutOffer, type WeatherType } from "@/types/state.types";
import { type CrowdMood } from "../../crowdMood";
import { FightingStyle } from "@/types/shared.types";
import { respondToBoutOffer } from "@/engine/bout/mutations/contractMutations";
import { StateImpact, mergeImpacts } from "@/engine/impacts";
import { scoreMatchup } from "@/engine/schedulingAssistant";

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

  // Build a mock state for matchup scoring
  const mockState: GameState = {
    meta: { gameName: "", version: "", createdAt: "" },
    ftueComplete: true,
    ftueStep: undefined,
    coachDismissed: [],
    player: rival.owner,
    fame: rival.owner.fame,
    popularity: rival.owner.renown,
    treasury: rival.treasury,
    ledger: [],
    week: currentWeek,
    year: 1,
    phase: "planning",
    season: "Spring",
    weather,
    roster: activeRoster,
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    rivals: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood,
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    unacknowledgedDeaths: [],
    settings: { featureFlags: { tournaments: true, scouting: true } },
    isFTUE: false,
    day: 1,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    activeTournamentId: undefined,
    realmRankings: {},
    awards: []
  };

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

    // ⚡ Scheduling Assistant: Matchup scoring
    let matchupModifier = 0;
    if (intent !== "VENDETTA") {
      // Score against potential opponents (other rivals)
      for (const otherRival of mockState.rivals) {
        for (const opponent of otherRival.roster) {
          if (opponent.status === "Active") {
            const matchupScore = scoreMatchup(warrior, opponent, mockState);
            // Convert score (100-200 range) to modifier (-5 to +5)
            matchupModifier = Math.max(-5, Math.min(5, (matchupScore - 100) / 20));
            break; // Use first available opponent for scoring
          }
        }
      }
    }

    if (intent === "VENDETTA" && rival.strategy?.targetStableId) {
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: rival.strategy.targetStableId,
        priority: Math.max(1, 10 + weatherModifier + moodModifier + matchupModifier),
        description: `Vendetta target. ${weatherModifier < 0 ? "(Weather caution)" : weatherModifier > 0 ? "(Weather advantage)" : ""} ${matchupModifier > 0 ? "(Favorable matchup)" : matchupModifier < 0 ? "(Unfavorable matchup)" : ""}`
      });
    } else if (intent === "RECOVERY") {
      if (weatherModifier < -2) continue; // Skip recovery bouts in bad weather
      bids.push({
        proposingWarriorId: warrior.id,
        maxFame: 50,
        priority: Math.max(1, 5 + moodModifier + matchupModifier),
        description: "Seeking low-risk recovery bout."
      });
    } else if (intent === "EXPANSION") {
      bids.push({
        proposingWarriorId: warrior.id,
        minFame: 100,
        priority: Math.max(1, 7 + weatherModifier + moodModifier + matchupModifier),
        description: "Seeking high-visibility expansion bout."
      });
    } else {
      // CONSOLIDATION
      bids.push({
        proposingWarriorId: warrior.id,
        priority: Math.max(1, 4 + weatherModifier + moodModifier + matchupModifier),
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
  weather: WeatherType = "Clear"
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  
  // ⚡ Weather Skepticism
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === "Rainy" && isLunger) {
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
/**
 * Validates whether a rival stable should accept a bout offer.
 * Incorporates strategy (EXPANSION/CONSOLIDATION) and warrior health.
 */
export function evaluateBoutOffer(
  state: GameState,
  offer: BoutOffer,
  rival: RivalStableData,
  warrior: Warrior
): "Accepted" | "Declined" {
  // 1. Health Guard: Protective owners decline if HP < 80%
  const currentHP = warrior.derivedStats?.hp ?? 100;
  if (currentHP < 80 && rival.owner.personality !== "Aggressive") {
    return "Declined";
  }

  // 2. Personality Logic
  const personality = rival.owner.personality;
  const hype = offer.hype;
  const purse = offer.purse;

  if (personality === "Aggressive" && (hype > 120 || purse > 500)) return "Accepted";
  if (personality === "Methodical" && currentHP < 95) return "Declined";
  if (personality === "Showman" && hype > 130) return "Accepted";
  if (personality === "Pragmatic" && purse > 400) return "Accepted";

  // Default: Accept if reasonable
  return "Accepted";
}

/**
 * AI Decision Engine — processes all pending offers for ALL rival stables in one O(N) pass.
 */
export function processAllRivalsBoutOffers(state: GameState, rivals: RivalStableData[]): StateImpact {
  const impacts: StateImpact[] = [];
  const pendingOffers = Object.values(state.boutOffers).filter(o => o.status === "Proposed");

  pendingOffers.forEach(offer => {
    offer.warriorIds.forEach(wId => {
      // Find which rival owns this warrior
      const owningRival = rivals.find(r => r.roster.some(w => w.id === wId));
      if (!owningRival) return;

      const rivalWarrior = owningRival.roster.find(w => w.id === wId);
      if (rivalWarrior && offer.responses[wId] === "Pending") {
        const response = evaluateBoutOffer(state, offer, owningRival, rivalWarrior);
        const impact = respondToBoutOffer(state, offer.id, rivalWarrior.id, response);
        impacts.push(impact);
      }
    });
  });

  return mergeImpacts(impacts);
}
