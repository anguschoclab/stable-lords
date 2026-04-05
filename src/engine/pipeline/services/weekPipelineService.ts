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
  const currentWeek = state.week;
  const nextWeek = currentWeek + 1;
  const rootRng = new SeededRNG(nextWeek * 7919 + 101);

  // 1. Core Simulation Impact Phase (Deterministic)
  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(state, trainingImpactRaw);
  const impacts: StateImpact[] = [
    trainingImpact, 
    computeEconomyImpact(state), 
    computeAgingImpact(state), 
    computeHealthImpact(state),
  ];
  let newState = resolveImpacts(state, impacts);
  newState.seasonalGrowth = seasonalGrowth;

  // 2. World State Update (Week, Season, Weather)
  newState = runWorldPass(newState, rootRng);
  const nextSeason = newState.season;

  // 2.1 — Global Rankings & Promoter Logic
  newState = runRankingsPass(newState);
  newState = runPromoterPass(newState);

  // 3. Recruitment & Administrative Churn
  const usedNames = new Set<string>();
  newState.roster.forEach(w => usedNames.add(w.name));
  newState.graveyard.forEach(w => usedNames.add(w.name));
  (newState.rivals || []).forEach(r => r.roster.forEach(w => usedNames.add(w.name)));
  newState.recruitPool = partialRefreshPool(newState.recruitPool || [], currentWeek, usedNames);

  // 4. Gazette & Hall of Fame
  const weekFights = getFightsForWeek(newState.arenaHistory, currentWeek);
  const story = generateWeeklyGazette(weekFights, newState.crowdMood, currentWeek, newState.graveyard, newState.arenaHistory, currentWeek * 9973 + 456);
  newState.gazettes = [...(newState.gazettes || []), { ...story, week: currentWeek }].slice(-50);
  newState = processHallOfFame(newState, nextWeek);
  newState = processTierProgression(newState, nextSeason, nextWeek);

  // 5. Trainer Aging & Legacy
  const { updatedTrainers, news: trainerNews, updatedHiringPool } = computeTrainerAging(newState);
  newState.trainers = updatedTrainers;
  newState.hiringPool = updatedHiringPool;
  if (trainerNews.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { week: nextWeek, title: "Trainer Career Updates", items: trainerNews }];
  }

  // 5.1 — Promoter Careers & Succession
  newState = runPromoterLifecyclePass(newState);

  // 6. Seasonal Adaptation (Narrative, Philosophy, and Churn)
  if (nextSeason !== state.season) {
    const seasonSeed = nextWeek * 133;
    const { updatedRivals: churnRivals, news: churnNews } = WorldManagementService.processSeasonalChurn(newState, seasonSeed + 55);
    newState.rivals = churnRivals;
    const { updatedRivals: philRivals, gazetteItems: philGazette } = evolvePhilosophies(newState, nextSeason, seasonSeed);
    newState.rivals = philRivals;
    const narrGazette = generateOwnerNarratives(newState, nextSeason, seasonSeed + 1);
    const combinedNews = [...churnNews, ...philGazette, ...narrGazette];
    if (combinedNews.length > 0) {
      newState.newsletter = [...(newState.newsletter || []), { week: nextWeek, title: `${state.season} Season Summary`, items: combinedNews }];
    }
  }

  // 7. Tournament Generation & Daily Trigger
  if (nextWeek % 13 === 0) {
    const tours = TournamentSelectionService.generateSeasonalTiers(newState, nextWeek, newState.season, nextWeek * 777);
    newState.tournaments = [...(newState.tournaments || []), ...tours];
    newState.isTournamentWeek = true;
    newState.activeTournamentId = tours[0].id; // Default focal tournament (Gold Cup)
    newState.day = 0;
    
    newState.newsletter = [...(newState.newsletter || []), { 
      week: nextWeek, 
      title: "🏆 IMPERIAL CHAMPIONSHIPS BEGIN", 
      items: ["The seasonal tournaments have been bracketed. Progression will shift to DAILY ticks until champions are crowned."]
    }];
  }

  // 8. Physicality & Aging (Injuries, Development)
  newState = runWarriorPass(newState);

  // 8.1 — AI Equipment Optimization (Apply Favorites)
  newState = runEquipmentPass(newState);

  // 8.2. Rival Strategy & Background Actions
  newState = runRivalStrategyPass(newState, nextWeek, rootRng);

  // 9. Economy & Financial Maintenance
  newState = runEconomyPass(newState);

  // 10. Random Events (Tavern Brawl, etc.)
  newState = runEventPass(newState, nextWeek, rootRng);

  // 10.1 — Owner Grudges & Rivalries
  const { grudges: updatedGrudges, gazetteItems: grudgeNews } = processOwnerGrudges(newState, newState.ownerGrudges || []);
  newState.ownerGrudges = updatedGrudges;
  if (grudgeNews.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { week: nextWeek, title: "Stable Rivalries & Grudges", items: grudgeNews }];
  }

  // 11. Final Cleanup
  newState = { ...newState, trainingAssignments: [] };

  return archiveWeekLogs(newState);
}
