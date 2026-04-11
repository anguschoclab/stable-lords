import type { GameState, Season } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { RNGContext } from "@/engine/core/rng/RNGContext";
import { StateImpact } from "@/engine/impacts";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { WorldManagementService } from "@/engine/ai/worldManagement";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";

/**
 * Stable Lords — System & Season Pipeline Pass
 * Bundles systemic updates like Hall of Fame, Tier Progression, and AI Seasonal Churn.
 */
export const PASS_METADATA = {
  name: "SystemPass",
  dependencies: ["WorldPass"]
};

export function runSystemPass(state: GameState, rootRng?: IRNGService): StateImpact {
  const nextWeek = state.week + 1 > 52 ? 1 : state.week + 1;
  const rng = rootRng || new SeededRNGService(state.week * 881 + 17);
  
  // 1. Systemic Progression (Draft-heavy)
  let finalizedState = processHallOfFame(state, nextWeek);
  finalizedState = processTierProgression(finalizedState, finalizedState.season, nextWeek);
  
  const impact: StateImpact = {
    seasonalGrowth: finalizedState.seasonalGrowth,
    tokensDelta: finalizedState.tokens,
    season: finalizedState.season,
    weather: finalizedState.weather
  };

  // 2. Seasonal Churn & AI Philosophy Evolution
  // This usually runs only on season change (handled by internal logic or check here)
  if (finalizedState.season !== state.season) {
    const seasonSeed = nextWeek * 133;
    const rngContext = new RNGContext(seasonSeed + 55);
    const { updatedRivals, news } = WorldManagementService.processSeasonalChurn(finalizedState, rngContext);
    
    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(finalizedState, finalizedState.season, rngContext.getRNG());
    const narrGazette = generateOwnerNarratives(finalizedState, finalizedState.season, rngContext.getRNG());
    
    impact.rivalsUpdates = new Map();
    philRivals.forEach(r => impact.rivalsUpdates!.set(r.owner.id, r));
    
    const combinedNews = [...news, ...gazetteItems, ...narrGazette];
    if (combinedNews.length > 0) {
      impact.newsletterItems = [{ 
        id: rng.uuid("newsletter"), 
        week: nextWeek, 
        title: `${finalizedState.season} Season Summary`, 
        items: combinedNews 
      }];
    }
  }

  return impact;
}
