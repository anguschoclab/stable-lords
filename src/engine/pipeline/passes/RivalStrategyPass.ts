import { GameState, RivalStableData } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { updateAIStrategy } from "@/engine/ai/intentEngine";
import { processAIStable } from "@/engine/ai/stableManager";
import { generateRivalStables } from "@/engine/rivals";
import { aiDraftFromPool } from "@/engine/draftService";
import { processAIRosterManagement } from "@/engine/ownerRoster";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";
import { processRivalBoutOffers } from "@/engine/ai/workers/competitionWorker";

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */

export function runRivalStrategyPass(state: GameState, nextWeek: number, rootRng?: SeededRNG): GameState {
  const rng = rootRng?.clone() ?? new SeededRNG(nextWeek * 7919 + 13);
  let currentState = state;
  const globalGazetteItems: string[] = [];

  // 1. Process Individual Rival Stables (Economy/Strategy)
  const processedRivals = (state.rivals || []).map((rival, index) => {
    const strategySeed = nextWeek * 31 + index * 997 + rival.owner.id.length;
    const strategy = updateAIStrategy(rival, currentState, strategySeed);
    const rivalWithStrategy = { ...rival, strategy };
    const { updatedRival, isBankrupt, gazetteItems } = processAIStable(rivalWithStrategy, currentState);
    globalGazetteItems.push(...gazetteItems);

    if (isBankrupt) {
      const retirementSeed = nextWeek + index * 1000;
      const [newStable] = generateRivalStables(1, retirementSeed);
      globalGazetteItems.push(`🆕 RECRUITMENT: ${newStable.owner.stableName} has debuted in the league under ${newStable.owner.name}!`);
      return newStable as RivalStableData;
    }
    return updatedRival;
  });

  currentState.rivals = processedRivals;

  // 2. Draft from Recruitment Pool
  const draft = aiDraftFromPool(state.recruitPool, currentState.rivals, nextWeek, currentState);
  globalGazetteItems.push(...draft.gazetteItems);
  currentState.rivals = draft.updatedRivals;
  currentState.recruitPool = draft.updatedPool;

  // 3. AI Roster Management (Recruitment/Retirement)
  const rosterSeed = nextWeek * 13 + 7;
  const { updatedRivals: finalizedRivals, gazetteItems: rosterGazette } = processAIRosterManagement({
    ...currentState,
    week: nextWeek
  }, rosterSeed);
  globalGazetteItems.push(...rosterGazette);
  currentState.rivals = finalizedRivals;

  // 4. Contract Decision Phase: AI Stables accept/decline pending boutique offers
  finalizedRivals.forEach(rival => {
    currentState = processRivalBoutOffers(currentState, rival);
  });
  
  // 5. Tournament Handling (Every 13 weeks)
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    currentState = handleSeasonalTournaments(currentState, nextWeek, rng);
  }

  if (globalGazetteItems.length > 0) {
    currentState.newsletter = [...(currentState.newsletter || []), { 
      week: nextWeek, 
      title: "Intelligence & Strategy Report", 
      items: globalGazetteItems 
    }];
  }

  return currentState;
}

function handleSeasonalTournaments(state: GameState, week: number, rng: SeededRNG): GameState {
  let newState = { ...state };
  
  // 🏆 4-Tier Selection Committee Logic: Generates and resolves all tiers
  const tournaments = TournamentSelectionService.generateSeasonalTiers(newState, week, state.season, week * 881);
  const tournamentNews: string[] = [];

  tournaments.forEach((tour) => {
    // 1. Add to state
    newState.tournaments = [...(newState.tournaments || []), tour];
    
    // 2. Resolve the entire tournament deterministically
    newState = TournamentSelectionService.resolveCompleteTournament(newState, tour.id, week * 500 + hashStr(tour.id));
    
    const completedTour = newState.tournaments.find(t => t.id === tour.id);
    tournamentNews.push(`🏆 ${tour.name} finalized: ${completedTour?.champion || "Undisputed"} crowned champion.`);
  });
  
  newState.newsletter = [...(newState.newsletter || []), { 
    week: week, 
    title: "🎖️ TOURNAMENT ARCHIVE", 
    items: tournamentNews 
  }];
  
  return newState;
}

function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
