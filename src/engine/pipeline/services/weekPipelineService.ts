import type { GameState, Warrior } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { archiveWeekLogs } from '../adapters/opfsArchiver';
import { computeMetaDrift } from '@/engine/metaDrift';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { resolveImpacts, StateImpact } from '@/engine/impacts';
import { getFeatureFlags } from '@/engine/featureFlags';

/**
 * Options for week advancement
 */
export interface WeekAdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) for headless mode */
  headless?: boolean;
  /** Defer OPFS archiving - accumulate logs in state instead of writing immediately */
  deferArchives?: boolean;
}

// 🌩️ Modular Pipeline Passes
import { runBoutSimulationPass } from '../passes/BoutSimulationPass';
import { runWarriorPass } from '../passes/WarriorPass';
import { runEconomyPass } from '../passes/EconomyPass';
import { runEquipmentPass } from '../passes/EquipmentPass';
import { runWorldPass } from '../passes/WorldPass';
import { runRecruitmentPass } from '../passes/RecruitmentPass';
import { runSystemPass } from '../passes/SystemPass';
import { runRankingsPass } from '../passes/RankingsPass';
import { runPromoterPass } from '../passes/PromoterPass';
import { runPromoterLifecyclePass } from '../passes/PromoterLifecyclePass';
import { runTrainerPass } from '../passes/TrainerPass';
import { runRivalStrategyPass } from '../passes/RivalStrategyPass';
import { runEventPass } from '../passes/EventPass';
import { runNarrativePass } from '../passes/NarrativePass';
import { runSeasonalPass } from '../seasonal';

interface WeekContext {
  currentWeek: number;
  nextWeek: number;
  nextYear: number;
  rootRng: IRNGService;
}

function prepareWeekContext(state: GameState): WeekContext {
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }
  return {
    currentWeek,
    nextWeek,
    nextYear,
    rootRng: new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101),
  };
}

function runBoutPhase(state: GameState, ctx: WeekContext): GameState {
  const metaDrift = computeMetaDrift(state.arenaHistory || []);
  const boutImpact = runBoutSimulationPass(state, ctx.rootRng);
  const settledState = resolveImpacts(state, [boutImpact]);
  settledState.cachedMetaDrift = metaDrift;

  const warriorMap = new Map<WarriorId, Warrior>();
  settledState.roster.forEach((w) => warriorMap.set(w.id, w));
  (settledState.rivals || []).forEach((r) => r.roster.forEach((w) => warriorMap.set(w.id, w)));
  settledState.warriorMap = warriorMap;

  return settledState;
}

function collectCoreImpacts(state: GameState, ctx: WeekContext): StateImpact[] {
  return [
    runWarriorPass(state, ctx.rootRng),
    runEconomyPass(state, ctx.rootRng),
    runEquipmentPass(state),
    // RecruitmentPass refills the draft pool. Must land before RivalStrategyPass
    // (which drains it) — otherwise both run in parallel against the same
    // pre-impact state and the post-recruitment pool gets clobbered by the
    // post-draft pool, leaving the pool empty every tick.
    runRecruitmentPass(state, ctx.rootRng),
  ];
}

function checkBankruptcy(state: GameState, coreImpacts: StateImpact[]): boolean {
  const economyImpact = coreImpacts.find((i) => i.treasuryDelta !== undefined);
  const estimatedTreasury = state.treasury + (economyImpact?.treasuryDelta || 0);
  return estimatedTreasury < -500;
}

function collectRemainingImpacts(state: GameState, ctx: WeekContext, opts?: WeekAdvanceOptions): StateImpact[] {
  const impacts: StateImpact[] = [
    runWorldPass(state, ctx.nextWeek, ctx.rootRng),
    runSystemPass(state, ctx.rootRng),
    runRankingsPass(state),
    runPromoterPass(state),
    runPromoterLifecyclePass(state, ctx.rootRng),
    runTrainerPass(state, ctx.rootRng),
    runRivalStrategyPass(state, ctx.nextWeek, ctx.rootRng),
  ];

  // In headless mode, skip expensive content generation passes
  if (!opts?.headless) {
    impacts.push(runEventPass(state, ctx.nextWeek, ctx.rootRng));
    impacts.push(runNarrativePass(state, ctx.currentWeek, ctx.nextWeek, ctx.rootRng));
  }

  impacts.push(runSeasonalPass(state, ctx.nextWeek, ctx.rootRng));
  return impacts;
}

function finalizeState(state: GameState, oldState: GameState, ctx: WeekContext, opts?: WeekAdvanceOptions): GameState {
  state.week = ctx.nextWeek;
  state.year = ctx.nextYear;
  state.day = 0;
  state.trainingAssignments = [];

  // 🧹 Bout offer cleanup — single source of truth for offer pruning.
  if (state.boutOffers) {
    const cleanedOffers: Record<string, any> = {};
    const justFinishedWeek = ctx.nextWeek - 1;
    Object.values(state.boutOffers).forEach((offer) => {
      if (offer.boutWeek <= justFinishedWeek) return;
      if (
        offer.status !== 'Signed' &&
        offer.expirationWeek != null &&
        offer.expirationWeek <= justFinishedWeek
      ) {
        return;
      }
      cleanedOffers[offer.id] = offer;
    });
    state.boutOffers = cleanedOffers;
  }

  if (state.season !== oldState.season) {
    state.seasonalGrowth = (state.seasonalGrowth ?? []).filter((sg) => sg.season === state.season);
  }

  // Handle OPFS archiving
  if (opts?.deferArchives) {
    // In batch mode, defer archives to state for later flushing
    // Accumulate bout logs in state.deferredBoutLogs
    const pendingArchives: Array<{year: number; season: number; boutId: string; transcript: string[]}> = [];
    for (const summary of state.arenaHistory || []) {
      if (summary.transcript && summary.transcript.length > 0 && summary.week === ctx.currentWeek) {
        const seasonIdx = ['Spring', 'Summer', 'Fall', 'Winter'].indexOf(state.season);
        pendingArchives.push({
          year: state.year,
          season: seasonIdx >= 0 ? seasonIdx : 0,
          boutId: summary.id,
          transcript: summary.transcript,
        });
        // Clear transcript to save memory
        summary.transcript = undefined;
      }
    }

    // Store in state for batch flushing
    (state as any).deferredBoutLogs = [...((state as any).deferredBoutLogs || []), ...pendingArchives];
    return state;
  }

  // Normal mode: archive immediately
  return archiveWeekLogs(state);
}

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export function advanceWeek(state: GameState, opts?: WeekAdvanceOptions): GameState {
  // Check feature flag for headless mode
  const flags = getFeatureFlags();
  const headless = flags.headlessWeekAdvance && opts?.headless;

  const ctx = prepareWeekContext(state);
  const settledState = runBoutPhase(state, ctx);
  const coreImpacts = collectCoreImpacts(settledState, ctx);

  if (checkBankruptcy(settledState, coreImpacts)) {
    return finalizeState(resolveImpacts(settledState, coreImpacts), state, ctx, { deferArchives: opts?.deferArchives });
  }

  // Stage the pipeline: apply core impacts BEFORE running remaining passes
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  const remainingImpacts = collectRemainingImpacts(stateAfterCore, ctx, { headless });
  return finalizeState(resolveImpacts(stateAfterCore, remainingImpacts), state, ctx, { deferArchives: opts?.deferArchives });
}
