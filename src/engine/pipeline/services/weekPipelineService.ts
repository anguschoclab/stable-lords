import type { GameState, Season } from "@/types/game";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { updateAIStrategy } from "@/engine/ai/intentEngine";
import { processAIStable } from "@/engine/ai/stableManager";
import { generateRivalStables } from "@/engine/rivals";
import { aiDraftFromPool } from "@/engine/draftService";
import { seededRng } from "@/engine/rivals";
import type { PoolWarrior, RivalStableData } from "@/types/game";

import { computeTrainingImpact, trainingImpactToStateImpact } from "@/engine/training";
import { computeEconomyImpact } from "@/engine/economy";
import { computeAgingImpact } from "@/engine/aging";
import { computeHealthImpact } from "@/engine/health";
import { resolveImpacts, StateImpact } from "@/engine/impacts";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { partialRefreshPool } from "@/engine/recruitment";
import { InsightTokenService } from "@/engine/tokens/insightTokenService";
import { runAIvsAIBouts } from "@/engine/matchmaking/rivalScheduler";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
export function computeNextSeason(newWeek: number): Season { return SEASONS[Math.floor((newWeek - 1) / 13) % 4]; }

import { type WeatherType } from "@/types/game";
export function rollWeather(rng: () => number): WeatherType {
  const roll = rng();
  if (roll < 0.6) return "Clear";
  if (roll < 0.75) return "Overcast";
  if (roll < 0.85) return "Rainy";
  if (roll < 0.95) return "Scalding";
  return "Drafty";
}

export function processRivalActions(state: GameState, newWeek: number): GameState {
  const rng = seededRng(newWeek * 7919 + 13);
  const currentRivals = [...(state.rivals || [])];
  const globalGazetteItems: string[] = [];

  let currentPool = [...(state.hiringPool || [])];

  const processedRivals = currentRivals.map((rival, index) => {
    const strategySeed = newWeek * 31 + index * 997 + rival.owner.id.length;
    const strategy = updateAIStrategy(rival, state, strategySeed);
    const rivalWithStrategy = { ...rival, strategy };
    const { updatedRival, isBankrupt, gazetteItems, updatedHiringPool } = processAIStable(rivalWithStrategy, state);
    globalGazetteItems.push(...gazetteItems);
    currentPool = updatedHiringPool;

    if (isBankrupt) {
      const replacementSeed = newWeek + index * 1000;
      const [newStable] = generateRivalStables(1, replacementSeed);
      globalGazetteItems.push(`🆕 EXPANSION: ${newStable.owner.stableName} has moved into the district as a new rival!`);
      return newStable as any as RivalStableData;
    }
    return updatedRival;
  });

  const draft = aiDraftFromPool(state.recruitPool, processedRivals, newWeek, state);
  globalGazetteItems.push(...draft.gazetteItems);

  const newState = { 
    ...state, 
    rivals: draft.updatedRivals, 
    recruitPool: draft.updatedPool, 
    hiringPool: currentPool 
  };
  
  // 4. Background Rival Simulation (Rival-vs-Rival)
  const rivalSeed = newWeek * 7919 + 777;
  const aiResults = runAIvsAIBouts(newState, rivalSeed);
  newState.rivals = aiResults.updatedRivals;
  globalGazetteItems.push(...aiResults.gazetteItems);

  if (globalGazetteItems.length > 0) {
    newState.newsletter = [...(newState.newsletter || []), { week: newWeek, title: "Intelligence Report", items: globalGazetteItems }];
  }
  return newState;
}

export function advanceWeek(state: GameState): GameState {
  const currentWeek = state.week;
  const nextWeek = currentWeek + 1;
  const nextSeason = computeNextSeason(nextWeek);

  const trainingImpactRaw = computeTrainingImpact(state);
  const { impact: trainingImpact, seasonalGrowth } = trainingImpactToStateImpact(state, trainingImpactRaw);

  const impacts: StateImpact[] = [
    trainingImpact, computeEconomyImpact(state), computeAgingImpact(state), computeHealthImpact(state),
  ];

  let newState = resolveImpacts(state, impacts);
  newState.seasonalGrowth = seasonalGrowth;

  const usedNames = new Set<string>();
  newState.roster.forEach(w => usedNames.add(w.name));
  newState.graveyard.forEach(w => usedNames.add(w.name));
  (newState.rivals || []).forEach(r => r.roster.forEach(w => usedNames.add(w.name)));

  newState.recruitPool = partialRefreshPool(newState.recruitPool || [], currentWeek, usedNames);

  const weekFights = getFightsForWeek(newState.arenaHistory, currentWeek);
  const gazetteSeed = currentWeek * 9973 + 456;
  const story = generateWeeklyGazette(weekFights, newState.crowdMood, currentWeek, newState.graveyard, newState.arenaHistory, gazetteSeed);
  newState.gazettes = [...(newState.gazettes || []), { ...story, week: currentWeek }].slice(-50);

  newState = processHallOfFame(newState, nextWeek);
  newState = processTierProgression(newState, nextSeason, nextWeek);

  // 🏆 Phase 4: Tournament Reward Tokens (Week 13, 26, 39, 52)
  if (currentWeek % 13 === 0) {
    const tokenRng = seededRng(currentWeek * 42 + 7);
    const type = tokenRng() > 0.5 ? "Weapon" : "Rhythm";
    newState = InsightTokenService.awardToken(newState, type, `${newState.season} Championship`);
  }

  newState = processRivalActions(newState, nextWeek);

  // ⚡ World Expansion: Roll next week's weather
  const weatherRng = seededRng(nextWeek * 1337 + 42);
  const nextWeather = rollWeather(() => weatherRng());

  // 🍺 World Expansion: Random Tavern Brawl event
  const brawlRng = seededRng(nextWeek * 999 + 1);
  if (brawlRng() < 0.05 && newState.roster.length > 0) {
    const activeWarriors = newState.roster.filter(w => w.status === "Active" && (!w.injuries || w.injuries.length === 0));
    if (activeWarriors.length > 0) {
      const brawlerIndex = Math.floor(brawlRng() * activeWarriors.length);
      const brawler = activeWarriors[brawlerIndex];
      brawler.fame += 5; // Boost reputation
      brawler.injuries.push({
        id: `injury_brawl_${nextWeek}_${brawler.id}`,
        name: "Bruised knuckles (Tavern Brawl)",
        description: "Got into a scrap at the local tavern. The crowd loved it, but the hands took a beating.",
        severity: "Minor",
        weeksRemaining: 1,
        penalties: { ATT: -1 }
      });
      newState.newsletter = [...newState.newsletter, {
        week: nextWeek,
        title: "Tavern Brawl!",
        items: [`${brawler.name} got into a wild tavern brawl last night! They gained +5 Fame but suffered a minor injury.`]
      }];
    }
  }

  newState = { ...newState, week: nextWeek, season: nextSeason, trainingAssignments: [], weather: nextWeather };

  return archiveWeekLogs(newState);
}
