import { type GameState } from "@/types/state.types";
import { advanceWeek } from "@/state/gameStore";
import { processWeekBouts } from "@/engine/bout/services/boutProcessorService";
import { respondToBoutOffer } from "@/state/mutations/contractMutations";

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
  stopReason: "max_weeks" | "death" | "injury" | "bankrupt" | "no_pairings";
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
    const playerOffers = Object.values(state.boutOffers).filter(o => 
      o.status === "Proposed" && 
      o.warriorIds.some(id => state.roster.some(w => w.id === id))
    );

    playerOffers.forEach(offer => {
      const playerWarriorId = offer.warriorIds.find(id => state.roster.some(w => w.id === id))!;
      // Auto-accept logical offers (Hype > 100 or Purse > 200)
      if (offer.hype > 100 || offer.purse > 200) {
        state = respondToBoutOffer(state, offer.id, playerWarriorId, "Accepted");
      }
    });

    // 3. Process Weekly Bouts (Actually runs the fights)
    const { state: nextState, results, summary } = processWeekBouts(state);
    state = nextState;
    
    weekSummaries.push({
      week: state.week,
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
      return { finalState: state, weeksSimmed, stopReason: "bankrupt", stopDetail: "Stable ran out of treasury", weekSummaries };
    }
    
    if (state.roster.length === 0) {
      return { finalState: state, weeksSimmed, stopReason: "no_pairings", stopDetail: "No warriors left to fight", weekSummaries };
    }

    if (weeksSimmed > 0 && results.length === 0 && weeksSimmed % 4 === 1) {
       // Only stop if no fights for multiple weeks (ignore single dry weeks)
    }
  }

  return {
    finalState: state,
    weeksSimmed,
    stopReason: "max_weeks",
    stopDetail: "Reached maximum simulation weeks",
    weekSummaries
  };
}
