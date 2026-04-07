import type { GameState } from "@/types/game";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { computeTrainerAging } from "@/engine/trainerAging";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";
import { WorldManagementService } from "@/engine/ai/worldManagement";
import { InsightTokenService } from "@/engine/tokens/insightTokenService";
import { SeededRNG } from "@/utils/random";
import { processOwnerGrudges } from "@/engine/ownerGrudges";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";

// 🌩️ New Modular Passes
import { runEconomyPass } from "../passes/EconomyPass";
import { runWarriorPass } from "../passes/WarriorPass";
import { runEquipmentPass } from "../passes/EquipmentPass";
import { runWorldPass } from "../passes/WorldPass";
import { runRivalStrategyPass } from "../passes/RivalStrategyPass";
import { runEventPass } from "../passes/EventPass";
import { runRankingsPass } from "../passes/RankingsPass";
import { runPromoterPass } from "../passes/PromoterPass";
import { runPromoterLifecyclePass } from "../passes/PromoterLifecyclePass";

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

  // 2. Deterministic Domain Impacts
  let newState = executeDomainImpacts(state, nextWeek, rootRng);

  // 3. World & System Transitions
  newState = executeWorldTransitions(newState, rootRng, nextWeek);

  // 4. Strategic & AI Activity
  newState = executeRivalActivity(newState, nextWeek, rootRng);

  // 5. Narrative & Historical Archiving
  newState = executeNarrativePass(newState, currentWeek, nextWeek);

  // 6. Completion & Persistence
  newState = finalizeWeek(newState, nextWeek, nextYear, rootRng);

  // Surface Simulation Math
  newState.lastSimulationReport = state.lastSimulationReport; // Carry over if needed, but we replace it below

  return archiveWeekLogs(newState);
}

/** ─── Coordinator Phases ─────────────────────────────────────────────────── */

function executeDomainImpacts(state: GameState, nextWeek: number, rng: SeededRNG): GameState {
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth, results: trainingResults } = trainingImpactToStateImpact(state, trainingImpactRaw);
  
  const economyImpact = computeEconomyImpact(state);
  const agingImpact = computeAgingImpact(state);
  const healthImpact = computeHealthImpact(state);

  const impacts: StateImpact[] = [
    trainingImpact, 
    economyImpact, 
    agingImpact, 
    healthImpact,
  ];

  const newState = resolveImpacts(state, impacts);
  newState.seasonalGrowth = seasonalGrowth;

  // Generate Report
  const report: import("@/types/state.types").SimulationReport = {
    id: rng.uuid("pro"), // Profile/Report ID
    week: state.week,
    treasuryChange: economyImpact.treasuryDelta ?? 0,
    trainingGains: trainingResults
      .filter(r => r.attr && r.gain)
      .map(r => ({
        warriorId: r.warriorId,
        warriorName: state.roster.find(w => w.id === r.warriorId)?.name || "Unknown",
        attr: r.attr!,
        gain: r.gain!
      })),
    agingEvents: agingImpact.newsletterItems?.[0]?.items || [],
    healthEvents: healthImpact.newsletterItems?.[0]?.items || [],
  };
  newState.lastSimulationReport = report;

  return newState;
}

function executeWorldTransitions(state: GameState, rng: SeededRNG, nextWeek: number): GameState {
  let newState = runWorldPass(state, rng);
  const nextSeason = newState.season;

  newState = runRankingsPass(newState);
  newState = runPromoterPass(newState);
  
  // Recruitment
  const usedNames = new Set(newState.roster.map(w => w.name));
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
      id: rng.uuid("led"), 
      week: nextWeek, 
      title: "Trainer Career Updates", 
      items: news 
    }];
  }

  newState = runPromoterLifecyclePass(newState);
  return newState;
}

function executeRivalActivity(state: GameState, nextWeek: number, rng: SeededRNG): GameState {
  let newState = state;

  // Seasonal Churn & Philosophy Evolution
  if (newState.season !== state.season) {
    const seasonSeed = nextWeek * 133;
    const { updatedRivals, news } = WorldManagementService.processSeasonalChurn(newState, seasonSeed + 55);
    newState.rivals = updatedRivals;
    
    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(newState, newState.season, seasonSeed);
    newState.rivals = philRivals;
    
    const narrGazette = generateOwnerNarratives(newState, newState.season, seasonSeed + 1);
    const combinedNews = [...news, ...gazetteItems, ...narrGazette];
    if (combinedNews.length > 0) {
      newState.newsletter = [...(newState.newsletter || []), { 
        id: seasonSeed.toString(), 
        week: nextWeek, 
        title: `${state.season} Season Summary`, 
        items: combinedNews 
      }];
    }
  }

  // Tournament Generation
  if (nextWeek % 13 === 0) {
    const tours = TournamentSelectionService.generateSeasonalTiers(newState, nextWeek, newState.season, nextWeek * 777);
    newState.tournaments = [...(newState.tournaments || []), ...tours];
    newState.isTournamentWeek = true;
    newState.activeTournamentId = tours[0].id;
    newState.day = 0;
  }

  // Physicality & Equipment
  newState = runWarriorPass(newState);
  newState = runEquipmentPass(newState);

  // AI Strategy
  newState = runRivalStrategyPass(newState, nextWeek, rng);
  
  return newState;
}

function executeNarrativePass(state: GameState, currentWeek: number, nextWeek: number): GameState {
  let newState = runEconomyPass(state);
  newState = runEventPass(newState, nextWeek, new SeededRNG(nextWeek * 101));

  // Gazette
  const weekFights = getFightsForWeek(newState.arenaHistory, currentWeek);
  const story = generateWeeklyGazette(weekFights, newState.crowdMood, currentWeek, newState.graveyard, newState.arenaHistory, currentWeek * 9973 + 456);
  newState.gazettes = [...(newState.gazettes || []), { ...story, week: currentWeek }].slice(-50);

  // Grudges
  const { grudges, gazetteItems } = processOwnerGrudges(newState, newState.ownerGrudges || []);
  newState.ownerGrudges = grudges;
  if (gazetteItems.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { 
      id: nextWeek.toString() + "_grudge", 
      week: nextWeek, 
      title: "Stable Rivalries & Grudges", 
      items: gazetteItems 
    }];
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
