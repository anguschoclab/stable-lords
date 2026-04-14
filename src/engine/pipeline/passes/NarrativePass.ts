import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { StateImpact } from "@/engine/impacts";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { processOwnerGrudges } from "@/engine/ownerGrudges";
import { updateRivalriesFromBouts } from "@/engine/matchmaking/rivalryLogic";
import { getFightsForWeek } from "@/engine/core/historyUtils";

/**
 * Stable Lords — Narrative Pipeline Pass
 * Bundles Gazette generation, Grudges, and Rivalry updates into a single impact.
 */
export const PASS_METADATA = {
  name: "NarrativePass",
  dependencies: ["RivalStrategyPass"]
};

export function runNarrativePass(state: GameState, currentWeek: number, nextWeek: number, rootRng?: IRNGService): StateImpact {
  const rng = rootRng || new SeededRNGService(currentWeek * 9973 + 456);
  
  // 1. Gazette generation
  const weekFights = getFightsForWeek(state.arenaHistory, currentWeek);
  const story = generateWeeklyGazette(weekFights, state.crowdMood, currentWeek, state.graveyard, state.arenaHistory, rng);
  const gazettes = [...(state.gazettes || []), { ...story, week: currentWeek }].slice(-50);
  
  // 2. Owner Grudges
  const { grudges, gazetteItems } = processOwnerGrudges(state, state.ownerGrudges || []);
  
  // 3. Rivalry Escalation
  const rivalries = updateRivalriesFromBouts(state.rivalries || [], weekFights, nextWeek, rng);

  const impact: StateImpact = { 
    gazettes, 
    ownerGrudges: grudges,
    rivalries
  };

  if (gazetteItems.length > 0) {
    impact.newsletterItems = [{ 
      id: rng.uuid(), 
      week: nextWeek, 
      title: "Stable Rivalries & Grudges", 
      items: gazetteItems 
    }];
  }

  return impact;
}
