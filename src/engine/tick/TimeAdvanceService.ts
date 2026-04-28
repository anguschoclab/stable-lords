import type { GameState } from '@/types/state.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { getFeatureFlags } from '@/engine/featureFlags';

/**
 * Stop condition types for batch operations
 */
export type SoftStopCondition =
  | { type: 'rosterEmpty' }
  | { type: 'playerDeath' }
  | { type: 'noPairings' }
  | { type: 'custom'; check: (state: GameState) => boolean };

/**
 * Predefined stop condition sets
 */
export const DEFAULT_AUTOSIM_STOPS: SoftStopCondition[] = [
  { type: 'rosterEmpty' },
  { type: 'playerDeath' },
  { type: 'noPairings' },
];

/**
 * Options for time advancement operations
 */
export interface AdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) */
  headless?: boolean;
  /** Weeks between checkpoint evaluations */
  checkpointInterval?: number;
  /** Stop conditions for early termination */
  stopConditions?: SoftStopCondition[];
  /** Progress callback */
  onProgress?: (weeksCompleted: number, totalWeeks: number) => void;
  /** Defer OPFS archiving until end of batch */
  deferArchives?: boolean;
}

/**
 * Summary of a single week's advancement
 */
export interface WeekSummary {
  week: number;
  year: number;
  treasury: number;
  rosterSize: number;
  bouts: number;
  deaths: number;
}

/**
 * Summary of a quarter's advancement
 */
export interface QuarterSummary {
  startWeek: number;
  endWeek: number;
  startYear: number;
  endYear: number;
  treasuryDelta: number;
  weekSummaries: WeekSummary[];
}

/**
 * Result of a quarter advancement
 */
export interface QuarterAdvanceResult {
  state: GameState;
  summaries: WeekSummary[];
  quarterSummary: QuarterSummary;
  stopReason: string | null;
  weeksCompleted: number;
}

/**
 * Result of a year advancement
 */
export interface YearAdvanceResult {
  state: GameState;
  quarterResults: QuarterAdvanceResult[];
  annualSummary: {
    startYear: number;
    endYear: number;
    treasuryDelta: number;
    totalBouts: number;
    totalDeaths: number;
  };
  stopReason: string | null;
}

/**
 * Evaluate stop conditions against current state
 */
export function evaluateStopConditions(
  state: GameState,
  conditions: SoftStopCondition[]
): { shouldStop: boolean; reason?: string } {
  for (const condition of conditions) {
    switch (condition.type) {
      case 'rosterEmpty':
        if (state.roster.length === 0) {
          return { shouldStop: true, reason: 'roster_empty' };
        }
        break;
      case 'playerDeath':
        // Check if any unacknowledged deaths exist
        if (state.unacknowledgedDeaths && state.unacknowledgedDeaths.length > 0) {
          return { shouldStop: true, reason: 'player_death' };
        }
        break;
      case 'noPairings':
        // Check if there are no eligible fighters
        const hasEligible = state.roster.some(
          (w) => w.status === 'Active' && !w.isDead && (!w.injuries || w.injuries.length === 0)
        );
        if (!hasEligible) {
          return { shouldStop: true, reason: 'no_pairings' };
        }
        break;
      case 'custom':
        if (condition.check(state)) {
          return { shouldStop: true, reason: 'custom_condition' };
        }
        break;
    }
  }
  return { shouldStop: false };
}

/**
 * Extract a summary from current state
 */
function extractWeekSummary(state: GameState): WeekSummary {
  const weekFights = state.arenaHistory?.filter((f) => f.week === state.week) ?? [];
  const deaths = weekFights.filter((f) => f.by === 'Kill').length;

  return {
    week: state.week,
    year: state.year,
    treasury: state.treasury,
    rosterSize: state.roster.length,
    bouts: weekFights.length,
    deaths,
  };
}

/**
 * Flush deferred archives to OPFS
 */
async function flushDeferredArchives(state: GameState): Promise<void> {
  const deferred = (state as any).deferredBoutLogs;
  if (!deferred || deferred.length === 0) return;

  // Import dynamically to avoid circular dependencies
  const { OPFSArchiveService } = await import('@/engine/storage/opfsArchive');
  const service = new OPFSArchiveService();

  if (!service.isSupported()) return;

  // Batch archive all deferred logs
  for (const log of deferred) {
    try {
      await service.archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true);
    } catch (err) {
      console.error(`Failed to archive bout ${log.boutId}:`, err);
    }
  }

  // Clear deferred logs
  (state as any).deferredBoutLogs = [];
}

/**
 * Unified Time Advance Service
 * Central point for all time-based progression with batch support
 */
