import type { GameState } from "@/types/game";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { computeTrainerAging } from "@/engine/trainerAging";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";
import { WorldManagementService } from "@/engine/ai/worldManagement";
import { InsightTokenService } from "@/engine/tokens/insightTokenService";
import { seededRng } from "@/engine/rivals";

// 🌩️ New Modular Passes
import { runEconomyPass } from "../passes/EconomyPass";
import { runWarriorPass } from "../passes/WarriorPass";
import { runWorldPass } from "../passes/WorldPass";
import { runRivalStrategyPass } from "../passes/RivalStrategyPass";
import { runEventPass } from "../passes/EventPass";

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
  newState = runWorldPass(newState);
  const nextSeason = newState.season;

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

  // 7. Tournament Reward Tokens
  if (currentWeek % 13 === 0) {
    const tokenRng = seededRng(currentWeek * 42 + 7);
    newState = InsightTokenService.awardToken(newState, tokenRng() > 0.5 ? "Weapon" : "Rhythm", `${newState.season} Championship`);
  }

  // 8. Rival Strategy & Background Actions
  newState = runRivalStrategyPass(newState, nextWeek);

  // 9. Economy & Financial Maintenance
  newState = runEconomyPass(newState);

  // 10. Random Events (Tavern Brawl, etc.)
  newState = runEventPass(newState, nextWeek);

  // 11. Final Cleanup
  newState = { ...newState, trainingAssignments: [] };

  return archiveWeekLogs(newState);
}
