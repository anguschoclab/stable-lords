import type { GameState, Trainer } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { computeTrainerAging } from "@/engine/trainerAging";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";
import { WorldManagementService } from "@/engine/ai/worldManagement";
import { PatronTokenService } from "@/engine/tokens/patronTokenService";
import { SeededRNG } from "@/utils/random";
import { processOwnerGrudges } from "@/engine/ownerGrudges";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";
import { computeMetaDrift } from "@/engine/metaDrift";

// 🌩️ New Modular Passes
import { runEconomyPass } from "../passes/EconomyPass";
import { runWarriorPass } from "../passes/WarriorPass";
import { runEquipmentPass } from "../passes/EquipmentPass";
import { runWorldPass } from "../passes/WorldPass";
import { runRivalStrategyPass } from "../passes/RivalStrategyPass";
import { runEventPass } from "../passes/EventPass";
import { runPromoterPass } from "../passes/PromoterPass";
import { runPromoterLifecyclePass } from "../passes/PromoterLifecyclePass";
import { runRankingsPass } from "../passes/RankingsPass";
import { runBoutSimulationPass } from "../passes/BoutSimulationPass";

import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeEconomyImpact } from "@/engine/economy";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { partialRefreshPool } from "@/engine/recruitment";

/**
 * Stable Lords — Consolidated Weekly Pipeline
 * Orchestrates the simulation tick by executing a series of specialized passes.
 */
export function advanceWeek(state: GameState): GameState {
  // 1. Preparation
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;

  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }

  const rootRng = new SeededRNG(nextYear * 52 + nextWeek * 7919 + 101);

  // ⚡ Bolt: Compute and cache meta drift weekly for AI components
  const metaDrift = computeMetaDrift(state.arenaHistory || []);

  // 2. Core Simulation (Bouts, Training, Health, Economy)
  // Bouts happen for the week that is just ending
  let newState = runBoutSimulationPass(state, rootRng);
  newState = { ...newState, cachedMetaDrift: metaDrift };

  // ⚡ Bolt: Build and cache warrior map weekly for bout processing
  const warriorMap = new Map<string, Warrior>();
  newState.roster.forEach(w => warriorMap.set(w.id, w));
  (newState.rivals || []).forEach(r => r.roster.forEach(w => warriorMap.set(w.id, w)));
  newState = { ...newState, warriorMap };

  newState = runWarriorPass(newState, rootRng);
  newState = runEconomyPass(newState, rootRng);
  newState = runEquipmentPass(newState);

  // ⚡ Bolt: Early exit on bankruptcy condition
  if (newState.treasury < -500) {
    newState = finalizeWeek(newState, nextWeek, nextYear, rootRng);
    return archiveWeekLogs(newState);
  }

  // 3. World & System Transitions
  newState = executeWorldTransitions(newState, rootRng, nextWeek);

  // 4. Strategic & AI Activity
  newState = executeRivalActivity(newState, nextWeek, rootRng);

  // 5. Events & Narrative
  newState = runEventPass(newState, nextWeek, rootRng); // Use rootRng for consistency
  newState = executeNarrativePass(newState, currentWeek, nextWeek, rootRng);

  // 6. Completion & Persistence
  newState = finalizeWeek(newState, nextWeek, nextYear, rootRng);

  // Surface Simulation Math
  newState.lastSimulationReport = state.lastSimulationReport; // Carry over if needed, but we replace it below

  return archiveWeekLogs(newState);
}



function executeWorldTransitions(state: GameState, rng: SeededRNG, nextWeek: number): GameState {
  let newState = runWorldPass(state, rng, nextWeek);
  const nextSeason = newState.season;

  newState = runRankingsPass(newState);
  newState = runPromoterPass(newState);
  
  // Recruitment
  const usedNames = new Set<string>(newState.roster.map((w: any) => w.name));
  newState.recruitPool = partialRefreshPool(newState.recruitPool || [], newState.week, usedNames);

  // Tier Progression
  newState = processHallOfFame(newState, nextWeek);
  newState = processTierProgression(newState, nextSeason, nextWeek);

  // Trainer Lifecycle
  const { updatedTrainers, news, updatedHiringPool } = computeTrainerAging(newState);
  newState.trainers = updatedTrainers;
  newState.hiringPool = updatedHiringPool;
  if (news.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { 
      id: rng.uuid("newsletter"), 
      week: nextWeek, 
      title: "Trainer Career Updates", 
      items: news 
    }];
  }

  newState = runPromoterLifecyclePass(newState, rng);
  return newState;
}

function executeRivalActivity(state: GameState, nextWeek: number, rng: SeededRNG): GameState {
  let newState = { ...state };

  // Seasonal Churn & Philosophy Evolution
  if (newState.season !== state.season) {
    const seasonSeed = nextWeek * 133;
    const { updatedRivals, news } = WorldManagementService.processSeasonalChurn(newState, seasonSeed + 55);
    newState = { ...newState, rivals: updatedRivals };
    
    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(newState, newState.season, seasonSeed);
    newState = { ...newState, rivals: philRivals };
    
    const narrGazette = generateOwnerNarratives(newState, newState.season, seasonSeed + 1);
    const combinedNews = [...news, ...gazetteItems, ...narrGazette];
    if (combinedNews.length > 0) {
      newState = {
        ...newState,
        newsletter: [...(newState.newsletter || []), { 
          id: rng.uuid("newsletter"), 
          week: nextWeek, 
          title: `${state.season} Season Summary`, 
          items: combinedNews 
        }]
      };
    }
  }

  // Tournament Generation
  if (nextWeek % 13 === 0) {
    const tours = TournamentSelectionService.generateSeasonalTiers(newState, nextWeek, newState.season, nextWeek * 777);
    newState = {
      ...newState,
      tournaments: [...(newState.tournaments || []), ...tours],
      isTournamentWeek: true,
      activeTournamentId: tours[0].id,
      day: 0
    };
  }

  // 🛡️ 1.0 Hardening: Removed Redundant Warrior/Equipment Passes
  // (They are already processed at the start of the week in advanceWeek)

  // AI Strategy
  newState = runRivalStrategyPass(newState, nextWeek, rng);
  
  return newState;
}

function executeNarrativePass(state: GameState, currentWeek: number, nextWeek: number, rng: SeededRNG): GameState {
  let newState = { ...state };

  // Gazette
  const weekFights = getFightsForWeek(newState.arenaHistory, currentWeek);
  const story = generateWeeklyGazette(weekFights, newState.crowdMood, currentWeek, newState.graveyard, newState.arenaHistory, currentWeek * 9973 + 456);
  newState = {
    ...newState,
    gazettes: [...(newState.gazettes || []), { ...story, week: currentWeek }].slice(-50)
  };

  // Grudges
  const { grudges, gazetteItems } = processOwnerGrudges(newState, newState.ownerGrudges || []);
  newState = { ...newState, ownerGrudges: grudges };
  if (gazetteItems.length > 0) {
    newState = {
      ...newState,
      newsletter: [...(newState.newsletter || []), { 
        id: rng.uuid("newsletter"), 
        week: nextWeek, 
        title: "Stable Rivalries & Grudges", 
        items: gazetteItems 
      }]
    };
  }

  return newState;
}

function finalizeWeek(state: GameState, nextWeek: number, nextYear: number, rng: SeededRNG): GameState {
  return {
    ...state,
    week: nextWeek,
    year: nextYear,
    trainingAssignments: [],
  };
}
