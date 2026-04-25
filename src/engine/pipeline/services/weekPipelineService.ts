import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { archiveWeekLogs } from '../adapters/opfsArchiver';
import { computeMetaDrift } from '@/engine/metaDrift';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { resolveImpacts, StateImpact } from '@/engine/impacts';

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

  const warriorMap = new Map<string, Warrior>();
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
  ];
}

function checkBankruptcy(state: GameState, coreImpacts: StateImpact[]): boolean {
  const economyImpact = coreImpacts.find((i) => i.treasuryDelta !== undefined);
  const estimatedTreasury = state.treasury + (economyImpact?.treasuryDelta || 0);
  return estimatedTreasury < -500;
}

function collectRemainingImpacts(state: GameState, ctx: WeekContext): StateImpact[] {
  return [
    runWorldPass(state, ctx.nextWeek, ctx.rootRng),
    runRecruitmentPass(state, ctx.rootRng),
    runSystemPass(state, ctx.rootRng),
    runRankingsPass(state),
    runPromoterPass(state),
    runPromoterLifecyclePass(state, ctx.rootRng),
    runTrainerPass(state, ctx.rootRng),
    runRivalStrategyPass(state, ctx.nextWeek, ctx.rootRng),
    runEventPass(state, ctx.nextWeek, ctx.rootRng),
    runNarrativePass(state, ctx.currentWeek, ctx.nextWeek, ctx.rootRng),
    runSeasonalPass(state, ctx.nextWeek, ctx.rootRng),
  ];
}

function finalizeState(state: GameState, oldState: GameState, ctx: WeekContext): GameState {
  state.week = ctx.nextWeek;
  state.year = ctx.nextYear;
  state.day = 0;
  state.trainingAssignments = [];

  // 🧹 Bout offer cleanup — single source of truth for offer pruning.
  // The just-finished week's bouts have already fired in runBoutPhase, so
  // any offer with boutWeek <= just-finished week is done (fired, expired,
  // or rejected). Past Signed offers must be dropped or they accumulate
  // forever and break the matchmaker.
  if (state.boutOffers) {
    const cleanedOffers: Record<string, any> = {};
    const justFinishedWeek = ctx.nextWeek - 1;
    Object.values(state.boutOffers).forEach((offer) => {
      // Past offers (already fired or whose date has passed) — discard regardless of status
      if (offer.boutWeek <= justFinishedWeek) return;
      // Stale proposals that didn't get signed before their deadline — discard
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

  return archiveWeekLogs(state);
}

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export function advanceWeek(state: GameState): GameState {
  console.log(`>>> advanceWeek Start | Week: ${state.week}`);
  const ctx = prepareWeekContext(state);
  const settledState = runBoutPhase(state, ctx);
  const coreImpacts = collectCoreImpacts(settledState, ctx);

  if (checkBankruptcy(settledState, coreImpacts)) {
    return finalizeState(resolveImpacts(settledState, coreImpacts), state, ctx);
  }

  // Stage the pipeline: apply core impacts (training, aging, health) BEFORE
  // running the remaining passes so RivalStrategyPass et al. see aged rosters.
  // Previously every pass ran against the same pre-impact state and emitted
  // rivalsUpdates with the FULL rival object, so a later pass's stale roster
  // would clobber an earlier pass's roster mutation under mapMerge — aging
  // ticks were silently overwritten by RivalStrategyPass's snapshot, so ages
  // never advanced and no warrior ever reached retirement.
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  const remainingImpacts = collectRemainingImpacts(stateAfterCore, ctx);
  return finalizeState(resolveImpacts(stateAfterCore, remainingImpacts), state, ctx);
}
