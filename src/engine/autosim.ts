import { type GameState } from '@/types/state.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from './impacts';
import {
  TimeAdvanceService,
  type SoftStopCondition,
} from './tick/TimeAdvanceService';

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
  stopDetail: string;
  weekSummaries: AutosimWeekSummary[];
}

/**
 * Default stop conditions for autosim
 */
export const DEFAULT_AUTOSIM_STOP_CONDITIONS: SoftStopCondition[] = [
  { type: 'rosterEmpty' },
  { type: 'noPairings' },
];

/**
 * Convert TimeAdvanceService stop reasons to autosim stop reasons
 */
function mapStopReason(reason: string | null | undefined): AutosimResult['stopReason'] {
  switch (reason) {
    case 'roster_empty':
    case 'no_pairings':
      return 'no_pairings';
    case 'player_death':
      return 'death';
    case 'custom_condition':
      return 'injury';
    default:
      return 'max_weeks';
  }
}

export interface AutosimOptions {
  weeksToSim: number;
  onProgress?: (current: number, total: number) => void;
  /** Use batch (quarter/year) advancement for better performance. */
  useBatchMode?: boolean;
  /** Defer OPFS archiving during simulation */
  deferArchives?: boolean;
}

/**
 * Process player bout offers after week advancement
 */
function processPlayerOffers(state: GameState): GameState {
  const playerOffers = Object.values(state.boutOffers).filter(
    (o) =>
      o.status === 'Proposed' && o.warriorIds.some((id) => state.roster.some((w) => w.id === id))
  );

  playerOffers.forEach((offer) => {
    const playerWarriorId = offer.warriorIds.find((id) => state.roster.some((w) => w.id === id));
    if (!playerWarriorId) return;
    // Auto-accept logical offers (Hype > 100 or Purse > 200)
    if (offer.hype > 100 || offer.purse > 200) {
      const impact = respondToBoutOffer(state, offer.id, playerWarriorId, 'Accepted');
      state = resolveImpacts(state, [impact]);
    }
  });

  return state;
}

/**
 * Extract week summary from state after advancement
 */
function extractWeekSummary(state: GameState, weekNumber: number): AutosimWeekSummary {
  const boutSummaries = state.lastSimulationReport?.bouts ?? [];
  const deathNames = boutSummaries
    .filter((b) => b.by === 'Kill')
    .map((b) => (b.winner === 'A' ? b.d : b.a));

  return {
    week: weekNumber,
    bouts: boutSummaries.length,
    deaths: deathNames.length,
    injuries: 0, // Injuries not tracked per-week currently
    deathNames,
    injuryNames: [],
  };
}

/**
 * Check bankruptcy condition
 */
function checkBankruptcy(state: GameState): boolean {
  return state.treasury < -500;
}

/**
 * Run autosim using sequential week advancement (original behavior)
 */
