import { type GameState } from '@/types/state.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { processWeekBouts } from '@/engine/bout/services/boutProcessorService';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from './impacts';

export interface AutosimWeekSummary {
  week: number;
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
}

export interface AutosimResult {
  finalState: GameState;
  weeksSimmed: number;
  stopReason: 'max_weeks' | 'death' | 'injury' | 'bankrupt' | 'no_pairings';
  stopDetail?: string;
  weekSummaries: AutosimWeekSummary[];
}

export async function runAutosim(
  initialState: GameState,
  weeksToSim: number,
  onProgress?: (current: number, total: number) => void
): Promise<AutosimResult> {
  let state = initialState;
  let weeksSimmed = 0;
  const weekSummaries: AutosimWeekSummary[] = [];

  for (let i = 0; i < weeksToSim; i++) {
    // 1. Advance Week (Strategy/Promoters/Events handled here)
    state = advanceWeek(state);

    // 2. Headless: Auto-Respond to Player Contracts (Crucial for simulation action)
    const playerOffers = Object.values(state.boutOffers).filter(
      (o) =>
        o.status === 'Proposed' && o.warriorIds.some((id) => state.roster.some((w) => w.id === id))
    );

    playerOffers.forEach((offer) => {
      const playerWarriorId = offer.warriorIds.find((id) => state.roster.some((w) => w.id === id));
      if (!playerWarriorId) return;
      // Auto-accept logical offers (Hype > 100 or Purse > 200)
      if (offer.hype > 100 || offer.purse > 200) {
        state = { ...state, ...respondToBoutOffer(state, offer.id, playerWarriorId, 'Accepted') };
      }
    });

    // Bouts are now handled inside advanceWeek via BoutSimulationPass.
    // We just extract the summary from the last simulation report.
    const report = state.lastSimulationReport?.bouts;
    const summary = report || { bouts: 0, deaths: 0, injuries: 0, deathNames: [], injuryNames: [] };
    const results: any[] = []; // Only checked for length down below

    if (!state)
      return {
        weekSummaries,
        weeksSimmed,
        stopReason: 'no_pairings' as const,
        finalState: null as any,
      };

    weekSummaries.push({
      week: state.week || 1,
      bouts: summary.bouts,
      deaths: summary.deaths,
      injuries: summary.injuries,
      deathNames: summary.deathNames || [],
      injuryNames: summary.injuryNames || [],
    });

    weeksSimmed++;

    if (onProgress) {
      onProgress(weeksSimmed, weeksToSim);
    }

    // Stop conditions
    if (state.treasury < -500) {
      return {
        finalState: state,
        weeksSimmed,
        stopReason: 'bankrupt',
        stopDetail: 'Stable ran out of treasury',
        weekSummaries,
      };
    }

    if (state.roster.length === 0) {
      return {
        finalState: state,
        weeksSimmed,
        stopReason: 'no_pairings',
        stopDetail: 'No warriors left to fight',
        weekSummaries,
      };
    }

    if (weeksSimmed > 0 && results.length === 0 && weeksSimmed % 4 === 1) {
      // Only stop if no fights for multiple weeks (ignore single dry weeks)
    }
  }

  return {
    finalState: state,
    weeksSimmed,
    stopReason: 'max_weeks',
    stopDetail: 'Reached maximum simulation weeks',
    weekSummaries,
  };
}