export const TimeAdvanceService = {
  /**
   * Advance a single week
   */
  advanceWeek(state: GameState, opts?: AdvanceOptions): GameState {
    const flags = getFeatureFlags();

    // If headless mode is not enabled via feature flag, ignore the option
    // TODO: Implement headless mode in weekPipelineService (Phase 2)
    const headless = flags.headlessWeekAdvance && opts?.headless;
    void headless; // Marked for future use

    // Call the existing week pipeline with options
    // Note: weekPipelineService needs to be updated to accept options
    return advanceWeek(state);
  },

  /**
   * Advance a quarter (13 weeks)
   * Guarantees determinism: 13 sequential advanceWeek calls produce identical state
   */
  advanceQuarter(state: GameState, opts?: AdvanceOptions): QuarterAdvanceResult {
    const flags = getFeatureFlags();

    if (!flags.quarterPipeline) {
      // Fallback: return error or use default behavior
      throw new Error('Quarter pipeline not enabled. Set feature flag quarterPipeline=true');
    }

    let currentState = state;
    const weekSummaries: WeekSummary[] = [];
    const startTreasury = state.treasury;
    const startWeek = state.week;
    const startYear = state.year;

    const checkpointInterval = opts?.checkpointInterval ?? 4;

    for (let i = 0; i < 13; i++) {
      // Advance one week using the core pipeline
      currentState = advanceWeek(currentState);

      // Extract summary
      weekSummaries.push(extractWeekSummary(currentState));

      // Checkpoint evaluation
      if (opts?.stopConditions && (i + 1) % checkpointInterval === 0) {
        const stopResult = evaluateStopConditions(currentState, opts.stopConditions);
        if (stopResult.shouldStop) {
          // Flush any deferred archives before returning
          if (opts.deferArchives) {
            flushDeferredArchives(currentState);
          }

          return {
            state: currentState,
            summaries: weekSummaries,
            quarterSummary: {
              startWeek,
              endWeek: currentState.week,
              startYear,
              endYear: currentState.year,
              treasuryDelta: currentState.treasury - startTreasury,
              weekSummaries,
            },
            stopReason: stopResult.reason ?? 'unknown',
            weeksCompleted: i + 1,
          };
        }
      }

      // Progress callback
      if (opts?.onProgress) {
        opts.onProgress(i + 1, 13);
      }
    }

    // Flush deferred archives at quarter end
    if (opts?.deferArchives) {
      flushDeferredArchives(currentState);
    }

    return {
      state: currentState,
      summaries: weekSummaries,
      quarterSummary: {
        startWeek,
        endWeek: currentState.week,
        startYear,
        endYear: currentState.year,
        treasuryDelta: currentState.treasury - startTreasury,
        weekSummaries,
      },
      stopReason: null,
      weeksCompleted: 13,
    };
  },

  /**
   * Advance a year (52 weeks = 4 quarters)
   */
  advanceYear(state: GameState, opts?: AdvanceOptions): YearAdvanceResult {
    const flags = getFeatureFlags();

    if (!flags.yearPipeline) {
      throw new Error('Year pipeline not enabled. Set feature flag yearPipeline=true');
    }

    let currentState = state;
    const quarterResults: QuarterAdvanceResult[] = [];
    const startYear = state.year;
    const startTreasury = state.treasury;

    for (let q = 0; q < 4; q++) {
      const result = this.advanceQuarter(currentState, opts);
      quarterResults.push(result);
      currentState = result.state;

      // Early termination if stop condition triggered
      if (result.stopReason) {
        return {
          state: currentState,
          quarterResults,
          annualSummary: {
            startYear,
            endYear: currentState.year,
            treasuryDelta: currentState.treasury - startTreasury,
            totalBouts: quarterResults.reduce((sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.bouts, 0), 0),
            totalDeaths: quarterResults.reduce((sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.deaths, 0), 0),
          },
          stopReason: result.stopReason,
        };
      }
    }

    return {
      state: currentState,
      quarterResults,
      annualSummary: {
        startYear,
        endYear: currentState.year,
        treasuryDelta: currentState.treasury - startTreasury,
        totalBouts: quarterResults.reduce((sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.bouts, 0), 0),
        totalDeaths: quarterResults.reduce((sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.deaths, 0), 0),
      },
      stopReason: null,
    };
  },

  /**
   * Skip to quarter end (headless mode for UI)
   */
  skipToQuarterEnd(state: GameState, opts?: Omit<AdvanceOptions, 'checkpointInterval'>): QuarterAdvanceResult {
    return this.advanceQuarter(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },

  /**
   * Skip to year end (headless mode for UI)
   */
  skipToYearEnd(state: GameState, opts?: Omit<AdvanceOptions, 'checkpointInterval'>): YearAdvanceResult {
    return this.advanceYear(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },
};

export default TimeAdvanceService;