async function runSequentialAutosim(
  initialState: GameState,
  weeksToSim: number,
  onProgress?: (current: number, total: number) => void,
  deferArchives?: boolean
): Promise<AutosimResult> {
  let state = initialState;
  let weeksSimmed = 0;
  const weekSummaries: AutosimWeekSummary[] = [];

  for (let i = 0; i < weeksToSim; i++) {
    // 1. Advance Week with headless mode and optional deferred archives
    state = advanceWeek(state, {
      headless: true,
      deferArchives,
    });

    // 2. Auto-Respond to Player Contracts
    state = processPlayerOffers(state);

    // 3. Extract week summary
    weekSummaries.push(extractWeekSummary(state, state.week));
    weeksSimmed++;

    if (onProgress) {
      onProgress(weeksSimmed, weeksToSim);
    }

    // 4. Stop conditions
    if (checkBankruptcy(state)) {
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
  }

  return {
    finalState: state,
    weeksSimmed,
    stopReason: 'max_weeks',
    stopDetail: 'Reached maximum simulation weeks',
    weekSummaries,
  };
}

/**
 * Run autosim using batch (quarter) advancement for better performance
 */
async function runBatchAutosim(
  initialState: GameState,
  weeksToSim: number,
  onProgress?: (current: number, total: number) => void,
  deferArchives?: boolean
): Promise<AutosimResult> {
  let state = initialState;
  let weeksSimmed = 0;
  const weekSummaries: AutosimWeekSummary[] = [];

  // Process in quarter chunks (13 weeks)
  const fullQuarters = Math.floor(weeksToSim / 13);
  const remainingWeeks = weeksToSim % 13;

  for (let q = 0; q < fullQuarters && weeksSimmed < weeksToSim; q++) {
    const weeksInThisQuarter = Math.min(13, weeksToSim - weeksSimmed);

    // Run quarter with stop conditions
    const result = await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
      deferArchives,
      stopConditions: DEFAULT_AUTOSIM_STOP_CONDITIONS,
      checkpointInterval: 1,
      onProgress: onProgress
        ? (completed) => onProgress(weeksSimmed + completed, weeksToSim)
        : undefined,
    });

    // Extract summaries from quarter result
    for (const summary of result.summaries.slice(0, weeksInThisQuarter)) {
      // Reconstruct week summaries from quarter data
      // Note: In batch mode we lose per-week bout details, only get aggregated
      weekSummaries.push({
        week: summary.week,
        bouts: summary.bouts,
        deaths: summary.deaths,
        injuries: 0,
        deathNames: [], // Not available in batch summaries
        injuryNames: [],
      });
    }

    weeksSimmed += result.weeksCompleted;
    state = result.state;

    // Process any player offers that accumulated during the quarter
    // Note: This is approximate - offers are processed at quarter end, not per-week
    state = processPlayerOffers(state);

    // Check stop conditions
    if (checkBankruptcy(state)) {
      return {
        finalState: state,
        weeksSimmed,
        stopReason: 'bankrupt',
        stopDetail: 'Stable ran out of treasury',
        weekSummaries,
      };
    }

    if (result.stopReason) {
      return {
        finalState: state,
        weeksSimmed,
        stopReason: mapStopReason(result.stopReason),
        stopDetail: `Stopped: ${result.stopReason}`,
        weekSummaries,
      };
    }
  }

  // Handle remaining weeks (less than a quarter)
  if (remainingWeeks > 0 && weeksSimmed < weeksToSim) {
    const sequentialResult = await runSequentialAutosim(
      state,
      remainingWeeks,
      onProgress ? (c, t) => onProgress(weeksSimmed + c, weeksToSim) : undefined,
      deferArchives
    );

    return {
      finalState: sequentialResult.finalState,
      weeksSimmed: weeksSimmed + sequentialResult.weeksSimmed,
      stopReason: sequentialResult.stopReason,
      stopDetail: sequentialResult.stopDetail,
      weekSummaries: [...weekSummaries, ...sequentialResult.weekSummaries],
    };
  }

  return {
    finalState: state,
    weeksSimmed,
    stopReason: 'max_weeks',
    stopDetail: 'Reached maximum simulation weeks',
    weekSummaries,
  };
}

/**
 * Main autosim entry point
 * Supports both sequential and batch modes
 */
export async function runAutosim(
  initialState: GameState,
  options: number | AutosimOptions,
  legacyOnProgress?: (current: number, total: number) => void
): Promise<AutosimResult> {
  // Handle legacy call signature: runAutosim(state, weeksToSim, onProgress)
  let weeksToSim: number;
  let onProgress: ((current: number, total: number) => void) | undefined;
  let useBatchMode = false;
  let deferArchives = false;

  if (typeof options === 'number') {
    weeksToSim = options;
    onProgress = legacyOnProgress;
  } else {
    weeksToSim = options.weeksToSim;
    onProgress = options.onProgress;
    useBatchMode = options.useBatchMode ?? false;
    deferArchives = options.deferArchives ?? false;
  }

  // Use batch mode if requested
  if (useBatchMode) {
    return runBatchAutosim(initialState, weeksToSim, onProgress, deferArchives);
  }

  // Default: sequential mode
  return runSequentialAutosim(initialState, weeksToSim, onProgress, deferArchives);
}
