import type { GameState } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { RNGContext } from "@/engine/core/rng/RNGContext";
import { StateImpact } from "@/engine/impacts";
import { processHallOfFame } from "../core/hallOfFame";
import { processTierProgression } from "../core/tierProgression";
import { WorldManagementService } from "@/engine/ai/worldManagement";
import { evolvePhilosophies } from "@/engine/ownerPhilosophy";
import { generateOwnerNarratives } from "@/engine/ownerNarrative";
import { BankruptcyService } from "@/engine/ai/bankruptcyService";

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
  const hofImpact = processHallOfFame(state, nextWeek);
  const tierImpact = processTierProgression(state, state.season, nextWeek);

  const impact: StateImpact = {
    ...hofImpact,
    ...tierImpact,
    seasonalGrowth: state.seasonalGrowth,
    season: state.season,
    weather: state.weather
  };

  // 2. Player Bankruptcy Check (after economy pass)
  const bankruptcyResult = BankruptcyService.processPlayerBankruptcy(state, rng);
  if (bankruptcyResult.bankrupt) {
    Object.assign(impact, bankruptcyResult.impact);
  }

  // 3. Seasonal Churn & AI Philosophy Evolution
  // This usually runs only on season change (handled by internal logic or check here)
  const prevSeason = state.season;
  const currentSeason = impact.season || state.season;
  if (prevSeason !== currentSeason) {
    const seasonSeed = nextWeek * 133;
    const rngContext = new RNGContext(seasonSeed + 55);
    const { news } = WorldManagementService.processSeasonalChurn(state, rngContext);

    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(state, state.season, rngContext.getRNG());
    const narrGazette = generateOwnerNarratives(state, state.season, rngContext.getRNG());

    impact.rivalsUpdates = new Map();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    philRivals.forEach(r => impact.rivalsUpdates!.set(r.owner.id, r));

    const combinedNews = [...news, ...gazetteItems, ...narrGazette];
    if (combinedNews.length > 0) {
      const existingItems = impact.newsletterItems || [];
      impact.newsletterItems = [
        ...existingItems,
        {
          id: rng.uuid("newsletter"),
          week: nextWeek,
          title: `${state.season} Season Summary`,
          items: combinedNews
        }
      ];
    }
  }

  return impact;
}
