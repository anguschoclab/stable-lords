import type { GameState } from "@/types/state.types";
import { advanceWeek as runWeeklyPipeline } from "@/engine/pipeline/services/weekPipelineService";
import { TournamentSelectionService } from "@/engine/matchmaking/tournamentSelection";
import { SeededRNG } from "@/utils/random";

/**
 * Stable Lords — Daily Progression Pipeline
 * Orchestrates tournament rounds and world ticks during campaign weeks.
 */
export function advanceDay(state: GameState): GameState {
  let nextState = { ...state };
  const currentDay = state.day || 0;
  const nextDay = currentDay + 1;

  // 1. Check if we have an active tournament to resolve
  if (state.isTournamentWeek && state.activeTournamentId) {
    const tourRngSeed = (state.week * 100) + nextDay;
    const { updatedState, roundResults } = TournamentSelectionService.resolveRound(
      nextState, 
      state.activeTournamentId, 
      tourRngSeed
    );
    
    // Add round summary to newsletter or history
    if (roundResults.length > 0) {
      const dayRng = new SeededRNG((state.week * 100) + nextDay);
      updatedState.newsletter = [...(updatedState.newsletter || []), {
        id: dayRng.uuid("newsletter"),
        week: state.week,
        title: `Empire Day ${nextDay}: Tournament Results`,
        items: roundResults
      }];
    }
    
    nextState = updatedState;
  }

  // 2. Handle Day 7 transition (Full Weekly Pipeline)
  if (nextDay >= 7) {
    // Reset day and run the heavy weekly logic
    const finalState = runWeeklyPipeline(nextState);
    return {
      ...finalState,
      day: 0,
      isTournamentWeek: false,
      activeTournamentId: undefined
    };
  }

  // 3. Regular Day Advance
  return {
    ...nextState,
    day: nextDay
  };
}
