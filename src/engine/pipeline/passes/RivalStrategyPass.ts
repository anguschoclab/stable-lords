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
import { StateImpact, mergeImpacts } from "@/engine/impacts";
import { hashStr } from "@/utils/random";
/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
/**
 * Stable Lords — Rival Strategy Pipeline Pass
 */
export function runRivalStrategyPass(state: GameState, nextWeek: number, rootRng?: IRNGService): StateImpact {
  const rng = rootRng || new SeededRNGService(nextWeek * 7919 + 13);
  const impacts: StateImpact[] = [];
  const globalGazetteItems: string[] = [];
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();

  // 1. Process Individual Rival Stables (Economy/Strategy)
  const processedRivals = (state.rivals || []).map((rival, index) => {
    const strategySeed = nextWeek * 31 + index * 997 + rival.owner.id.length;
    const strategy = updateAIStrategy(rival, state, strategySeed);
    const rivalWithStrategy = { ...rival, strategy };
    const { updatedRival, isBankrupt, gazetteItems } = processAIStable(rivalWithStrategy, state);
    globalGazetteItems.push(...gazetteItems);

    if (isBankrupt) {
      const retirementSeed = nextWeek + index * 1000;
      const [newStable] = generateRivalStables(1, retirementSeed);
      globalGazetteItems.push(`🆕 RECRUITMENT: ${newStable.owner.stableName} has debuted in the league under ${newStable.owner.name}!`);
      return newStable as RivalStableData;
    }
    return updatedRival;
  });

  rivalsUpdates.set("all", { rivals: processedRivals });
  impacts.push({ rivalsUpdates });

  // 2. Draft from Recruitment Pool
  const draft = aiDraftFromPool(state.recruitPool, processedRivals, nextWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);
  impacts.push({ 
    rivalsUpdates: new Map([["all", { rivals: draft.updatedRivals }]]),
    recruitPool: draft.updatedPool 
  });

  // 3. AI Roster Management (Recruitment/Retirement)
  const rosterSeed = nextWeek * 13 + 7;
  const rosterRng = new SeededRNGService(rosterSeed);
  const { updatedRivals: finalizedRivals, gazetteItems: rosterGazette } = processAIRosterManagement({
    ...state,
    week: nextWeek
  }, rosterRng);
  globalGazetteItems.push(...rosterGazette);
  impacts.push({ rivalsUpdates: new Map([["all", { rivals: finalizedRivals }]]) });

  // 4. Contract Decision Phase: AI Stables accept/decline pending boutique offers
  const boutOffersImpact = processAllRivalsBoutOffers(state, finalizedRivals);
  impacts.push(boutOffersImpact);
  
  // 5. Tournament Handling (Every 13 weeks)
  if (nextWeek > 0 && nextWeek % 13 === 0) {
    const tournamentImpact = handleSeasonalTournaments(state, nextWeek, rng);
    impacts.push(tournamentImpact);
  }

  if (globalGazetteItems.length > 0) {
    impacts.push({ newsletterItems: [{ 
      id: rng.uuid(),
      week: nextWeek, 
      title: "Intelligence & Strategy Report", 
      items: globalGazetteItems 
    }]});
  }

  return mergeImpacts(impacts);
}

function handleSeasonalTournaments(state: GameState, week: number, rng: IRNGService): StateImpact {
  const tournaments = TournamentSelectionService.generateSeasonalTiers(state, week, state.season, week * 881);
  const tournamentNews: string[] = [];
  const impacts: StateImpact[] = [];

  tournaments.forEach((tour) => {
    impacts.push({ tournaments: [tour] });
    const tournamentImpact = TournamentSelectionService.resolveCompleteTournament(state, tour.id, week * 500 + hashStr(tour.id));
    impacts.push(tournamentImpact);
    tournamentNews.push(`🏆 ${tour.name} finalized: Champion crowned.`);
  });

  impacts.push({
    isTournamentWeek: true,
    activeTournamentId: tournaments[0]?.id,
    day: 0,
    newsletterItems: [{
      id: rng.uuid(),
      week: week,
      title: "🎖️ TOURNAMENT ARCHIVE",
      items: tournamentNews
    }]
  });

  return mergeImpacts(impacts);
}
