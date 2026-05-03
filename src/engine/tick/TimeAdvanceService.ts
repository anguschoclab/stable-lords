import type { GameState } from '@/types/state.types';
import {
  advanceWeek,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';
import { flushDeferredArchives } from '@/engine/pipeline/adapters/opfsArchiver';
import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/telemetry';

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
      case 'noPairings': {
        // Check if there are no eligible fighters
        const hasEligible = state.roster.some(
          (w) => w.status === 'Active' && !w.isDead && (!w.injuries || w.injuries.length === 0)
        );
        if (!hasEligible) {
          return { shouldStop: true, reason: 'no_pairings' };
        }
        break;
      }
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
 * Unified Time Advance Service
 * Central point for all time-based progression with batch support
 */
export const TimeAdvanceService = {
  /**
   * Advance a single week
   */
  advanceWeek(state: GameState, opts?: AdvanceOptions): GameState {
    const weekOpts: WeekAdvanceOptions = {
      headless: opts?.headless,
      deferArchives: opts?.deferArchives,
    };
    return advanceWeek(state, weekOpts);
  },

  /**
   * Advance a quarter (13 weeks)
   * Guarantees determinism: 13 sequential advanceWeek calls produce identical state
   */
  async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    const startTime = performance.now();

    let currentState = state;
    const weekSummaries: WeekSummary[] = [];
    const startTreasury = state.treasury;
    const startWeek = state.week;
    const startYear = state.year;

    const checkpointInterval = opts?.checkpointInterval ?? 4;

    for (let i = 0; i < 13; i++) {
      // Advance one week using the core pipeline with options
      const weekOpts: WeekAdvanceOptions = {
        headless: opts?.headless,
        deferArchives: opts?.deferArchives,
      };
      currentState = advanceWeek(currentState, weekOpts);

      // Extract summary
      weekSummaries.push(extractWeekSummary(currentState));

      // Checkpoint evaluation
      if (opts?.stopConditions && (i + 1) % checkpointInterval === 0) {
        const stopResult = evaluateStopConditions(currentState, opts.stopConditions);
        if (stopResult.shouldStop) {
          // Flush any deferred archives before returning
          if (opts.deferArchives) {
            const flushStart = performance.now();
            await flushDeferredArchives(currentState);
            telemetry.timing(
              TelemetryEvents.FLUSH_DEFERRED_ARCHIVES,
              performance.now() - flushStart
            );
          }

          const duration = performance.now() - startTime;
          telemetry.timing(TelemetryEvents.ADVANCE_QUARTER, duration, {
            [TelemetryTags.HEADLESS]: String(!!opts?.headless),
            [TelemetryTags.STOP_REASON]: stopResult.reason ?? 'unknown',
            [TelemetryTags.WEEKS_COMPLETED]: String(i + 1),
          });
          telemetry.increment(TelemetryEvents.STOP_CONDITION_TRIGGERED, {
            reason: stopResult.reason ?? 'unknown',
          });

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
      const flushStart = performance.now();
      await flushDeferredArchives(currentState);
      telemetry.timing(TelemetryEvents.FLUSH_DEFERRED_ARCHIVES, performance.now() - flushStart);
    }

    const duration = performance.now() - startTime;
    telemetry.timing(TelemetryEvents.ADVANCE_QUARTER, duration, {
      [TelemetryTags.HEADLESS]: String(!!opts?.headless),
      [TelemetryTags.WEEKS_COMPLETED]: '13',
    });
    telemetry.increment(TelemetryEvents.ADVANCE_QUARTER_SUCCESS, {
      [TelemetryTags.HEADLESS]: String(!!opts?.headless),
    });

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
  async advanceYear(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    let currentState = state;
    const quarterResults: QuarterAdvanceResult[] = [];
    const startYear = state.year;
    const startTreasury = state.treasury;

    for (let q = 0; q < 4; q++) {
      const result = await this.advanceQuarter(currentState, opts);
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
            totalBouts: quarterResults.reduce(
              (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.bouts, 0),
              0
            ),
            totalDeaths: quarterResults.reduce(
              (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.deaths, 0),
              0
            ),
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
        totalBouts: quarterResults.reduce(
          (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.bouts, 0),
          0
        ),
        totalDeaths: quarterResults.reduce(
          (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.deaths, 0),
          0
        ),
      },
      stopReason: null,
    };
  },

  /**
   * Skip to quarter end (headless mode for UI)
   */
  async skipToQuarterEnd(
    state: GameState,
    opts?: Omit<AdvanceOptions, 'checkpointInterval'>
  ): Promise<QuarterAdvanceResult> {
    return this.advanceQuarter(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },

  /**
   * Skip to year end (headless mode for UI)
   */
  async skipToYearEnd(
    state: GameState,
    opts?: Omit<AdvanceOptions, 'checkpointInterval'>
  ): Promise<YearAdvanceResult> {
    return this.advanceYear(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },
};

export default TimeAdvanceService;
