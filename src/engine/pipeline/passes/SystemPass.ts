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
import { computeNextSeason } from "./WorldPass";

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

  // SystemPass runs AFTER WorldPass in the pipeline, so we must not override these values
  const impact: StateImpact = {
    ...hofImpact,
    ...tierImpact,
    seasonalGrowth: state.seasonalGrowth ? [...state.seasonalGrowth] : [],
    // Do NOT set season or weather here - WorldPass handles them
  };

  // 2. Player Bankruptcy Check (after economy pass)
  const bankruptcyResult = BankruptcyService.processPlayerBankruptcy(state, rng);
  if (bankruptcyResult.bankrupt) {
    Object.assign(impact, bankruptcyResult.impact);
  }

  // 3. Seasonal Churn & AI Philosophy Evolution
  // This usually runs only on season change (handled by internal logic or check here)
  // The new season is set by WorldPass, so we use state.season (which will be updated by the time this runs)
  // Calculate the next season to check for season change
  const nextSeason = computeNextSeason(nextWeek);
  const prevSeason = state.season;
  if (prevSeason !== nextSeason) {
    const seasonSeed = nextWeek * 133;
    const rngContext = new RNGContext(seasonSeed + 55);
    const { news } = WorldManagementService.processSeasonalChurn(state, rngContext);

    const { updatedRivals: philRivals, gazetteItems } = evolvePhilosophies(state, nextSeason, rngContext.getRNG());
    const narrGazette = generateOwnerNarratives(state, nextSeason, rngContext.getRNG());

    impact.rivalsUpdates = new Map();
    philRivals.forEach(r => {
      if (impact.rivalsUpdates) impact.rivalsUpdates.set(r.owner.id, r);
    });

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

  // 4. Weekly fame / popularity decay (half-life ≈ 52 weeks; decays ~1.33% per week).
  // Applied as negative deltas so the resolveImpacts pipeline handles merging normally.
  // Rivals decay in the same rivalsUpdates map to keep prestige from becoming permanent.
  const DECAY_RATE = 0.0133;
  const decayAmount = (v: number) => Math.max(0, Math.floor(v * DECAY_RATE));
  const playerFameLoss = decayAmount(state.fame ?? 0);
  const playerPopLoss = decayAmount(state.popularity ?? 0);
  if (playerFameLoss > 0) impact.fameDelta = (impact.fameDelta ?? 0) - playerFameLoss;
  if (playerPopLoss > 0) impact.popularityDelta = (impact.popularityDelta ?? 0) - playerPopLoss;

  if (state.rivals && state.rivals.length > 0) {
    const rivalDecayMap = impact.rivalsUpdates ?? new Map();
    for (const r of state.rivals) {
      const loss = decayAmount(r.fame ?? 0);
      if (loss <= 0) continue;
      const prev = rivalDecayMap.get(r.owner.id) ?? {};
      rivalDecayMap.set(r.owner.id, { ...prev, fame: Math.max(0, (prev.fame ?? r.fame) - loss) });
    }
    if (rivalDecayMap.size > 0) impact.rivalsUpdates = rivalDecayMap;
  }

  return impact;
}
