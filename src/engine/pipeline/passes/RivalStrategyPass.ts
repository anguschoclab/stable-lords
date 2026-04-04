import { GameState, RivalStableData } from "@/types/game";
import { seededRng } from "@/engine/rivals";
import { updateAIStrategy } from "@/engine/ai/intentEngine";
import { processAIStable } from "@/engine/ai/stableManager";
import { generateRivalStables } from "@/engine/rivals";
import { aiDraftFromPool } from "@/engine/draftService";
import { processAIRosterManagement } from "@/engine/ownerRoster";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";
import { runAIvsAIBouts } from "@/engine/matchmaking/rivalScheduler";

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */

export function runRivalStrategyPass(state: GameState, nextWeek: number): GameState {
  const rng = seededRng(nextWeek * 7919 + 13);
  const currentRivals = [...(state.rivals || [])];
  const globalGazetteItems: string[] = [];

  let currentPool = [...(state.hiringPool || [])];

  // 1. Process Individual Rival Stables (Economy/Strategy)
  const processedRivals = currentRivals.map((rival, index) => {
    const strategySeed = nextWeek * 31 + index * 997 + rival.owner.id.length;
    const strategy = updateAIStrategy(rival, state, strategySeed);
    const rivalWithStrategy = { ...rival, strategy };
    const { updatedRival, isBankrupt, gazetteItems, updatedHiringPool } = processAIStable(rivalWithStrategy, state);
    globalGazetteItems.push(...gazetteItems);
    currentPool = updatedHiringPool;

    if (isBankrupt) {
      const replacementSeed = nextWeek + index * 1000;
      const [newStable] = generateRivalStables(1, replacementSeed);
      globalGazetteItems.push(`🆕 EXPANSION: ${newStable.owner.stableName} has moved into the district as a new rival!`);
      return newStable as any as RivalStableData;
    }
    return updatedRival;
  });

  // 2. Draft from Recruitment Pool
  const draft = aiDraftFromPool(state.recruitPool, processedRivals, nextWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);

  // 3. AI Roster Management (Recruitment/Retirement)
  const rosterSeed = nextWeek * 13 + 7;
  const { updatedRivals: finalizedRivals, gazetteItems: rosterGazette } = processAIRosterManagement({
    ...state,
    rivals: draft.updatedRivals,
    recruitPool: draft.updatedPool,
    week: nextWeek
  }, rosterSeed);
  globalGazetteItems.push(...rosterGazette);

  let newState = { 
    ...state, 
    rivals: finalizedRivals, 
    recruitPool: draft.updatedPool, 
    hiringPool: currentPool 
  };
  
  // 4. Tournament Handling
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    newState = handleSeasonalTournaments(newState, nextWeek);
    return newState;
  }

  // 5. Background Rival Simulation (Rival-vs-Rival)
  const rivalSeed = nextWeek * 7919 + 777;
  const aiResults = runAIvsAIBouts(newState, rivalSeed);
  newState.rivals = aiResults.updatedRivals;
  globalGazetteItems.push(...aiResults.gazetteItems);

  if (globalGazetteItems.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { week: nextWeek, title: "Intelligence Report", items: globalGazetteItems }];
  }

  return newState;
}

function handleSeasonalTournaments(state: GameState, week: number): GameState {
  let newState = { ...state };
  const tiers = ["Minor", "Established", "Major", "Legendary"];
  const tournamentBouts: string[] = [];
  
  tiers.forEach((tier, tIdx) => {
    const tour = TournamentSelectionService.generateTournament(state, tier, week, state.season, week * 100 + tIdx);
    newState.tournaments = [...(newState.tournaments || []), tour];
    newState = TournamentSelectionService.resolveCompleteTournament(newState, tour.id, week * 500 + tIdx);
    
    const completedTour = newState.tournaments.find(t => t.id === tour.id);
    tournamentBouts.push(`${tour.name} concluded. Champion: ${completedTour?.champion || "None"}`);
  });
  
  newState.newsletter = [...(newState.newsletter || []), { 
    week: week, 
    title: "🏆 GRAND CHAMPIONSHIP SEASON", 
    items: tournamentBouts 
  }];
  
  return newState;
}
