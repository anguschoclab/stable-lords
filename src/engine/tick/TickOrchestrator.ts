import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { advanceWeek as runWeeklyPipeline } from '@/engine/pipeline/services/weekPipelineService';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { TimeAdvanceService, type QuarterAdvanceResult, type YearAdvanceResult, type AdvanceOptions } from './TimeAdvanceService';

/**
 * Stable Lords — Unified Tick Orchestrator
 * Central point for all time-based progression logic.
 */
export const TickOrchestrator = {
  /**
   * Advances a single day including tournament resolution.
   */
  advanceDay(state: GameState): GameState {
    const currentDay = state.day || 0;
    const nextDay = currentDay + 1;
    const rng = new SeededRNGService(state.week * 100 + nextDay);

    // 1. Weekly Transition (Day 7)
    if (nextDay >= 7) {
      const finalState = runWeeklyPipeline(state);
      return {
        ...finalState,
        day: 0,
        isTournamentWeek: false,
        activeTournamentId: undefined,
      };
    }

    // 2. Tournament Day (Skip to End Mode not active)
    if (state.isTournamentWeek && state.activeTournamentId) {
      const { updatedState, roundResults } = TournamentSelectionService.resolveRound(
        state,
        state.activeTournamentId,
        state.week * 100 + nextDay
      );

      const nextState = { ...updatedState, day: nextDay };

      if (roundResults.length > 0) {
        nextState.newsletter = [
          ...(nextState.newsletter || []),
          {
            id: rng.uuid(),
            week: state.week,
            title: `Empire Day ${nextDay}: Tournament Results`,
            items: roundResults,
          },
        ];
      }
      return nextState;
    }

    // 3. Regular Day
    return { ...state, day: nextDay };
  },

  /**
   * High-performance: Skips to the end of the current week.
   * Batches tournament rounds into a single summary.
   */
  skipToWeekEnd(state: GameState): GameState {
    let currentState = { ...state };
    const currentDay = state.day || 0;
    const weeklyNewsItems: string[] = [];

    // 1. Resolve Tournament Rounds (Batched)
    if (state.isTournamentWeek && state.activeTournamentId) {
      for (let day = currentDay + 1; day < 7; day++) {
        const { updatedState, roundResults } = TournamentSelectionService.resolveRound(
          currentState,
          state.activeTournamentId,
          state.week * 100 + day
        );
        currentState = updatedState;
        weeklyNewsItems.push(...roundResults.map((r) => `[Day ${day}] ${r}`));
      }
    }

    // 2. Collect Batched Summary (Already done by resolving rounds sequentially in a loop)
    // Add the batched newsletter item
    if (weeklyNewsItems.length > 0) {
      currentState.newsletter = [
        ...(currentState.newsletter || []),
        {
          id: new SeededRNGService(state.week).uuid(),
          week: state.week,
          title: `Empire News: Tournament Week ${state.week} Recap`,
          items: weeklyNewsItems,
        },
      ];
    }

    // 3. Run final weekly pipeline
    const finalState = runWeeklyPipeline(currentState);
    return {
      ...finalState,
      day: 0,
      isTournamentWeek: false,
      activeTournamentId: undefined,
    };
  },

  /**
   * Advance a quarter (13 weeks) with progress tracking.
   * Delegates to TimeAdvanceService for batch processing.
   */
  async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    return TimeAdvanceService.advanceQuarter(state, opts);
  },

  /**
   * Skip to quarter end (headless mode for UI).
   * Batches 13 weeks with deferred I/O.
   */
  async skipToQuarterEnd(state: GameState, opts?: Omit<AdvanceOptions, 'checkpointInterval'>): Promise<QuarterAdvanceResult> {
    return TimeAdvanceService.skipToQuarterEnd(state, opts);
  },

  /**
   * Advance a full year (52 weeks = 4 quarters).
   * Includes year-end Hall of Fame and tier progression.
   */
  async advanceYear(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    return TimeAdvanceService.advanceYear(state, opts);
  },

  /**
   * Skip to year end (headless mode for UI).
   * Batches 52 weeks with deferred I/O.
   */
  async skipToYearEnd(state: GameState, opts?: Omit<AdvanceOptions, 'checkpointInterval'>): Promise<YearAdvanceResult> {
    return TimeAdvanceService.skipToYearEnd(state, opts);
  },
};
