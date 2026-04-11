import { GameState, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { updateAIStrategy } from "@/engine/ai/intentEngine";
import { processAIStable } from "@/engine/ai/stableManager";
import { generateRivalStables } from "@/engine/rivals";
import { aiDraftFromPool } from "@/engine/draftService";
import { processAIRosterManagement } from "@/engine/ownerRoster";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";
import { processAllRivalsBoutOffers } from "@/engine/ai/workers/competitionWorker";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
export const PASS_METADATA = {
  name: "RivalStrategyPass",
  dependencies: ["WorldPass"] // Depends on world transitions
};

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
export function runRivalStrategyPass(state: GameState, nextWeek: number, rootRng?: IRNGService): GameState {
  const rng = rootRng || new SeededRNGService(nextWeek * 7919 + 13);
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
  const rosterRng = new SeededRNGService(rosterSeed);
  const { updatedRivals: finalizedRivals, gazetteItems: rosterGazette } = processAIRosterManagement({
    ...currentState,
    week: nextWeek
  }, rosterRng);
  globalGazetteItems.push(...rosterGazette);
  currentState.rivals = finalizedRivals;

  // 4. Contract Decision Phase: AI Stables accept/decline pending boutique offers
  currentState = processAllRivalsBoutOffers(currentState, finalizedRivals);
  
  // 5. Tournament Handling (Every 13 weeks)
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    currentState = handleSeasonalTournaments(currentState, nextWeek, rng);
  }

  if (globalGazetteItems.length > 0) {
    currentState = {
      ...currentState,
      newsletter: [...(currentState.newsletter || []), { 
        id: rng.uuid(),
        week: nextWeek, 
        title: "Intelligence & Strategy Report", 
        items: globalGazetteItems 
      }]
    };
  }

  return currentState;
}

function handleSeasonalTournaments(state: GameState, week: number, rng: IRNGService): StateImpact {
  const tournaments = TournamentSelectionService.generateSeasonalTiers(state, week, state.season, week * 881);
  const tournamentNews: string[] = [];
  const allTours: any[] = [];
  let finalState = { ...state };

  tournaments.forEach((tour) => {
    finalState.tournaments = [...(finalState.tournaments || []), tour];
    finalState = TournamentSelectionService.resolveCompleteTournament(finalState, tour.id, week * 500 + hashStr(tour.id));
    const completedTour = finalState.tournaments.find(t => t.id === tour.id);
    allTours.push(completedTour);
    tournamentNews.push(`🏆 ${tour.name} finalized: ${completedTour?.champion || "Undisputed"} crowned champion.`);
  });
  
  return {
    tournaments: allTours,
    isTournamentWeek: true,
    activeTournamentId: allTours[0].id,
    day: 0,
    newsletterItems: [{
      id: rng.uuid(),
      week: week, 
      title: "🎖️ TOURNAMENT ARCHIVE", 
      items: tournamentNews 
    }]
  };
}

function hashStr(s: string): number {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
